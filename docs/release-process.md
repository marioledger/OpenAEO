# Release Process

OpenAEO is in public preview. Releases should stay boring, reproducible, and easy to audit.

## Before A Release

Run:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Then verify:

- `CHANGELOG.md` describes user-facing changes.
- The README quick start still matches the CLI.
- Sample reports render in the dashboard.
- No secrets, private URLs, or private report data are committed.
- Security-sensitive crawler or API changes have been reviewed.

## Versioning

- `0.x` releases may change rule scoring as the project learns from real fixtures.
- `1.0.0` will introduce a stable report schema and semver compatibility policy.
