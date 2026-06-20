# Copilot / Codex Workspace Instructions

These instructions apply to GitHub Copilot Workspace and OpenAI Codex agents working in this public repository.

- Inspect the repository context before making changes.
- Do not overwrite unrelated local or user changes.
- Keep changes focused on the requested behavior.
- Never commit or print secrets.
- Use `.env.local` for local private values and keep it ignored by Git.
- Do not add production credentials, private deployment automation, investigation samples, generated reports, screenshots, traces, or storage artifacts.
- Validate code changes with the relevant tests, type checks, and build when feasible.
- Public CI must remain test/build only unless deployment is explicitly designed for a public demo environment.
