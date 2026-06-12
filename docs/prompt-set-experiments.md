# Prompt-Set Experiments

OpenAEO's AI-visibility roadmap needs a small contract for prompt-set checks before any provider-specific runtime exists.

This design note keeps the experiment model intentionally narrow:

- define the prompt set separately from the run output
- keep the run output separate from site audit reports
- support a mock provider for tests and local fixtures
- avoid storing raw personal data or unnecessary response text by default
- keep provider identifiers generic so lawful APIs can be swapped in later

## Proposed Artifacts

- `prompt-set`: the prompts, intent, and privacy settings for a visibility check
- `prompt-set-run`: the observations collected from one provider or mock execution

## Privacy and Legal Boundary

Prompt-set experiments should only use content and APIs that the maintainer has permission to query. If a provider response includes personal data, private data, or unsupported content, store only a redacted summary unless a specific workflow explicitly requires more.

## Current Status

The repository now has shared schema types, reusable sample fixtures, and tests for the prompt-set contract. Runtime collection and provider integrations remain future work.
