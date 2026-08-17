# Compliance Tracking -- Multi-Framework Assessment

> Part of [CISO Toolbox](https://www.cisotoolbox.org) -- open-source security tools for CISOs.


> **This is the browser-only version** — everything runs in your browser,
> data never leaves it (localStorage + JSON export). Perfect for solo use,
> evaluation, consulting on client data, or air-gapped contexts. Need
> accounts, a shared database, an API and multi-user work? The **standalone
> backend** of the same module lives at the [root of this repository](../)
> — same features, same data format, a JSON export moves your work from one
> to the other. See *One repository, two versions* in the main README.

## Features

- Multi-framework compliance tracking with simultaneous assessment
- Built-in frameworks: ANSSI Hygiene Guide (42), ISO 27001 (120), ReCyF/NIS2 (11), SOC 2, DORA, LPM, SecNumCloud, HDS, GAMP 5, Law 05-20, Cyber Resilience Act
- Custom CSV framework import for proprietary or sector-specific standards
- Dashboard with radar charts and consolidated compliance view
- Measure tracking with conformity sliders and linked requirements
- Evidence management with expiry tracking and 90-day alerts
- 71 pre-defined template measures covering all built-in frameworks
- Import from EBIOS RM (context, compliance, measures)
- AI assistant (Anthropic Claude / OpenAI GPT)
- AES-256-GCM encrypted snapshots (PBKDF2 250k iterations)
- Bilingual FR/EN with lazy-loaded translations

## Quick Start

1. Visit [compliance.cisotoolbox.org](https://compliance.cisotoolbox.org) or clone this repo
2. Open `index.html` in a browser
3. Start a new assessment — the repository ships no demo dataset for now (new ones will be generated later)
4. No backend, no account required

## Architecture

- 100% client-side vanilla JS -- no framework, no build step
- Data stored in browser (localStorage autosave + file download for persistence)
- Event delegation via `data-click` attributes (CSP compliant, no inline handlers)
- Lazy-loaded assets: framework controls and descriptions loaded on demand
- Shared libraries: `cisotoolbox.js`, `i18n.js`, `ai_common.js`, `referentiels_catalog.js`

## Import / Export

| Format | Import | Export |
|--------|--------|--------|
| JSON | Yes | Yes |
| Encrypted JSON (AES-256-GCM) | Yes | Yes |
| EBIOS RM JSON | Yes | -- |
| Custom framework (CSV) | Yes | -- |

## Screenshots

_Coming soon_

## Links

- Website: https://compliance.cisotoolbox.org
- CISO Toolbox: https://www.cisotoolbox.org

## Need more than a browser app?

This app is intentionally **100% browser-local** — your data never leaves
your machine. If you outgrow it, the same module exists in two server-backed
flavours:

- **Standalone backend** (accounts, PostgreSQL, REST API, Docker):
  the `-standalone` distribution of this repo — see `STANDALONE.md` /
  `ghcr.io/cisotoolbox/ciso-compliance:latest`.
- **Governance suite**: all CISO Toolbox modules integrated behind Pilot
  (SSO, shared user directory, consolidated action plan, centralized
  backups and point-in-time restore) — see https://www.cisotoolbox.org.

Your JSON exports from this app import as-is into both.

## Running it locally

This is a static, frontend-only application — no backend, no account, no build
step.

```bash
git clone <this repo>
cd compliance
python3 -m http.server 8080      # any static file server will do
```

Then open <http://127.0.0.1:8080/>.

Opening `index.html` directly from the filesystem (`file://`) works for the
basic UI, but the browser blocks `fetch()` on local files, so `demo-*.json` and
the lazy-loaded frameworks will not load. Prefer a static server.

## Deploying behind a web server

The app ships with **no security headers of its own** — they belong to the web
server that serves the files. Two ready-to-use configs are included so a
deployment is never published bare:

- **Apache**: copy `.htaccess.example` to `.htaccess`. It sets a strict
  Content-Security-Policy (`script-src 'self'`, no framing), `X-Frame-Options`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  blocks dotfiles, and redirects HTTP to HTTPS. `.htaccess` itself is
  git-ignored because the HTTP→HTTPS rule is host-specific — the `.example` is
  the versioned source.
- **nginx**: `include` the provided `nginx-security.conf.example` inside the
  `server{}` block that serves the app (see the header of that file). Same CSP
  and headers as the Apache config — keep the two in sync if you edit the CSP.

Without one of these, the browser runs the app with no CSP: do not expose the
static files directly. The `python3 -m http.server` above is for local use only.

## Where your data lives

| What | Where | Lifetime |
|------|-------|----------|
| Work in progress (autosave) | `localStorage["compliance_autosave_v2"]` | Until you clear the browser storage |
| Snapshots | `localStorage["compliance_autosave_v2_snapshots"]` (optionally AES-256-GCM encrypted) | Same |
| UI preferences | `localStorage["ct_lang"]`, `localStorage["ct_theme"]` | Same |
| Your real deliverable | **A file on your own disk**, via *File → Save* | Yours |
| AI provider API key (optional) | `localStorage`, sent only to the provider you configured | Until you clear it |

**Persistence is file-based.** The browser copy is a convenience buffer, not a
backup: a cleared profile, a private window or a different machine means an
empty app. Save to a `.json` (or AES-256-GCM encrypted `.ctenc`) file and keep
that file wherever you keep your other security deliverables. Nothing is ever
sent to a server — there is no server.

## Repository layout

```
css/                  # 2 files
e2e/                  # 4 files
js/                   # 34 files
skill/                # 1 file
ts/                   # 35 files
.replicated-files
ARCHITECTURE.md
CONTRIBUTING.md
LICENSE
README.md
SECURITY.md
favicon.svg
index.html
logo.svg
tsconfig.json
```

## Replicated files

The design system and the cross-module libraries (`js/cisotoolbox*.js`,
`js/i18n.js`, `js/ai_common.js`, `js/ct_*.js`, `css/cisotoolbox.css`,
`ts/types/*.d.ts`) are **replicated from a private shared repository** and
carry a `REPLICATED … do not edit here` banner. They are regenerated and
overwritten on each sync — see [`.replicated-files`](.replicated-files) for the
exact list and [CONTRIBUTING.md](CONTRIBUTING.md) for what to do if you find a
bug in one of them.

## Tests

```bash
cd e2e && npm install && npx playwright install chromium && npm test
```

See [`e2e/README.md`](e2e/README.md).

## Contributing / Security

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md) — please report vulnerabilities privately
- Licence: MIT, see [LICENSE](LICENSE)
