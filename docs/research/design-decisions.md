# Design Decisions

## Original Implementation

OpenAEO studies existing crawler and AEO/GEO projects, but the product code is written from scratch. This keeps licensing clean and gives the project a distinct mission: attribution-first AI readiness for publishers.

## CLI Plus Dashboard

The CLI makes OpenAEO useful in CI, scheduled audits, and developer workflows. The dashboard makes reports easier to understand for non-engineers.

## Mock AI By Default

The project must work without paid APIs. Mock mode provides deterministic recommendations for tests, demos, and first-run onboarding. BYOK OpenAI analysis is optional.

## Ethical AEO

OpenAEO avoids ranking manipulation and spam. Audit rules should improve crawlability, source clarity, freshness, structured data, and citation readiness.
