#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Checks a built add-on zip without unpacking it to disk: the manifest is well formed, lists every member,
// every hash and size matches, and the licence and source notices are present. CI runs this before a release.
//
//   node scripts/verify.mjs <package.zip>
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { LICENSE_FILES } from "./licenses.mjs";

function fail(message) {
  console.error(`verify: ${message}`);
  process.exit(1);
}

const file = process.argv[2];
if (!file) fail("usage: verify.mjs <package.zip>");
const zip = await JSZip.loadAsync(await readFile(file));
const prefix = "espeak-ng/";
const members = new Map();
zip.forEach((name, entry) => {
  if (entry.dir) return;
  if (!name.startsWith(prefix) || name.includes("..") || name.includes("\\")) fail(`unexpected member ${name}`);
  members.set(name.slice(prefix.length), entry);
});

const manifestEntry = members.get("manifest.json");
if (!manifestEntry) fail("manifest.json is missing");
const manifest = JSON.parse(await manifestEntry.async("string"));
if (manifest.schemaVersion !== 1) fail("unsupported manifest version");
if (manifest.license !== "GPL-3.0-or-later") fail("licence record is not GPL-3.0-or-later");
if (typeof manifest.platform !== "string" || typeof manifest.executable !== "string")
  fail("manifest is missing the platform or executable");

const listed = new Map(manifest.files.map((entry) => [entry.path, entry]));
for (const name of members.keys()) {
  if (name !== "manifest.json" && !listed.has(name)) fail(`${name} is in the package but not the manifest`);
}
for (const [name, entry] of listed) {
  const member = members.get(name);
  if (!member) fail(`${name} is in the manifest but not the package`);
  const bytes = await member.async("nodebuffer");
  if (bytes.length !== entry.bytes) fail(`${name} has an unexpected size`);
  if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256) fail(`${name} does not match its hash`);
}
if (!listed.has(manifest.executable)) fail("the executable is not in the manifest");
for (const [name, sha256] of LICENSE_FILES) {
  if (listed.get(name)?.sha256 !== sha256) fail(`${name} is missing or is not the pinned upstream text`);
}
if (!listed.has("SOURCE.txt")) fail("SOURCE.txt is missing");
if (![...listed.keys()].some((name) => name.startsWith("espeak-ng-data/"))) fail("language data is missing");
console.log(`verify: ok (${listed.size} files)`);
