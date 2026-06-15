import { describe, expect, it } from "vitest";
import {
  createSamplePromptSet,
  createSamplePromptSetRun,
  promptSetRunSchema,
  promptSetSchema
} from "../src/index.js";

describe("prompt-set experiments", () => {
  it("parses a provider-agnostic prompt set definition", () => {
    const promptSet = promptSetSchema.parse(createSamplePromptSet());
    expect(promptSet.provider).toBe("mock");
    expect(promptSet.prompts).toHaveLength(2);
    expect(promptSet.prompts[0].tags).toEqual(["entity", "visibility"]);
    expect(promptSet.privacy.redactPersonalData).toBe(true);
  });

  it("parses a separate mock provider run result format", () => {
    const run = promptSetRunSchema.parse(createSamplePromptSetRun());
    expect(run.mode).toBe("mock");
    expect(run.observations[0].citedUrls).toEqual(["https://example.com/about"]);
    expect(run.privacy.allowRawResponses).toBe(false);
  });

  it("parses a provider-mode run with a lawful provider name", () => {
    const run = promptSetRunSchema.parse({
      ...createSamplePromptSetRun(),
      mode: "provider",
      provider: "openai"
    });
    expect(run.mode).toBe("provider");
    expect(run.provider).toBe("openai");
  });

  it("rejects non-ISO generatedAt values", () => {
    expect(
      promptSetRunSchema.safeParse({
        ...createSamplePromptSetRun(),
        generatedAt: "not-a-date"
      })
    ).toMatchObject({ success: false });
  });

  it("rejects contradictory mode and provider values", () => {
    expect(
      promptSetRunSchema.safeParse({
        ...createSamplePromptSetRun(),
        provider: "openai"
      })
    ).toMatchObject({ success: false });
  });

  it("rejects provider-mode runs that use the mock provider", () => {
    expect(
      promptSetRunSchema.safeParse({
        ...createSamplePromptSetRun(),
        mode: "provider",
        provider: "mock"
      })
    ).toMatchObject({ success: false });
  });

  it("rejects invalid mode values", () => {
    expect(
      promptSetRunSchema.safeParse({
        ...createSamplePromptSetRun(),
        mode: "live",
        provider: "mock"
      })
    ).toMatchObject({ success: false });
  });
});
