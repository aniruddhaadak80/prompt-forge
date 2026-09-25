# Contributing

Thank you for helping make Prompt Forge more useful and inspectable.

## Before you start

- Read `README.md` and `src/lib/types.ts`.
- Keep the core experience keyless.
- Do not add a model provider without a real, documented use case and a safe fallback.
- Never commit API keys, `.env` files, database URLs, cookies, or generated artifacts.

## Development

```bash
npm ci
npm run dev
```

Use `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `npx playwright test` before opening a pull request.

## Product rules

- Every visible control must perform a real read, mutation, computation, export, or navigation.
- User-created records must survive process restarts in production.
- Keep the same domain function behind REST, UI, and MCP paths.
- Treat generated artifact code as untrusted and keep it inside the sandboxed iframe.
- Label live and fallback research honestly.

## Pull requests

Use a focused title, describe the user outcome, list verification commands, and call out any new external dependency or data source.
