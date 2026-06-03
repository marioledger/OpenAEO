# Reference License Audit

OpenAEO is MIT licensed and uses original implementation code.

Reference repositories were cloned into `.reference-repos/`, which is ignored by Git. They are local research material, not vendored product code.

| Reference | Observed license | Reuse decision |
| --- | --- | --- |
| `any4ai/AnyCrawl` | MIT | Product/architecture inspiration only unless explicit attribution is added for reused snippets. |
| `PhialsBasement/LibreCrawl` | MIT | Feature inspiration only. |
| `answer-engine/aeo` | MIT for code, CC BY 4.0 for content | Concepts and links may be referenced with attribution; do not copy docs wholesale. |
| `AIcling/agentic_geo` | Apache-2.0 | Research inspiration only; preserve attribution for any future derived implementation. |
| `beb7/gflare-tk` | GPL-3.0 | Do not copy code into this MIT repo. High-level feature comparison only. |
| `danishashko/geo-aeo-tracker` | No license file found in local clone | Treat as all-rights-reserved for code reuse. Product inspiration only. |
| `psbagga17/E-GEO` | No license file found in local clone | Treat as all-rights-reserved for code reuse. Research inspiration only. |

## Policy

- Default to original code.
- Document references and lessons.
- Do not vendor cloned repositories.
- Do not copy GPL or unlicensed code.
- Add attribution if any compatible code is intentionally reused in the future.
