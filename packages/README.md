# Packages

OpenAEO keeps reusable product logic in packages so the CLI, dashboard, tests, and future integrations share the same audit model.

| Package | Purpose |
| --- | --- |
| `@openaeo/schemas` | Zod schemas, report types, prompt-set experiment contracts, and sample report and prompt-set factories. |
| `@openaeo/crawler` | Respectful crawler for robots, sitemap, page metadata, links, schema, and AI source files. |
| `@openaeo/audit` | SEO/AEO/GEO/trust rules, scoring, generated fixes, Markdown output, and optional AI analysis. |
| `@openaeo/strategy` | Feed-driven strategy briefs for recurring AI-search monitoring and content planning. |
| `openaeo` | CLI entry point for `openaeo audit <url>`. |

Package boundaries should stay boring and explicit: crawler collects evidence, audit interprets evidence, schemas define the public report contract, and CLI/web present the result.
