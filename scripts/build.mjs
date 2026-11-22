#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Builds the Windows add-on package from the pinned, unmodified upstream eSpeak NG installer.
//
//   node scripts/build.mjs --out <empty directory> (--msi <file> | --download)
//
// Nothing is installed: the MSI is unpacked into a new temporary folder (administrative extract), only the
// reviewed program, library and data are copied, and the upstream licence texts are added unchanged. Every
// file is hashed into manifest.json. The output is one zip and its SHA-256, ready to attach to a release
// together with the matching source archive (see docs/COMPLIANCE.md). Linux and macOS packages are not built
// here; upstream publishes no binaries for them.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, lstat, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import JSZip from "jszip";
import { LICENSE_FILES } from "./licenses.mjs";

export const VERSION = "1.52.0";
export const PACKAGE_REVISION = "1";
export const PLATFORM = "win32-x64";
export const SOURCE_COMMIT = "4870adfa25b1a32b4361592f1be8a40337c58d6c";
const MSI_URL = `https://github.com/espeak-ng/espeak-ng/releases/download/${VERSION}/espeak-ng.msi`;
const MSI_SHA256 = "7f673c709ea5dd579d3b5ebb98688cc575328a6ab7438d2bc405b88cedaeafb9";
const RAW = `https://raw.githubusercontent.com/espeak-ng/espeak-ng/${VERSION}`;
const MAX_FILES = 2_000;
const TOP_LEVEL = new Set(["espeak-ng.exe", "libespeak-ng.dll", "espeak-ng-data"]);
const ARCHIVE = `amble-espeak-ng-${PLATFORM}-${VERSION}-${PACKAGE_REVISION}.zip`;
const SOURCE_ARCHIVE = `espeak-ng-${VERSION}-source.tar.gz`;

function fail(message) {
  console.error(`build: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { out: undefined, msi: undefined, download: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out.out = argv[++i];
    else if (argv[i] === "--msi") out.msi = argv[++i];
    else if (argv[i] === "--download") out.download = true;
    else fail(`unknown argument ${argv[i]}`);
  }
  if (!out.out || (!out.msi && !out.download)) fail("usage: --out <dir> (--msi <file> | --download)");
  return out;
}

async function sha256File(file) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(file), hash);
  return hash.digest("hex");
}

async function download(url, destination) {
  const response = await fetch(url, { redirect: "follow", credentials: "omit" });
  if (!response.ok || !response.url.startsWith("https://")) fail(`download failed: ${url}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function listFiles(root, relative = "") {
  const files = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const next = relative ? `${relative}/${entry.name}` : entry.name;
    const info = await lstat(path.join(root, next));
    if (info.isSymbolicLink()) fail(`unexpected link in the installer: ${next}`);
    if (info.isDirectory()) files.push(...(await listFiles(root, next)));
    else if (info.isFile()) files.push(next);
    else fail(`unexpected member in the installer: ${next}`);
  }
  return files;
}

function sourceNotice() {
  return [
    `eSpeak NG ${VERSION} (GPL-3.0-or-later) and its bundled third-party components.`,
    "",
    "This package carries the unmodified upstream Windows build of eSpeak NG. Amble runs it only as a",
    "separate program; it is not part of Amble and Amble does not link it.",
    "",
    "LICENCES  COPYING (GPL-3.0-or-later, the program and its language data), COPYING.APACHE (Apache-2.0),",
    "          COPYING.BSD2 (BSD-2-Clause) and COPYING.UCD (Unicode data files). Each is the upstream text.",
    "",
    "SOURCE    The complete corresponding source for exactly this version is published beside this package, in",
    `the same release, as ${SOURCE_ARCHIVE} (a git archive of upstream commit ${SOURCE_COMMIT}, tag ${VERSION}).`,
    "It is available at no charge for as long as the package is. Upstream's repository is",
    `  https://github.com/espeak-ng/espeak-ng/tree/${VERSION}`,
    "",
    "WRITTEN OFFER  If you received this package and cannot get that archive, write to the address in",
    "SOURCE-OFFER.md of the repository named in README.md and the source will be sent for the cost of",
    "doing so, for at least three years after you received the package.",
    "",
    "NO WARRANTY  This program comes with ABSOLUTELY NO WARRANTY, to the extent permitted by law.",
    "eSpeak NG is the work of its authors. Amble is not affiliated with them and they do not endorse it.",
    "",
  ].join("\n");
}

async function main() {
  if (process.platform !== "win32") fail("this builder uses msiexec and runs on Windows only");
  const options = parseArgs(process.argv.slice(2));
  const work = await mkdtemp(path.join(os.tmpdir(), "espeak-addon-build-"));
  try {
    const msi = options.msi ? path.resolve(options.msi) : path.join(work, "espeak-ng.msi");
    if (!options.msi) await download(MSI_URL, msi);
    if ((await sha256File(msi)) !== MSI_SHA256) fail("the installer does not match the pinned SHA-256");

    const stage = path.join(work, "package");
    await mkdir(stage, { recursive: true });
    for (const [name, sha256] of LICENSE_FILES) {
      await download(`${RAW}/${name}`, path.join(stage, name));
      if ((await sha256File(path.join(stage, name))) !== sha256)
        fail(`${name} does not match its pinned SHA-256`);
    }

    const extracted = path.join(work, "extracted");
    await mkdir(extracted);
    const run = spawnSync("msiexec", ["/a", msi, "/qn", `TARGETDIR=${extracted}`], { windowsHide: true });
    if (run.status !== 0) fail(`msiexec could not unpack the installer (exit ${run.status})`);
    const root = path.join(extracted, "eSpeak NG");
    const names = await readdir(root);
    if (names.length !== TOP_LEVEL.size || names.some((name) => !TOP_LEVEL.has(name)))
      fail(`the installer layout is not the reviewed one: ${names.join(", ")}`);
    const members = await listFiles(root);
    if (members.length > MAX_FILES) fail("the installer holds more files than expected");

    const packaged = LICENSE_FILES.map(([name]) => name);
    for (const name of members) {
      const target = path.join(stage, ...name.split("/"));
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(root, ...name.split("/")), target);
      packaged.push(name);
    }
    await writeFile(path.join(stage, "SOURCE.txt"), sourceNotice());
    packaged.push("SOURCE.txt");

    const files = [];
    for (const name of packaged.sort()) {
      const full = path.join(stage, ...name.split("/"));
      files.push({ path: name, sha256: await sha256File(full), bytes: (await lstat(full)).size });
    }
    const manifest = {
      schemaVersion: 1,
      platform: PLATFORM,
      license: "GPL-3.0-or-later",
      version: VERSION,
      executable: "espeak-ng.exe",
      // The folder that holds `espeak-ng-data`; "." is the package root.
      dataDir: ".",
      files,
    };
    await writeFile(path.join(stage, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

    const zip = new JSZip();
    for (const name of [...packaged, "manifest.json"])
      zip.file(`espeak-ng/${name}`, await readFile(path.join(stage, ...name.split("/"))));
    const bytes = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
    const outDir = path.resolve(options.out);
    await mkdir(outDir, { recursive: true });
    if ((await readdir(outDir)).length > 0) fail("the output directory must be empty");
    await writeFile(path.join(outDir, ARCHIVE), bytes);
    const digest = createHash("sha256").update(bytes).digest("hex");
    console.log(JSON.stringify({ archive: ARCHIVE, sha256: digest, bytes: bytes.length, files: files.length }, null, 2));
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

await main();
