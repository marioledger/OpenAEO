# OpenAEO Audit Report

Audited URL: http://127.0.0.1:4173/
Generated: 2026-06-07T14:06:22.231Z

## Score

Overall: **57/100**

| Category | Score |
| --- | ---: |
| SEO | 100 |
| AEO | 49 |
| GEO | 61 |
| Trust | 0 |

## AI Analysis (mock)

The site exposes AI-readable source signals and should now improve structured evidence quality.

## Issues

- **INFO / geo**: Consider llms-full.txt for deep source context (http://127.0.0.1:4173/llms-full.txt)
  Add llms-full.txt for curated full-text source material when the site has docs, research, or evergreen guides.
- **MEDIUM / trust**: Expose author or publisher metadata (http://127.0.0.1:4173/)
  Add author/publisher metadata in visible content and structured data.
- **LOW / trust**: Add published or reviewed dates (http://127.0.0.1:4173/)
  Add visible and structured freshness metadata so answer engines know whether the page is current.
- **MEDIUM / aeo**: Add structured data (http://127.0.0.1:4173/about.html)
  Add schema.org Article, FAQPage, Product, Organization, or WebPage markup as appropriate.
- **MEDIUM / trust**: Expose author or publisher metadata (http://127.0.0.1:4173/about.html)
  Add author/publisher metadata in visible content and structured data.
- **LOW / trust**: Add published or reviewed dates (http://127.0.0.1:4173/about.html)
  Add visible and structured freshness metadata so answer engines know whether the page is current.
- **MEDIUM / geo**: Add outbound citations for factual claims (http://127.0.0.1:4173/about.html)
  Link important claims to primary sources, research, docs, or your own canonical evidence.
- **LOW / aeo**: Add answer-ready sections (http://127.0.0.1:4173/about.html)
  Add concise answer blocks that summarize key questions without hiding the full source context.

## Generated Fixes

## WebPage JSON-LD template

Target: `<head> application/ld+json`

WebPage markup provides a general-purpose schema baseline for any page that does not fit a narrower type.

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "OpenAEO Fixture Publisher Guide",
  "url": "http://127.0.0.1:4173/",
  "description": "A local fixture page used to validate OpenAEO audits for publisher attribution and AI readiness."
}
```

## Organization JSON-LD template

Target: `<head> application/ld+json`

Organization markup reinforces the publisher identity behind the source material.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "OpenAEO Fixture Publisher Guide",
  "url": "http://127.0.0.1:4173",
  "logo": "http://127.0.0.1:4173/logo.png"
}
```

## FAQPage JSON-LD template

Target: `<head> application/ld+json`

FAQ markup turns answer blocks into explicit question-and-answer structure for crawlers.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question goes here",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer goes here."
      }
    }
  ]
}
```

## Article JSON-LD template

Target: `<head> application/ld+json`

Article markup helps answer engines recognize authorship, canonical URLs, and freshness signals.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "OpenAEO Fixture Publisher Guide",
  "url": "http://127.0.0.1:4173/",
  "description": "A local fixture page used to validate OpenAEO audits for publisher attribution and AI readiness.",
  "author": {
    "@type": "Organization",
    "name": "Publisher name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Publisher name"
  },
  "dateModified": "YYYY-MM-DD"
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
