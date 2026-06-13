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
  redirectChain: z.array(z.string().url()).default([]),
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

export const schemaTemplateTypeSchema = z.enum([
  "Article",
  "FAQPage",
  "Product",
  "Organization",
  "SoftwareApplication",
  "Dataset",
  "WebPage"
]);

export const schemaTemplateSchema = z.object({
  type: schemaTemplateTypeSchema,
  title: z.string(),
  rationale: z.string(),
  jsonLd: z.record(z.string(), z.unknown())
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

export const promptSetVariantSchema = z.object({
  id: z.string(),
  label: z.string(),
  prompt: z.string(),
  intent: z.string(),
  tags: z.array(z.string()).default([])
});

export const promptSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  targetSiteUrl: z.string().url(),
  provider: z.string().min(1),
  prompts: z.array(promptSetVariantSchema).min(1),
  privacy: z.object({
    allowRawResponses: z.boolean().default(false),
    redactPersonalData: z.boolean().default(true),
    notes: z.array(z.string()).default([])
  }),
  notes: z.array(z.string()).default([])
});

export const promptSetObservationSchema = z.object({
  promptId: z.string(),
  responseSummary: z.string(),
  citedUrls: z.array(z.string().url()).default([]),
  mentionCount: z.number().int().nonnegative().default(0),
  sourcePositions: z.array(z.number().int().nonnegative()).default([])
});

const promptSetRunCommonShape = {
  id: z.string(),
  promptSetId: z.string(),
  siteUrl: z.string().url(),
  generatedAt: z.iso.datetime(),
  observations: z.array(promptSetObservationSchema),
  privacy: promptSetSchema.shape.privacy,
  notes: z.array(z.string()).default([])
};

export const promptSetRunSchema = z.discriminatedUnion("mode", [
  z.object({
    ...promptSetRunCommonShape,
    mode: z.literal("mock"),
    provider: z.literal("mock")
  }),
  z.object({
    ...promptSetRunCommonShape,
    mode: z.literal("provider"),
    provider: z
      .string()
      .min(1)
      .refine((value) => value !== "mock", {
        message: 'provider cannot be "mock" when mode is "provider"'
      })
  })
]);

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
export type SchemaTemplateType = z.infer<typeof schemaTemplateTypeSchema>;
export type SchemaTemplate = z.infer<typeof schemaTemplateSchema>;
export type SiteSignals = z.infer<typeof siteSignalsSchema>;
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type AuditReport = z.infer<typeof auditReportSchema>;
export type StrategyItem = z.infer<typeof strategyItemSchema>;
export type StrategySignal = z.infer<typeof strategySignalSchema>;
export type StrategyBrief = z.infer<typeof strategyBriefSchema>;
export type PromptSetVariant = z.infer<typeof promptSetVariantSchema>;
export type PromptSet = z.infer<typeof promptSetSchema>;
export type PromptSetObservation = z.infer<typeof promptSetObservationSchema>;
export type PromptSetRun = z.infer<typeof promptSetRunSchema>;

/**
 * Build a validated sample audit report for docs and tests.
 */
export function createSampleReport(): AuditReport {
  return auditReportSchema.parse({
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
        redirectChain: ["https://www.example.com/", "https://example.com/"],
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
  });
}

/**
 * Build a sample prompt set for AI visibility experiments.
 */
export function createSamplePromptSet(): PromptSet {
  return {
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
      },
      {
        id: "prompt-2",
        label: "Citation readiness",
        prompt: "Which source should be cited for Example Publisher's publishing guidelines?",
        intent: "Check whether the answer points at a canonical source page.",
        tags: ["citation", "source map"]
      }
    ],
    privacy: {
      allowRawResponses: false,
      redactPersonalData: true,
      notes: ["Avoid collecting personal data from responses."]
    },
    notes: ["Store this artifact separately from site audits."]
  };
}

/**
 * Build a validated sample prompt-set run for mock or provider-mode tests.
 */
export function createSamplePromptSetRun(options: {
  mode?: "mock" | "provider";
  provider?: string;
} = {}): PromptSetRun {
  const promptSet = createSamplePromptSet();
  const mode = options.mode ?? "mock";
  const provider = mode === "mock" ? "mock" : options.provider ?? "openai";

  return promptSetRunSchema.parse({
    id: "visibility-brand-run",
    promptSetId: promptSet.id,
    siteUrl: promptSet.targetSiteUrl,
    generatedAt: "2026-06-09T00:00:00.000Z",
    provider,
    mode,
    observations: [
      {
        promptId: "prompt-1",
        responseSummary: "Example Publisher appears in the answer with one citation.",
        citedUrls: ["https://example.com/about"],
        mentionCount: 1,
        sourcePositions: [1]
      },
      {
        promptId: "prompt-2",
        responseSummary: "The answer cites the publishing guide and a canonical source page.",
        citedUrls: ["https://example.com/guidelines"],
        mentionCount: 1,
        sourcePositions: [1, 2]
      }
    ],
    privacy: promptSet.privacy,
    notes: ["Keep this output out of the audit report schema."]
  });
}

