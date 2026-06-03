# Strategy Monitor

`openaeo monitor` scans RSS or Atom feeds for AI-search changes that could affect publisher visibility, citation, crawling, and attribution.

The command is meant for recurring watchlists: OpenAI product updates, standards discussions, publisher changelogs, search documentation, and trusted industry feeds. It turns monitored items into an action brief with immediate changes, experiments, and content updates.

## Usage

```bash
npm exec openaeo -- monitor \
  --site https://example.com \
  --feed https://openai.com/news/rss.xml \
  --feed https://example.com/ai-search-feed.xml \
  --out reports
```

Set `OPENAI_API_KEY` or pass `--openai-api-key` for model-generated strategy recommendations:

```bash
OPENAI_API_KEY=sk-... npm exec openaeo -- monitor \
  --site https://example.com \
  --feed https://openai.com/news/rss.xml
```

Use `--mock-ai` for deterministic CI and local demo runs.

## What It Detects

- citation and attribution changes
- AI crawler access and source-map changes
- structured data and entity clarity shifts
- answer-ready content patterns
- freshness and trust signals

## Outputs

- `openaeo-strategy.json`
- `openaeo-strategy.md`

The Markdown brief includes a summary, prioritized signals, immediate actions, experiments, content updates, and source links.

## Safety Defaults

Private and local network feed URLs are blocked by default. Use `--allow-private-network` only for trusted local fixtures.
