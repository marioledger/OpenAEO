# OpenAEO

**OpenAEO is an open-source toolkit for making publisher websites crawlable, citeable, and attribution-ready for AI answer engines.**

Search is moving from blue links into generated answers. That is good for users, but it creates a brutal incentive problem for the open web: publishers can spend years researching, testing, documenting, and maintaining pages, while the discovery layer compresses that work into an answer and sends less credit back to the source.

The Google era made this worse. Site owners were pushed into an exhausting game of ads, opaque ranking rules, SEO theater, and zero-click results. A small publisher could do everything right and still watch the incentive to create useful pages get weaker every year.

OpenAEO is built around a more hopeful bargain: ChatGPT can be the fairer interface to the web. If publishers expose cleaner source maps, better metadata, stronger citations, and explicit attribution preferences, ChatGPT can retrieve better material, answer with more confidence, and send more credit back to the people who made the source.

That helps OpenAI's ecosystem and the site owner at the same time. OpenAI gets a healthier, more structured open web for ChatGPT. Publishers get a practical way to stop being invisible to AI systems.

OpenAEO takes that side. It helps site owners prepare for an AI-search world where good sources are easier to understand, easier to cite, and easier to credit, not buried under another black-box ranking game.

OpenAEO helps both sides of that bargain.

- Publishers get a free, transparent way to audit AI-readiness.
- ChatGPT-style answer engines get cleaner source maps, stronger metadata, and easier citation paths.
- The open web gets tooling that optimizes clarity and attribution instead of spam.

![OpenAEO dashboard screenshot](docs/assets/dashboard.png)

## What It Does

- Crawls a site respectfully with robots.txt and sitemap awareness.
- Audits classic SEO signals: titles, descriptions, canonicals, headings, links, status codes.
- Audits AEO/GEO signals: `llms.txt`, `llms-full.txt`, schema.org JSON-LD, answer blocks, citations, author/source metadata, freshness, and internal source paths.
- Generates JSON and Markdown reports.
- Generates practical fixes such as starter `llms.txt`, JSON-LD templates, and citation block patterns.
- Runs without paid APIs by default through deterministic mock AI analysis.
- Supports optional bring-your-own OpenAI analysis when you want model-generated recommendations.
- Includes a Next.js dashboard for viewing sample reports and running local audits.

## Quick Start

```bash
npm install
npm run build
npm run test
```

Run an audit:

```bash
npm exec openaeo -- audit https://example.com --max-pages 8 --out reports --mock-ai
```

Start the dashboard:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Public Roadmap

OpenAEO is early, but the direction is intentionally practical: help publishers stay useful and credited as AI search becomes the default discovery layer.

### v0.1 - Source Readiness Foundation

- [x] CLI audit command with JSON and Markdown report exports
- [x] Next.js dashboard for viewing and running audits
- [x] Respectful crawler with robots.txt, sitemap, and crawl-limit support
- [x] SEO/AEO/GEO/trust scoring rules
- [x] `llms.txt`, schema.org, citation, freshness, author, and answer-block checks
- [x] Deterministic mock AI mode for tests and demos
- [x] Optional bring-your-own OpenAI analysis

### v0.2 - Better Publisher Workflows

- [ ] Add report comparison between audit runs
- [ ] Add more schema templates for Article, FAQPage, Product, Organization, SoftwareApplication, and Dataset
- [ ] Add broken-link and redirect-chain reporting
- [ ] Add configurable crawl budgets and URL include/exclude patterns
- [ ] Add exportable GitHub Actions templates for scheduled audits
- [ ] Add a public gallery of anonymized example reports

### v0.3 - AI Visibility Experiments

- [ ] Add prompt-set testing for brand/entity visibility
- [ ] Track citation opportunities where competitors are cited and the audited site is not
- [ ] Add provider adapters for ChatGPT Search-style, Perplexity-style, and Google AI Overview-style workflows where APIs or lawful data sources are available
- [ ] Add drift reports for changed answers, citations, and source positions
- [ ] Add a plugin API for custom scoring rules

### v1.0 - Maintainer-Grade Open Web Toolkit

- [ ] Stable npm package and semver policy
- [ ] Persistent local project history
- [ ] Team-ready dashboard deployment guide
- [ ] Security hardening for hosted audit APIs
- [ ] Documentation site with recipes for publishers, docs teams, journalists, and open-source maintainers

