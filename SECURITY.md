# Security Policy

Please report security issues privately before opening a public issue.

OpenAEO crawls user-provided URLs and can optionally call OpenAI with bring-your-own keys. Security-sensitive areas include SSRF protections, secret handling, report exports, and dependency updates.

Do not include secrets, private pages, private API responses, or customer data in bug reports.

Supported version: `0.1.x` during early development.

## Hosted Crawling Guidance

OpenAEO blocks private and local network targets by default in the crawler. Hosted deployments should also add response-size limits, per-user rate limits, authentication, audit logging, and egress monitoring before accepting arbitrary URLs from the public internet.

## Current Dependency Advisory

`npm audit --audit-level=high` currently passes. `npm audit` reports a moderate PostCSS advisory through Next.js' bundled dependency. The stable `next@16.2.7` release still resolves `postcss@8.4.31`; npm suggests `npm audit fix --force`, but that would downgrade Next to an obsolete major version and break the App Router dashboard. OpenAEO keeps the stable Next line and should update Next as soon as the fixed PostCSS dependency lands in a stable release.
