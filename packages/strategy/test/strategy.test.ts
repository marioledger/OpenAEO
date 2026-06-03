import { describe, expect, it } from "vitest";
import { createStrategyBrief, detectStrategySignals, generateStrategyMarkdown } from "../src/index.js";
import type { StrategyItem } from "@openaeo/schemas";

const items: StrategyItem[] = [
  {
    id: "item-1",
    title: "AI search engines improve source citation for publishers",
    url: "https://example.com/news/citations",
    source: "https://example.com/feed.xml",
    publishedAt: "2026-06-04T00:00:00.000Z",
    summary: "The update changes citation, attribution, and crawler guidance for source pages.",
    matchedTerms: ["citation", "attribution", "crawler"]
  },
  {
    id: "item-2",
    title: "Structured data quality matters for answer visibility",
    url: "https://example.com/news/schema",
    source: "https://example.com/feed.xml",
    summary: "Publishers should refresh schema and metadata.",
    matchedTerms: ["schema", "metadata"]
  }
];

describe("strategy monitor", () => {
  it("detects immediate strategy signals from monitored items", () => {
    const signals = detectStrategySignals(items);
    expect(signals.map((signal) => signal.id)).toContain("citation-attribution");
    expect(signals.map((signal) => signal.id)).toContain("ai-crawler-access");
  });

  it("creates deterministic strategy briefs and markdown", async () => {
    const brief = await createStrategyBrief({
      siteUrl: "https://publisher.example",
      feedUrls: ["https://example.com/feed.xml"],
      items,
      mockAi: true
    });
    expect(brief.mode).toBe("mock");
    expect(brief.immediateActions.length).toBeGreaterThan(0);
    expect(generateStrategyMarkdown(brief)).toContain("# OpenAEO Strategy Brief");
  });
});