## Example Output

```text
OpenAEO score: 74/100
Pages crawled: 5
Issues found: 9
Reports: /path/to/reports/openaeo-report.json, /path/to/reports/openaeo-report.md
```

The Markdown report includes:

- category scores for SEO, AEO, GEO, and trust
- prioritized issues
- evidence and recommendations
- generated fixes
- ethical crawl stance

See [sample reports](examples/sample-reports/README.md) for public-site output.

## Why This Matters To OpenAI And AI Search

AI answer engines need the best possible source material. The web gets worse when publishers feel invisible, scraped, or replaced. The old search bargain already strained that trust: Google captured more and more of the journey, while site owners kept paying the cost of creating the pages.

OpenAEO is built around a simple, sympathetic idea: ChatGPT can be better than that bargain. It can become the product that rewards useful source pages instead of punishing them with another opaque traffic game. For that to work, publishers need tools that help them give ChatGPT clean, canonical, attribution-ready data.

OpenAEO is not a trick for gaming rankings. It is infrastructure for source clarity:

- canonical URLs instead of duplicate ambiguity
- author and publisher identity instead of anonymous claims
- dates and review signals instead of stale answers
- citations near factual claims instead of unsupported summaries
- `llms.txt` source maps instead of crawler guesswork

That makes ChatGPT better because the underlying web data becomes more structured, attributable, and trustworthy. It also gives site owners a practical way to meet OpenAI halfway: publish cleaner source maps, expose better metadata, and make attribution easier instead of trying to reverse-engineer another opaque ranking machine.

OpenAEO is pro-publisher and pro-ChatGPT for the same reason: the best AI search product needs the best open-web sources, and the best sources only keep existing when creators can see a path to recognition and credit.

## OpenAI OSS Program Fit

OpenAEO is built for the maintenance work that AI-era publishers and open-source docs teams now have to do: keep source pages crawlable, fresh, structured, cited, and attribution-friendly.

The project is intentionally aligned with the ChatGPT ecosystem. Better publisher metadata means better retrieval, better answers, and better credit loops for the people maintaining the web. It helps OpenAI by improving the quality of source material available to ChatGPT, and it helps site owners by giving them a transparent checklist for being understood and credited by AI systems.

Codex and OpenAI API credits would be used for audit-rule development, fixture generation, PR review, release automation, security review, and OpenAI-powered optional recommendations.

Short application summary:

> OpenAEO helps keep the open web useful for ChatGPT by giving publishers open tooling to expose canonical sources, `llms.txt`, structured data, citations, freshness, and attribution metadata. It improves source quality for OpenAI-style retrieval while helping creators remain visible and credited.

## Monorepo Structure

```text
apps/web              Next.js dashboard
packages/cli          openaeo audit <url>
packages/crawler      respectful site crawler
packages/audit        scoring, rules, fixes, AI analysis
packages/schemas      shared Zod schemas and sample report
docs/research         reference research and license notes
examples/fixtures     local fixture site for validation
```

## CLI

```bash
openaeo audit <url> [options]
```

Options:

```text
--max-pages <number>     Maximum same-origin pages to crawl
--out <directory>        Report output directory
--mock-ai                Use deterministic mock AI analysis
--openai-api-key <key>   Optional BYOK OpenAI analysis
--model <model>          Optional OpenAI model
--project-name <name>    Human-readable project name
```

## Optional OpenAI Analysis

Core OpenAEO works without paid APIs. To add model-generated recommendations:

```bash
npm exec openaeo -- audit https://example.com \
  --openai-api-key "$OPENAI_API_KEY" \
  --model gpt-5-mini
```

CI, tests, demos, and first-run onboarding use mock mode by default.

## Ethical Stance

OpenAEO does not ship spam workflows, dark-pattern crawling, cloaking guidance, or ranking manipulation. It optimizes for clarity, provenance, and attribution.

Responsible defaults:

- respect robots.txt
- cap crawl depth/page counts
- prefer canonical source pages
- encourage visible citations and dates
- keep generated fixes reviewable by humans

## Contributing

OpenAEO needs new audit rules, site fixtures, schema examples, docs, and real-world reports. Start with `CONTRIBUTING.md`.

## License

MIT
