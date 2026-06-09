import { describe, expect, it } from "vitest";
import { promptSetRunSchema, promptSetSchema } from "../src/index.js";

describe("prompt-set experiments", () => {
  const baseRun = {
    id: "visibility-brand-run",
    promptSetId: "visibility-brand-prompt-set",
    siteUrl: "https://example.com",
    generatedAt: "2026-06-09T00:00:00.000Z",
    provider: "mock",
    mode: "mock" as const,
    observations: [
      {
        promptId: "prompt-1",
        responseSummary: "Example Publisher appears in the answer with one citation.",
        citedUrls: ["https://example.com/about"],
        mentionCount: 1,
        sourcePositions: [1]
      }
    ],
    privacy: {
      allowRawResponses: false,
      redactPersonalData: true,
      notes: ["Use truncated summaries when storing outputs."]
    },
    notes: ["Keep this output out of the audit report schema."]
  };

  it("parses a provider-agnostic prompt set definition", () => {
    const promptSet = promptSetSchema.parse({
      id: "visibility-brand-prompt-set",
      name: "Brand visibility prompts",
      description: "A lightweight prompt set for checking how a brand appears in answers.",
      targetSiteUrl: "https://example.com",
      provider: "lawful-provider",
      prompts: [
        {
          id: "prompt-1",
          label: "Brand summary",
          prompt: "What is Example Publisher best known for?",
          intent: "Measure whether the site is surfaced with a clear entity summary.",
          tags: ["entity", "visibility"]
        }
      ],
      privacy: {
        allowRawResponses: false,
        redactPersonalData: true,
        notes: ["Avoid collecting personal data from responses."]
      },
      notes: ["Store this artifact separately from site audits."]
    });

    expect(promptSet.provider).toBe("lawful-provider");
    expect(promptSet.prompts[0].tags).toEqual(["entity", "visibility"]);
    expect(promptSet.privacy.redactPersonalData).toBe(true);
  });

  it("parses a separate mock provider run result format", () => {
    const run = promptSetRunSchema.parse(baseRun);

    expect(run.mode).toBe("mock");
    expect(run.observations[0].citedUrls).toEqual(["https://example.com/about"]);
    expect(run.privacy.allowRawResponses).toBe(false);
  });

  it("rejects non-ISO generatedAt values", () => {
    expect(
      promptSetRunSchema.safeParse({
        ...baseRun,
        generatedAt: "not-a-date"
      })
    ).toMatchObject({ success: false });
  });

  it("rejects contradictory mode and provider values", () => {
    expect(
      promptSetRunSchema.safeParse({
        ...baseRun,
        provider: "openai"
      })
    ).toMatchObject({ success: false });
  });
});
