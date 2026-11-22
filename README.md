<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Amble pronunciation add-on (eSpeak NG)

An optional add-on for [Amble](https://github.com/AmbleCode/amble-releases). It lets Amble's local read-aloud
voices speak Spanish, French, Hindi, Italian and Brazilian Portuguese with native pronunciation. Without it,
Amble still works and reads those voices with English pronunciation.

This repository builds and releases the add-on as a **separate download**. It contains the unmodified
[eSpeak NG](https://github.com/espeak-ng/espeak-ng) program, which is GPL-3.0-or-later. It is kept apart from
Amble on purpose: Amble starts it as its own process and never links it, so Amble itself is not under the GPL.
See [docs/COMPLIANCE.md](docs/COMPLIANCE.md).

## Status

Not yet released. The package builds and verifies, but nothing has been published, the release workflow has
not been run, and the licence review in the checklist is outstanding. Windows x64 is the only platform; upstream
ships no Linux or macOS binaries.

## What is in a release

| Asset | What it is |
| --- | --- |
| `amble-espeak-ng-<platform>-<version>.zip` | The add-on package: program, library, language data, all four licence texts, `SOURCE.txt`, `manifest.json` |
| `espeak-ng-<version>-source.tar.gz` | The complete corresponding source for exactly that version |
| `SHA256SUMS.txt` | SHA-256 of both |

## How Amble uses it

Amble downloads the zip only when a person asks for it, checks its SHA-256 against a value built into Amble,
unpacks it beside its speech models and checks every file against `manifest.json` before running anything. A
changed, missing or extra file means the add-on is not used. Removing it returns the voices to English
pronunciation.

## Build and verify

Windows with Node 20 or later:

```sh
npm ci
node scripts/build.mjs --out dist --download
node scripts/verify.mjs dist/amble-espeak-ng-win32-x64-1.52.0-1.zip
```

`build.mjs` fetches upstream's published installer, checks its pinned SHA-256, unpacks it into a temporary
folder without installing it, copies only the expected files and adds upstream's licence texts. It changes
nothing in eSpeak NG.

## Getting the source

Every release carries the matching source archive, and [SOURCE-OFFER.md](SOURCE-OFFER.md) explains how to ask
for it in writing.

## Licence

The scripts and documents here are GPL-3.0-or-later; see [COPYING](COPYING). eSpeak NG and its bundled
components keep their own licences; see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). This is not an
official eSpeak NG distribution, and its authors do not endorse it.
