# Contributing

Thanks for helping improve ThePishAnalyser.

## Development

Use Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Before opening a pull request, run:

```bash
npm test
npm run lint
npm run build
npm audit
```

## Pull Requests

- Keep changes focused and describe the user-visible behavior.
- Add or update tests for behavior changes.
- Do not commit `.env.local`, private API keys, investigation samples, generated reports, screenshots, traces, or storage artifacts.
- Keep public examples generic. Use `example.test`, `example.com`, or RFC 5737 documentation IP ranges.

## Security-Sensitive Changes

For changes touching authentication, sandboxing, file handling, URL fetching, archive extraction, or external command execution, include a short security note in the pull request explaining the risk and how it was tested.
