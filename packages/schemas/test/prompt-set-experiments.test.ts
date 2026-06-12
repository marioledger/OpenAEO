import { describe, expect, it } from "vitest";
import {
  createSamplePromptSet,
  createSamplePromptSetRun,
  promptSetRunSchema,
  promptSetSchema
} from "../src/index.js";

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

  it("defaults prompt-set privacy and note fields when omitted", () => {
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
          intent: "Measure whether the site is surfaced with a clear entity summary."
        }
      ],
      privacy: {
        allowRawResponses: false,
        redactPersonalData: true
      }
    });

    expect(promptSet.privacy.notes).toEqual([]);
    expect(promptSet.notes).toEqual([]);
  });

  it("parses a separate mock provider run result format", () => {
    const run = promptSetRunSchema.parse(baseRun);

    expect(run.mode).toBe("mock");
    expect(run.observations[0].citedUrls).toEqual(["https://example.com/about"]);
    expect(run.privacy.allowRawResponses).toBe(false);
  });

  it("defaults prompt-set run privacy and note fields when omitted", () => {
    const baseRunWithoutNotes = { ...baseRun };
    delete baseRunWithoutNotes.notes;

    const run = promptSetRunSchema.parse({
      ...baseRunWithoutNotes,
      privacy: {
        allowRawResponses: false,
        redactPersonalData: true
      }
    });

    expect(run.privacy.notes).toEqual([]);
    expect(run.notes).toEqual([]);
  });

  it("parses a provider-mode run with a lawful provider name", () => {
    const run = promptSetRunSchema.parse({
      ...baseRun,
      mode: "provider",
      provider: "openai"
    });

    expect(run.mode).toBe("provider");
    expect(run.provider).toBe("openai");
  });

  it("creates a sample prompt-set fixture and matching mock run", () => {
    const promptSet = promptSetSchema.parse(createSamplePromptSet());
    const run = promptSetRunSchema.parse(createSamplePromptSetRun());

    expect(promptSet.prompts).toHaveLength(2);
    expect(promptSet.privacy.redactPersonalData).toBe(true);
    expect(run.promptSetId).toBe(promptSet.id);
    expect(run.observations[1].citedUrls).toEqual(["https://example.com", "https://example.com/about"]);
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

  it("rejects provider-mode runs that use the mock provider", () => {
    expect(
      promptSetRunSchema.safeParse({
        ...baseRun,
        mode: "provider",
        provider: "mock"
      })
    ).toMatchObject({ success: false });
  });

  it("rejects invalid mode values", () => {
    expect(
      promptSetRunSchema.safeParse({
        ...baseRun,
        mode: "live",
        provider: "mock"
      })
    ).toMatchObject({ success: false });
  });
});
