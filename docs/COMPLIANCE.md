<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Licence compliance

This repository distributes software under the GNU General Public License, version 3 or later. This page
records what the licences require, how each requirement is met, and what must be checked before a release.
It is a working record for the maintainers. It is not legal advice, and a lawyer should review it before the
first public release.

## What is distributed

One package per platform, `amble-espeak-ng-<platform>-<version>.zip`, containing the **unmodified** upstream
eSpeak NG program, library and language data, the four upstream licence texts, `SOURCE.txt` and a
`manifest.json` of file hashes. Nothing in the package is changed from upstream's release. Only the Windows
x64 package is built today; upstream publishes no Linux or macOS binaries.

| Component | Licence | Where the text is |
| --- | --- | --- |
| eSpeak NG program, library, language data | GPL-3.0-or-later | `COPYING` |
| Bundled Apache-licensed components | Apache-2.0 | `COPYING.APACHE` |
| `getopt` compatibility code (Windows) | BSD-2-Clause | `COPYING.BSD2` |
| Unicode data files | Unicode terms | `COPYING.UCD` |

The scripts, documents and workflow in this repository are licensed GPL-3.0-or-later (see `COPYING`).

## GPL-3.0 requirements and how they are met

| Requirement | How it is met |
| --- | --- |
| Give recipients the licence (section 4, 5) | `COPYING` and the other three texts are inside every package, unchanged and hash-pinned in `scripts/licenses.mjs`. The verifier fails a package without them. |
| Keep copyright and warranty notices (section 4) | Upstream files are not edited. `SOURCE.txt` states the no-warranty text and names the authors. |
| Convey object code only with the Corresponding Source (section 6) | The source archive for exactly the shipped version is attached to the **same release**, next to the package, with a notice directing users to it. This is section 6(d). |
| Source stays available (section 6(d)) | Releases are not deleted while the package is offered. If a release is withdrawn, its source is withdrawn with it. |
| Written offer as a fallback | `SOURCE.txt` and `SOURCE-OFFER.md` offer the source by written request for at least three years. |
| Do not impose further restrictions (section 10) | The package adds no terms. Recipients may use, change and redistribute it under the GPL. |
| Indicate changes (section 5(a)) | There are none. Any future change must be marked and published as source. |
| Patent licence (section 11) | Nothing is added to eSpeak NG. Contributors' grants pass on as upstream gives them. |

## Why Amble is not covered by the GPL

The Amble application talks to this program only as a separate process: it starts the executable with fixed
arguments, writes text to its standard input and reads phonemes from its standard output. It does not link
the library, load it into its own process, copy its code or share data structures with it. The Free Software
Foundation's FAQ treats a program that communicates with another over pipes and command lines as ordinarily a
separate program, and distributing the two together or one after the other as an aggregate. The Amble code
that does this is in the Amble repository, outside this one, and contains no eSpeak NG code. A small
phoneme-mapping table there is from the Apache-2.0 `misaki` project, not from eSpeak NG.

Conditions that keep this true, and must not change without review:

1. The add-on stays a separate executable. Never link `libespeak-ng` into Amble.
2. The Amble installer, application bundles and core releases do not contain this package.
3. The add-on is downloaded only when a person asks for it, from this repository's releases.
4. Mobile apps never contain it. It runs on the computer that hosts Amble, so the app stores' terms do not
   meet the GPL here.

## Release checklist

Do these before publishing any release. The workflow creates a **draft** so a person publishes it.

- [ ] A lawyer has reviewed this page and approved distribution.
- [ ] `SOURCE-OFFER.md` has a real contact address (the workflow fails while the placeholder remains).
- [ ] The tag, `package.json` version and package revision agree.
- [ ] `node scripts/verify.mjs` passes on the built zip.
- [ ] The release holds the package, `espeak-ng-<version>-source.tar.gz` and `SHA256SUMS.txt`, and the notes
      link to this page.
- [ ] The source archive was made from the commit named in `SOURCE.txt`.
- [ ] Amble's `PRONUNCIATION_ADDON_RELEASES` is updated with the published zip's SHA-256 and size.

## Names and endorsement

"eSpeak" and "eSpeak NG" name the upstream project. They are used only to say what the package contains.
Amble is not affiliated with the eSpeak NG authors and they do not endorse it. Do not use their names or
logos to suggest otherwise.

## Open questions for counsel

1. Is redistributing upstream's published Windows build, with the tagged source as its Corresponding Source,
   enough, or must the source archive include the installer's build scripts and tools?
2. Is a pipe-and-command-line boundary enough separation for a proprietary host application, given how little
   data crosses it?
3. Is a section 6(d) release asset plus a three-year written offer the right pair, and is the contact address
   adequate?
