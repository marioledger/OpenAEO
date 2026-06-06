import { describe, expect, it } from "vitest";
import type { CrawlResult } from "@openaeo/crawler";
import { auditCrawl, collectIssues, generateMarkdownReport } from "../src/index.js";

const crawl: CrawlResult = {
  origin: "https://example.com",
  startUrl: "https://example.com",
  blockedUrls: [],
  errors: [],
  siteSignals: {
    robotsTxt: { found: true, url: "https://example.com/robots.txt" },
    sitemap: { found: true, url: "https://example.com/sitemap.xml", discoveredUrls: ["https://example.com"] },
    llmsTxt: { found: false, url: "https://example.com/llms.txt" },
    llmsFullTxt: { found: false, url: "https://example.com/llms-full.txt" }
  },
  pages: [
    {
      url: "https://example.com",
      status: 200,
      title: "Example Source",
      description: "Short",
      canonical: "https://example.com",
      redirectChain: ["https://www.example.com/", "https://example.com/"],
      h1: ["Example Source"],
      headings: ["Example Source"],
      internalLinks: [],
      externalLinks: [],
      schemaTypes: [],
      openGraph: {},
      hasAuthor: false,
      hasPublishedDate: false,
      hasModifiedDate: false,
      citationCount: 0,
      answerBlockCount: 0,
      wordCount: 120,
      fetchMs: 12
    }
  ]
};

const schemaRichCrawl: CrawlResult = {
  ...crawl,
  pages: [
    {
      ...crawl.pages[0],
      url: "https://example.com/",
      title: "Example Publisher Guide",
      description: "A practical guide for making useful pages easier to cite.",
      h1: ["Example Publisher Guide"],
      headings: ["Example Publisher Guide", "FAQ"],
      hasAuthor: true,
      hasPublishedDate: true,
      hasModifiedDate: true,
      citationCount: 2,
      answerBlockCount: 1
    }
  ]
};

describe("audit rules", () => {
  it("flags missing AEO and trust signals", () => {
    const issues = collectIssues(crawl);
    expect(issues.map((issue) => issue.id).join(" ")).toContain("missing-llms-txt");
    expect(issues.map((issue) => issue.id).join(" ")).toContain("missing-schema");
    expect(issues.map((issue) => issue.id).join(" ")).toContain("missing-author");
    expect(issues.map((issue) => issue.id).join(" ")).toContain("redirect-chain");
  });

  it("creates a valid markdown report", async () => {
    const report = await auditCrawl(crawl, { mockAi: true });
    const markdown = generateMarkdownReport(report);
    expect(report.score).toBeLessThan(80);
    expect(report.fixes.some((fix) => fix.target === "/llms.txt")).toBe(true);
    expect(markdown).toContain("# OpenAEO Audit Report");
  });

  it("generates typed schema templates from page signals", async () => {
    const report = await auditCrawl(schemaRichCrawl, { mockAi: true });
    expect(report.fixes.map((fix) => fix.id)).toEqual([
      "starter-llms-txt",
      "webpage-schema-template",
      "organization-schema-template",
      "faqpage-schema-template",
      "article-schema-template"
    ]);
  });
});