export function createSchemaTemplates(page: PageSnapshot): SchemaTemplate[] {
  const pageTypeSet = new Set<SchemaTemplateType>(["WebPage"]);
  const detectionText = [
    page.title,
    page.description,
    page.h1.join(" "),
    page.headings.join(" "),
    ...Object.values(page.openGraph)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const pathname = safeUrlPath(page.url);

  if (pathname === "/" || pathname === "") {
    pageTypeSet.add("Organization");
  }

  if (page.answerBlockCount > 0 || /\bfaq\b|\bquestions?\b/.test(detectionText)) {
    pageTypeSet.add("FAQPage");
  }

  if (page.title && page.description && (page.hasAuthor || page.hasPublishedDate || page.hasModifiedDate || page.citationCount > 0)) {
    pageTypeSet.add("Article");
  }

  if (/\b(product|pricing|price|plan|shop|buy|checkout|cart)\b/.test(detectionText)) {
    pageTypeSet.add("Product");
  }

  if (/\b(software|application|app|tool|dashboard|platform|api|library)\b/.test(detectionText)) {
    pageTypeSet.add("SoftwareApplication");
  }

  if (/\b(dataset|data|download|csv|report|metrics|statistics)\b/.test(detectionText)) {
    pageTypeSet.add("Dataset");
  }

  return [...pageTypeSet].map((type) => buildSchemaTemplate(type, page));
}

function buildSchemaTemplate(type: SchemaTemplateType, page: PageSnapshot): SchemaTemplate {
  const canonical = page.canonical ?? page.url;
  const origin = new URL(page.url).origin;

  switch (type) {
    case "Article":
      return {
        type,
        title: "Article JSON-LD template",
        rationale: "Article markup helps answer engines recognize authorship, canonical URLs, and freshness signals.",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: page.title ?? "Page title",
          url: canonical,
          description: page.description ?? "Article summary",
          author: { "@type": "Organization", name: "Publisher name" },
          publisher: { "@type": "Organization", name: "Publisher name" },
          dateModified: "YYYY-MM-DD"
        }
      };
    case "FAQPage":
      return {
        type,
        title: "FAQPage JSON-LD template",
        rationale: "FAQ markup turns answer blocks into explicit question-and-answer structure for crawlers.",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Question goes here",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Answer goes here."
              }
            }
          ]
        }
      };
    case "Product":
      return {
        type,
        title: "Product JSON-LD template",
        rationale: "Product markup helps answer engines classify commerce pages and surface pricing or availability context.",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Product",
          name: page.title ?? "Product name",
          description: page.description ?? "Product description",
          brand: { "@type": "Organization", name: "Brand name" },
          offers: {
            "@type": "Offer",
            price: "0.00",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock"
          }
        }
      };
    case "Organization":
      return {
        type,
        title: "Organization JSON-LD template",
        rationale: "Organization markup reinforces the publisher identity behind the source material.",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: page.title ?? new URL(page.url).hostname,
          url: origin,
          logo: `${origin}/logo.png`
        }
      };
    case "SoftwareApplication":
      return {
        type,
        title: "SoftwareApplication JSON-LD template",
        rationale: "SoftwareApplication markup fits tools, dashboards, and product-led pages with usage context.",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: page.title ?? "Software name",
          description: page.description ?? "Software description",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
          }
        }
      };
    case "Dataset":
      return {
        type,
        title: "Dataset JSON-LD template",
        rationale: "Dataset markup is useful for reports, downloads, and structured data releases that should be cited directly.",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: page.title ?? "Dataset name",
          description: page.description ?? "Dataset description",
          url: canonical,
          license: "https://creativecommons.org/licenses/by/4.0/"
        }
      };
    case "WebPage":
    default:
      return {
        type: "WebPage",
        title: "WebPage JSON-LD template",
        rationale: "WebPage markup provides a general-purpose schema baseline for any page that does not fit a narrower type.",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.title ?? "Page title",
          url: canonical,
          description: page.description ?? "Page description"
        }
      };
  }
}

function safeUrlPath(rawUrl: string): string {
  try {
    return new URL(rawUrl).pathname;
  } catch {
    return "";
  }
}
