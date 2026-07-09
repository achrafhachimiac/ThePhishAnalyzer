# The Phish Analyzer

```text
+------------------------------------------------------------------+
|  THE PHISH ANALYZER                                              |
|  Phishing triage, OSINT enrichment, sandbox evidence, CASE notes |
+------------------------------------------------------------------+
|  EML -> URLs -> domains -> files -> browser evidence -> report   |
+------------------------------------------------------------------+
```

The Phish Analyzer is a security analyst workbench for phishing investigations. It brings email parsing, domain reputation, file triage, URL sandboxing, OSINT pivots, and browser-local case notes into one focused interface.

It is designed for authorized investigations, SOC triage, phishing mailbox review, and quick enrichment of suspicious emails, URLs, domains, and files.

## What It Can Do

- Analyze suspicious domains with DNS, RDAP, TLS, MX, SPF, DKIM, DMARC, MTA-STS, TLS-RPT, reputation feeds, and OSINT links.
- Parse raw RFC822 emails and EML files to extract headers, authentication results, URLs, domains, email addresses, reply paths, and suspicious inconsistencies.
- Run the THEPHISH workflow for EML intake, Barracuda URL decoding, attachment discovery, related-domain triage, and manual threat scans.
- Investigate URLs in a browser sandbox with screenshot capture, download tracking, traces, session activity, and optional live noVNC access.
- Analyze uploaded or remote files with static indicators, file metadata, archive inspection, Office/PDF/script parsing, IOC extraction, and scoring.
- Enrich indicators through optional integrations such as VirusTotal, urlscan.io, AbuseIPDB, URLhaus, Cortex, YARA, and ClamAV.
- Keep browser-local CASE notes with analyst events, references, saved sessions, and export to text or JSON.
- Keep public/self-hosted deployments behind an optional Cloudflare Turnstile gate.

## Main Workflows

- Email to investigation: upload an EML, extract URLs/domains/attachments, pivot into domain analysis, URL sandbox, or file analysis.
- URL to evidence: launch a sandboxed browser session, capture screenshots and traces, then preserve evidence links in the case journal.
- Domain to OSINT: review DNS/security posture, reputation, related domains, and external intelligence pivots.
- File to indicators: inspect suspicious files, extract IOCs, calculate risk signals, and enrich with local or external scanners.
- Case to report: keep analyst notes and export the case as text or JSON for handoff.

## Local Setup

Prerequisites:

- Node.js 20 or newer
- npm

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open the local URL shown by Vite.

## Useful Commands

```bash
npm test
npm run lint
npm run build
npm audit
```

## Optional Integrations

Configure only what you need in `.env.local`.

| Variable | Purpose |
| --- | --- |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile gate |
| `VIRUSTOTAL_API_KEY` | VirusTotal enrichment |
| `URLSCAN_API_KEY` | urlscan.io enrichment |
| `ABUSEIPDB_API_KEY` | AbuseIPDB IP reputation |
| `URLHAUS_AUTH_KEY` | URLhaus authenticated lookups |
| `FILE_ANALYSIS_YARA_COMMAND` | Local YARA scanning command |
| `FILE_ANALYSIS_CLAMAV_COMMAND` | Local ClamAV scanning command |
| `BROWSER_SANDBOX_PROVIDER` | Browser sandbox backend |
| `BROWSER_SANDBOX_ACCESS_MODE` | Live browser access mode |
| `BROWSER_SANDBOX_ACCESS_URL_TEMPLATE` | noVNC/live session URL template |
| `BROWSER_SANDBOX_START_COMMAND` | External sandbox start command |
| `BROWSER_SANDBOX_STOP_COMMAND` | External sandbox stop command |

## Browser Sandbox

The default browser sandbox mode collects server-side evidence without exposing a live browser. For self-hosted live access, configure a noVNC setup and expose `/novnc/<port>/...` through your own reverse proxy.

Generic helper scripts are included under `scripts/sandbox/`. Private deployment automation is intentionally not included in this public repository.

## Project Structure

- `src/`: React frontend.
- `backend/`: Express API and analysis services.
- `shared/`: shared schemas and analysis types.
- `scripts/sandbox/`: generic sandbox helper scripts.
- `test-samples/`: synthetic static-analysis samples.

## Contributing

Contributions are welcome. Before opening a pull request, run:

```bash
npm test
npm run lint
npm run build
npm audit
```

See `CONTRIBUTING.md` for contribution rules and `SECURITY.md` for vulnerability reporting.

## Links

- GitHub: https://github.com/achrafhachimiac/ThePhishAnalyzer
- LinkedIn: https://www.linkedin.com/in/achraf-hachimi-33572910b/
- Website: https://www.cybersec-ops.org

## Security Note

This tool is meant for authorized investigations only. Do not commit real secrets, private investigation samples, production credentials, screenshots, traces, or generated reports.
