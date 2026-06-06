import { describe, expect, it } from "vitest";
import { createSchemaTemplates, type PageSnapshot } from "../src/index.js";

function makePage(overrides: Partial<PageSnapshot>): PageSnapshot {
  return {
    url: "https://example.com",
    status: 200,
    title: "Example Publisher Guide",
    description: "A practical guide for making useful pages easier to cite.",
    canonical: "https://example.com",
    h1: ["Example Publisher Guide"],
    headings: ["Example Publisher Guide", "FAQ"],
    internalLinks: [],
    externalLinks: [],
    schemaTypes: [],
    openGraph: {},
    hasAuthor: true,
    hasPublishedDate: true,
    hasModifiedDate: true,
    citationCount: 1,
    answerBlockCount: 1,
    wordCount: 600,
    fetchMs: 25,
    ...overrides
  };
}

describe("schema templates", () => {
  it("selects common publisher templates from page signals", () => {
    const templates = createSchemaTemplates(makePage({ url: "https://example.com/" }));
    expect(templates.map((template) => template.type)).toEqual([
      "WebPage",
      "Organization",
      "FAQPage",
      "Article"
    ]);
  });

  it("adds product, software, and dataset templates when the page signals match", () => {
    const templates = createSchemaTemplates(
      makePage({
        url: "https://example.com/tools/analytics-suite",
        title: "Analytics Suite",
        description: "A dashboard app for product and data teams.",
        h1: ["Analytics Suite"],
        headings: ["Analytics Suite", "Pricing", "Dataset downloads"],
        hasAuthor: false,
        hasPublishedDate: false,
        hasModifiedDate: false,
        answerBlockCount: 0,
        citationCount: 0
      })
    );

    expect(templates.map((template) => template.type)).toEqual([
      "WebPage",
      "Product",
      "SoftwareApplication",
      "Dataset"
    ]);
  });
});
