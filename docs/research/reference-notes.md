# Reference Notes

These notes were prepared from local clones in `.reference-repos/`. The clones are ignored by Git so OpenAEO remains an original implementation.

## geo-aeo-tracker

Useful product lesson: users understand AI visibility when it is presented as projects, prompts, responses, citations, opportunities, and drift. OpenAEO borrows the local-first, BYOK, and dashboard clarity ideas, but does not copy its implementation. No license file was found in the local clone, so code reuse is off limits.

## LibreCrawl

Useful product lesson: an SEO crawler should make crawl status, links, metadata, and exports obvious. OpenAEO keeps the crawl smaller in v1 and focuses on source attribution, not full Screaming Frog parity. MIT licensed, but OpenAEO still uses original code.

## AnyCrawl

Useful product lesson: AI-era crawling benefits from clear APIs, batch-friendly jobs, and LLM-ready extraction. OpenAEO starts with a simpler npm workspace instead of a distributed worker architecture. MIT licensed, but no code was copied.

## Greenflare

Useful product lesson: mature SEO crawlers track status codes, canonicals, robots, headers, broken links, and exportable tables. The project is GPL-3.0, so OpenAEO only uses high-level feature inspiration.

## AEO.dev

Useful product lesson: AEO needs community education, not just tooling. OpenAEO should produce explainable recommendations and docs that teach publishers why each signal matters. Code is MIT and content is CC BY 4.0; OpenAEO references concepts with attribution and original wording.

## AgenticGEO

Useful research lesson: GEO is increasingly about visibility and attribution inside black-box generative systems, not just page ranking. OpenAEO v1 does not implement strategy evolution; it turns the research direction into practical checks for citations, answer blocks, entity clarity, and source maps.

## E-GEO

Useful research lesson: e-commerce GEO can be evaluated through prompts, product descriptions, rankings, and model comparisons. OpenAEO v1 keeps provider calls optional and mockable; future versions can add visibility experiments after the crawler/audit baseline is stable.
