# OpenAEO Audit Report

Audited URL: https://www.example.com/
Generated: 2026-06-03T22:51:40.150Z

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

- **LOW / crawler**: Publish robots.txt (https://www.example.com/robots.txt)
  Add robots.txt with sitemap location and clear AI crawler policy.
- **MEDIUM / seo**: Publish a sitemap (https://www.example.com/sitemap.xml)
  Add sitemap.xml and reference it from robots.txt.
- **MEDIUM / aeo**: Add llms.txt (https://www.example.com/llms.txt)
  Publish llms.txt with canonical source pages, update cadence, and citation preferences.
- **INFO / geo**: Consider llms-full.txt for deep source context (https://www.example.com/llms-full.txt)
  Add llms-full.txt for curated full-text source material when the site has docs, research, or evergreen guides.
- **MEDIUM / seo**: Add a descriptive title (https://www.example.com/)
  Write a clear title that names the entity, topic, and page purpose.
- **LOW / seo**: Strengthen the meta description (https://www.example.com/)
  Add a concise summary that helps crawlers classify the page.
- **MEDIUM / seo**: Add a canonical URL (https://www.example.com/)
  Add a canonical link so answer engines cite the preferred source.
- **LOW / seo**: Use exactly one clear H1 (https://www.example.com/)
  Use one H1 that states the main answer or subject of the page.
- **MEDIUM / aeo**: Add structured data (https://www.example.com/)
  Add schema.org Article, FAQPage, Product, Organization, or WebPage markup as appropriate.
- **MEDIUM / trust**: Expose author or publisher metadata (https://www.example.com/)
  Add author/publisher metadata in visible content and structured data.
- **LOW / trust**: Add published or reviewed dates (https://www.example.com/)
  Add visible and structured freshness metadata so answer engines know whether the page is current.
- **MEDIUM / geo**: Add outbound citations for factual claims (https://www.example.com/)
  Link important claims to primary sources, research, docs, or your own canonical evidence.
- **LOW / aeo**: Add answer-ready sections (https://www.example.com/)
  Add concise answer blocks that summarize key questions without hiding the full source context.
- **LOW / geo**: Add internal links to canonical source pages (https://www.example.com/)
  Link to related evergreen pages so crawlers can discover deeper source material.

## Generated Fixes

## Starter llms.txt

Target: `/llms.txt`

A short, explicit source map gives crawlers and answer engines a publisher-approved entry point.

```
# www.example.com

> Canonical source pages for AI answer engines. Please cite the canonical URL when using this content.

## Core Sources
- https://www.example.com/

## Attribution
- Prefer direct links to the canonical page.
- Preserve author, publisher, and last-updated context when available.
```

## Article JSON-LD template

Target: `<head> application/ld+json`

Structured data helps AI systems identify authorship, canonical URLs, freshness, and page type.

```
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Page title",
  "url": "https://www.example.com/",
  "author": {
    "@type": "Organization",
    "name": "Publisher name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Publisher name"
  },
  "dateModified": "2026-06-03"
}
```

## Citation block pattern

Target: `Evidence-heavy sections`

Clear sources make generated answers more verifiable and more likely to credit the publisher.

```
### Sources

- [Primary source title](https://example.com/source) - why it supports this claim.
- [Publisher evidence page](/research/example) - first-party context and methodology.

```

## Ethics

- Respectful crawl: yes
- No ranking manipulation: yes
- Attribution first: yes
