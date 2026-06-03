# Reference Puzzle Map

OpenAEO intentionally assembles lessons from the SEO, AEO, GEO, crawler, and AI-visibility ecosystem. The code is original, but the product shape is influenced by these local reference clones.

| OpenAEO subsystem | Reference puzzle pieces | How the idea shows up |
| --- | --- | --- |
| CLI audit pipeline | Greenflare, LibreCrawl, AnyCrawl | Crawl a site, extract page signals, report issues, export artifacts. |
| Web dashboard | geo-aeo-tracker, LibreCrawl | Score overview, issue lists, source signals, generated recommendations. |
| AI-readiness rules | AEO.dev, geo-aeo-tracker | `llms.txt`, schema.org, answer blocks, citation readiness, source clarity. |
| GEO/trust framing | AgenticGEO, E-GEO | Visibility and attribution matter inside generative systems, not just link ranking. |
| BYOK/mock AI boundary | geo-aeo-tracker, E-GEO | Optional provider calls; deterministic local mode for tests and demos. |
| Maintainer posture | AnyCrawl, AEO.dev | Clear README, contribution docs, public-roadmap-friendly structure. |

## What Was Not Copied

- No GPL Greenflare code.
- No unlicensed `geo-aeo-tracker` or `E-GEO` code.
- No documentation copied from AEO.dev's CC BY content.
- No vendored reference repositories in tracked source.

## What Was Recreated

- A lightweight crawler with robots, sitemap, `llms.txt`, link, metadata, and schema extraction.
- A scoring model for SEO, AEO, GEO, and trust signals.
- A report format with issues, evidence, recommendations, generated fixes, and AI analysis.
- A dashboard that makes the report readable without paid APIs.
