# Scheduled Audits

OpenAEO can run in GitHub Actions so publishers and maintainers get recurring JSON and Markdown reports without hosting the dashboard.

## Template

Copy `examples/github-actions/scheduled-audit.yml` into `.github/workflows/openaeo-audit.yml` in the site or docs repository you want to monitor.

Update:

```yaml
OPENAEO_AUDIT_URL: https://example.com
```

The template uses mock AI mode so it does not require committed secrets. To use OpenAI analysis, add an `OPENAI_API_KEY` secret and remove `--mock-ai` or pass `--openai-api-key "$OPENAI_API_KEY"`.

For strategy monitoring, schedule `openaeo monitor` with one or more trusted feeds and upload `openaeo-strategy.md` as an artifact alongside audit reports.
