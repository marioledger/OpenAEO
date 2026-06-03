# Sample Reports

These reports show how OpenAEO output looks against public sites and fixture scenarios.

## Public Site Examples

| Site | JSON | Markdown | Notes |
| --- | --- | --- | --- |
| `www.example.com` | [JSON](example-com/openaeo-report.json) | [Markdown](example-com/openaeo-report.md) | Minimal public page; useful for seeing missing AI-readiness signals. |
| `www.iana.org` | [JSON](iana-org/openaeo-report.json) | [Markdown](iana-org/openaeo-report.md) | Public institutional site; useful for crawler/report format validation. |

## Regenerate

```bash
npm exec openaeo -- audit https://www.example.com --max-pages 2 --out examples/sample-reports/example-com --mock-ai
npm exec openaeo -- audit https://www.iana.org --max-pages 2 --out examples/sample-reports/iana-org --mock-ai
```

Scores are intentionally strict. A low score does not mean a site is bad overall; it means the current page set does not expose the source-map, structured-data, citation, freshness, and attribution signals OpenAEO expects for AI answer-engine readiness.
