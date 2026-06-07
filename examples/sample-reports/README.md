# Sample Reports

These reports show how OpenAEO output looks against public sites and fixture scenarios.

## Public Site Examples

| Site | JSON | Markdown | Notes |
| --- | --- | --- | --- |
| `www.example.com` | [JSON](example-com/openaeo-report.json) | [Markdown](example-com/openaeo-report.md) | Minimal public page; useful for seeing missing AI-readiness signals. |
| `www.iana.org` | [JSON](iana-org/openaeo-report.json) | [Markdown](iana-org/openaeo-report.md) | Public institutional site; useful for crawler/report format validation. |

## Regenerate

Start the local fixture site before regenerating the fixture report:

```bash
cd examples/fixtures/site && npx vite preview --port 4173 --strictPort
```

```bash
npm exec openaeo -- audit https://www.example.com --max-pages 2 --out examples/sample-reports/example-com --mock-ai
npm exec openaeo -- audit https://www.iana.org --max-pages 2 --out examples/sample-reports/iana-org --mock-ai
npm exec openaeo -- audit http://127.0.0.1:4173 --max-pages 5 --out examples/sample-reports/fixture-site --mock-ai --allow-private-network --project-name "OpenAEO Fixture" --generated-at 2026-06-07T14:06:22.231Z
```

Scores are intentionally strict. A low score does not mean a site is bad overall; it means the current page set does not expose the source-map, structured-data, citation, freshness, and attribution signals OpenAEO expects for AI answer-engine readiness.
