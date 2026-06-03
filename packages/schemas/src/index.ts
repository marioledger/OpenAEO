import { z } from "zod";

export const issueSeveritySchema = z.enum(["info", "low", "medium", "high"]);
export const issueCategorySchema = z.enum(["seo", "aeo", "geo", "crawler", "trust"]);

export const auditIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: issueCategorySchema,
  severity: issueSeveritySchema,
  url: z.string().url().optional(),
  evidence: z.array(z.string()).default([]),
  recommendation: z.string()
});

export const generatedFixSchema = z.object({
  id: z.string(),
  title: z.string(),
  target: z.string(),
  body: z.string(),
  rationale: z.string()
});

export const pageSnapshotSchema = z.object({
  url: z.string().url(),
  status: z.number().int(),
  title: z.string().optional(),
  description: z.string().optional(),
  canonical: z.string().optional(),
  h1: z.array(z.string()).default([]),
  headings: z.array(z.string()).default([]),
  internalLinks: z.array(z.string().url()).default([]),
  externalLinks: z.array(z.string().url()).default([]),
  schemaTypes: z.array(z.string()).default([]),
  openGraph: z.record(z.string(), z.string()).default({}),
  hasAuthor: z.boolean().default(false),
  hasPublishedDate: z.boolean().default(false),
  hasModifiedDate: z.boolean().default(false),
  citationCount: z.number().int().nonnegative().default(0),
  answerBlockCount: z.number().int().nonnegative().default(0),
  wordCount: z.number().int().nonnegative().default(0),
  fetchMs: z.number().int().nonnegative().default(0)
});

export const siteSignalsSchema = z.object({
  robotsTxt: z.object({
    found: z.boolean(),
    url: z.string().url()
  }),
  sitemap: z.object({
    found: z.boolean(),
    url: z.string().url().optional(),
    discoveredUrls: z.array(z.string().url()).default([])
  }),
  llmsTxt: z.object({
    found: z.boolean(),
    url: z.string().url(),
    summary: z.string().optional()
  }),
  llmsFullTxt: z.object({
    found: z.boolean(),
    url: z.string().url()
  })
});

export const aiAnalysisSchema = z.object({
  mode: z.enum(["mock", "openai"]),
  summary: z.string(),
  contentGaps: z.array(z.string()),
  entityClarity: z.string(),
  citationReadiness: z.string(),
  recommendations: z.array(z.string())
});

export const strategyItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
  publishedAt: z.string().optional(),
  summary: z.string().default(""),
  matchedTerms: z.array(z.string()).default([])
});

export const strategySignalSchema = z.object({
  id: z.string(),
  topic: z.string(),
  urgency: z.enum(["watch", "soon", "now"]),
  evidence: z.array(z.string()).default([]),
  action: z.string(),
  sourceItemIds: z.array(z.string()).default([])
});

export const strategyBriefSchema = z.object({
  id: z.string(),
  siteUrl: z.string().url(),
  generatedAt: z.string(),
  mode: z.enum(["mock", "openai"]),
  scannedFeeds: z.array(z.string().url()),
  items: z.array(strategyItemSchema),
  signals: z.array(strategySignalSchema),
  summary: z.string(),
  immediateActions: z.array(z.string()),
  experiments: z.array(z.string()),
  contentUpdates: z.array(z.string())
});

export const auditReportSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  auditedUrl: z.string().url(),
  generatedAt: z.string(),
  score: z.number().min(0).max(100),
  categoryScores: z.object({
    seo: z.number().min(0).max(100),
    aeo: z.number().min(0).max(100),
    geo: z.number().min(0).max(100),
    trust: z.number().min(0).max(100)
  }),
  pages: z.array(pageSnapshotSchema),
  siteSignals: siteSignalsSchema,
  issues: z.array(auditIssueSchema),
  fixes: z.array(generatedFixSchema),
  aiAnalysis: aiAnalysisSchema,
  ethics: z.object({
    respectfulCrawl: z.boolean(),
    noRankingManipulation: z.boolean(),
    attributionFirst: z.boolean()
  })
});

