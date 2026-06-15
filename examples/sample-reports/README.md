# Sample Reports

These reports show how OpenAEO output looks against public sites and fixture scenarios.

## Public Site Examples

| Site | JSON | Markdown | Notes |
| --- | --- | --- | --- |
| `www.example.com` | [JSON](example-com/openaeo-report.json) | [Markdown](example-com/openaeo-report.md) | Minimal public page; useful for seeing missing AI-readiness signals. |
| `www.iana.org` | [JSON](iana-org/openaeo-report.json) | [Markdown](iana-org/openaeo-report.md) | Public institutional site; useful for crawler/report format validation. |
| `www.w3.org` | [JSON](w3-org/openaeo-report.json) | [Markdown](w3-org/openaeo-report.md) | Standards body homepage; useful for seeing a public page with sparse crawl depth. |
| `www.python.org` | [JSON](python-org/openaeo-report.json) | [Markdown](python-org/openaeo-report.md) | Popular open-source project homepage; useful for checking a content-rich public site. |

## Fixture Scenario

| Site | JSON | Markdown | Notes |
| --- | --- | --- | --- |
| `127.0.0.1:4173` | [JSON](fixture-site/openaeo-report.json) | [Markdown](fixture-site/openaeo-report.md) | Local fixture site; useful for validating report output without external network access. |

## Regenerate

Start the local fixture site before regenerating the fixture report:

```bash
npm run preview:fixture
```

```bash
npm exec openaeo -- audit https://www.example.com --max-pages 2 --out examples/sample-reports/example-com --mock-ai
npm exec openaeo -- audit https://www.iana.org --max-pages 2 --out examples/sample-reports/iana-org --mock-ai
npm exec openaeo -- audit https://www.w3.org/ --max-pages 2 --out examples/sample-reports/w3-org --mock-ai --generated-at 2026-06-08T00:00:00.000Z --project-name W3C
npm exec openaeo -- audit https://www.python.org/ --max-pages 2 --out examples/sample-reports/python-org --mock-ai --generated-at 2026-06-08T00:05:00.000Z --project-name Python.org
npm exec openaeo -- audit http://127.0.0.1:4173 --max-pages 5 --out examples/sample-reports/fixture-site --mock-ai --allow-private-network --project-name "OpenAEO Fixture" --generated-at 2026-06-07T14:06:22.231Z
```

Scores are intentionally strict. A low score does not mean a site is bad overall; it means the current page set does not expose the source-map, structured-data, citation, freshness, and attribution signals OpenAEO expects for AI answer-engine readiness.
