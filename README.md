# Compliance Tracking -- Multi-Framework Assessment

> Part of [CISO Toolbox](https://www.cisotoolbox.org) -- open-source security tools for CISOs.

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
3. Load `demo-en.json` from File > Open to explore a complete assessment (MedSecure)
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

## License

MIT

## Links

- Website: https://compliance.cisotoolbox.org
- CISO Toolbox: https://www.cisotoolbox.org
