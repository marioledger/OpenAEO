# OpenAEO Audit Report

Audited URL: https://www.python.org/
Generated: 2026-06-08T00:05:00.000Z

## Score

Overall: **0/100**

| Category | Score |
| --- | ---: |
| SEO | 0 |
| AEO | 0 |
| GEO | 0 |
| Trust | 0 |

## AI Analysis (mock)

The site has crawlable content but needs a clearer AI source map and attribution policy.

## Issues

- **MEDIUM / seo**: Publish a sitemap (https://www.python.org/sitemap.xml)
  Add sitemap.xml and reference it from robots.txt.
- **MEDIUM / aeo**: Add llms.txt (https://www.python.org/llms.txt)
  Publish llms.txt with canonical source pages, update cadence, and citation preferences.
- **INFO / geo**: Consider llms-full.txt for deep source context (https://www.python.org/llms-full.txt)
  Add llms-full.txt for curated full-text source material when the site has docs, research, or evergreen guides.
- **MEDIUM / seo**: Add a descriptive title (https://www.python.org/)
  Write a clear title that names the entity, topic, and page purpose.
- **LOW / seo**: Strengthen the meta description (https://www.python.org/)
  Add a concise summary that helps crawlers classify the page.
- **MEDIUM / seo**: Add a canonical URL (https://www.python.org/)
  Add a canonical link so answer engines cite the preferred source.
- **LOW / seo**: Use exactly one clear H1 (https://www.python.org/)
  Use one H1 that states the main answer or subject of the page.
- **MEDIUM / aeo**: Add structured data (https://www.python.org/)
  Add schema.org Article, FAQPage, Product, Organization, or WebPage markup as appropriate.
- **MEDIUM / trust**: Expose author or publisher metadata (https://www.python.org/)
  Add author/publisher metadata in visible content and structured data.
- **LOW / trust**: Add published or reviewed dates (https://www.python.org/)
  Add visible and structured freshness metadata so answer engines know whether the page is current.
- **MEDIUM / geo**: Add outbound citations for factual claims (https://www.python.org/)
  Link important claims to primary sources, research, docs, or your own canonical evidence.
- **LOW / aeo**: Add answer-ready sections (https://www.python.org/)
  Add concise answer blocks that summarize key questions without hiding the full source context.
- **LOW / geo**: Add internal links to canonical source pages (https://www.python.org/)
  Link to related evergreen pages so crawlers can discover deeper source material.

## Generated Fixes

## Starter llms.txt

Target: `/llms.txt`

A short, explicit source map gives crawlers and answer engines a publisher-approved entry point.

```md
# www.python.org

> Canonical source pages for AI answer engines. Please cite the canonical URL when using this content.

## Core Sources
- https://www.python.org/

## Attribution
- Prefer direct links to the canonical page.
- Preserve author, publisher, and last-updated context when available.
```

## WebPage JSON-LD template

Target: `<head> application/ld+json`

WebPage markup provides a general-purpose schema baseline for any page that does not fit a narrower type.

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page title",
  "url": "https://www.python.org/",
  "description": "Page description"
}
```

## Organization JSON-LD template

Target: `<head> application/ld+json`

Organization markup reinforces the publisher identity behind the source material.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "www.python.org",
  "url": "https://www.python.org",
  "logo": "https://www.python.org/logo.png"
}
```

## Citation block pattern

Target: `Evidence-heavy sections`

Clear sources make generated answers more verifiable and more likely to credit the publisher.

```md
### Sources

- [Primary source title](https://example.com/source) - why it supports this claim.
- [Publisher evidence page](/research/example) - first-party context and methodology.

```

## Ethics

- Respectful crawl: yes
- No ranking manipulation: yes
- Attribution first: yes