export type IssueSeverity = z.infer<typeof issueSeveritySchema>;
export type IssueCategory = z.infer<typeof issueCategorySchema>;
export type AuditIssue = z.infer<typeof auditIssueSchema>;
export type GeneratedFix = z.infer<typeof generatedFixSchema>;
export type PageSnapshot = z.infer<typeof pageSnapshotSchema>;
export type SiteSignals = z.infer<typeof siteSignalsSchema>;
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type AuditReport = z.infer<typeof auditReportSchema>;
export type StrategyItem = z.infer<typeof strategyItemSchema>;
export type StrategySignal = z.infer<typeof strategySignalSchema>;
export type StrategyBrief = z.infer<typeof strategyBriefSchema>;

export function createSampleReport(): AuditReport {
  return {
    id: "sample-openaeo-report",
    projectName: "OpenAEO Demo",
    auditedUrl: "https://example.com",
    generatedAt: "2026-06-04T00:00:00.000Z",
    score: 74,
    categoryScores: {
      seo: 82,
      aeo: 70,
      geo: 65,
      trust: 78
    },
    pages: [
      {
        url: "https://example.com",
        status: 200,
        title: "Example Publisher Guide",
        description: "A practical guide for making useful pages easier to cite.",
        canonical: "https://example.com",
        h1: ["Example Publisher Guide"],
        headings: ["Example Publisher Guide", "Sources", "FAQ"],
        internalLinks: ["https://example.com/about"],
        externalLinks: ["https://schema.org/Article"],
        schemaTypes: ["Article", "FAQPage"],
        openGraph: { "og:title": "Example Publisher Guide" },
        hasAuthor: true,
        hasPublishedDate: true,
        hasModifiedDate: true,
        citationCount: 3,
        answerBlockCount: 2,
        wordCount: 620,
        fetchMs: 42
      }
    ],
    siteSignals: {
      robotsTxt: { found: true, url: "https://example.com/robots.txt" },
      sitemap: {
        found: true,
        url: "https://example.com/sitemap.xml",
        discoveredUrls: ["https://example.com", "https://example.com/about"]
      },
      llmsTxt: {
        found: false,
        url: "https://example.com/llms.txt"
      },
      llmsFullTxt: {
        found: false,
        url: "https://example.com/llms-full.txt"
      }
    },
    issues: [
      {
        id: "missing-llms-txt",
        title: "Add an llms.txt entry point",
        description: "AI agents do not have a concise map of the site's best source material.",
        category: "aeo",
        severity: "medium",
        url: "https://example.com/llms.txt",
        evidence: ["GET /llms.txt returned 404"],
        recommendation: "Publish an llms.txt file with canonical pages, update cadence, and citation preferences."
      }
    ],
    fixes: [
      {
        id: "llms-txt-template",
        title: "Starter llms.txt",
        target: "/llms.txt",
        body: "# Example Publisher\n\n> Canonical source pages for answer engines.\n\n- https://example.com\n- https://example.com/about\n",
        rationale: "A concise source map helps answer engines find the strongest publisher-approved pages."
      }
    ],
    aiAnalysis: {
      mode: "mock",
      summary: "The site has a solid SEO baseline but needs a clearer answer-engine source map.",
      contentGaps: ["Add concise answer blocks near evidence-heavy sections."],
      entityClarity: "The publisher identity is present but should be repeated in structured data.",
      citationReadiness: "Citations exist, but source dates and canonical links should be more consistent.",
      recommendations: ["Add llms.txt", "Expand Article schema", "Add last-reviewed dates"]
    },
    ethics: {
      respectfulCrawl: true,
      noRankingManipulation: true,
      attributionFirst: true
    }
  };
}
