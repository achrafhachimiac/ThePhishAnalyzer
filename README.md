# ThePishAnalyser

ThePishAnalyser is a phishing investigation workbench for analysts. It combines domain reputation, raw email parsing, EML intake, file triage, browser sandboxing, related-domain review, and browser-local CASE tracking in one interface.

## Features

- Domain analysis with DNS, RDAP, TLS, mail-security checks, reputation feeds, and OSINT links.
- Raw email and EML analysis with authentication checks, extracted URLs, inconsistencies, and related-domain inventory.
- THEPHISH workflow for EML intake, Barracuda URL decoding, attachment review, and manual threat scans.
- URL sandbox evidence collection with screenshots, downloads, traces, and session activity.
- Static file analysis for uploaded and remote files.
- Optional parser/scanner enrichment for PDF, archives, Office containers, scripts, YARA, ClamAV, Cortex, and IOC sources.
- Browser-local CASE journal with text/JSON export.

## Local Setup

Prerequisites: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open the local URL shown by Vite.

## Useful Commands

```bash
npm run lint
npm test
npm run build
```

## Optional Integrations

Configure only the integrations you need in `.env.local`:

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `VIRUSTOTAL_API_KEY`
- `URLSCAN_API_KEY`
- `ABUSEIPDB_API_KEY`
- `URLHAUS_AUTH_KEY`
- `FILE_ANALYSIS_YARA_COMMAND`
- `FILE_ANALYSIS_CLAMAV_COMMAND`
- `BROWSER_SANDBOX_PROVIDER`
- `BROWSER_SANDBOX_ACCESS_MODE`
- `BROWSER_SANDBOX_ACCESS_URL_TEMPLATE`
- `BROWSER_SANDBOX_START_COMMAND`
- `BROWSER_SANDBOX_STOP_COMMAND`

## Browser Sandbox Notes

The application supports server-side browser execution and optional live analyst access. For self-hosted noVNC access, configure the browser sandbox environment variables and proxy `/novnc/<port>/...` through your own reverse proxy.

The public repository includes generic sandbox helper scripts under `scripts/sandbox/`. It intentionally does not include private deployment automation.

## Security Note

This tool is meant for authorized investigations only. Do not commit real secrets, private investigation samples, production credentials, screenshots, traces, or generated reports.
