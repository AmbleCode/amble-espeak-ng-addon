<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Third-party notices

The add-on package carries software from the eSpeak NG project, unmodified, version 1.52.0, source commit
`4870adfa25b1a32b4361592f1be8a40337c58d6c`, tag `1.52.0`:
<https://github.com/espeak-ng/espeak-ng/tree/1.52.0>

| Part | Licence | Text in the package |
| --- | --- | --- |
| eSpeak NG program, library and language data | GNU General Public License, version 3 or later | `COPYING` |
| Components under the Apache License | Apache License 2.0 | `COPYING.APACHE` |
| `getopt` compatibility implementation (from NetBSD) | BSD 2-Clause | `COPYING.BSD2` |
| Unicode data files | Unicode data files terms | `COPYING.UCD` |

Each text is upstream's own, byte for byte; `scripts/licenses.mjs` pins the SHA-256 of all four and
`scripts/verify.mjs` fails a package that lacks any of them.

eSpeak NG has many contributors; their copyright notices are in the upstream source and are not altered here.
The source archive in each release is the complete corresponding source for that release.

The language data files for each supported language were written by the eSpeak NG authors and are covered by
the GPL as above.
