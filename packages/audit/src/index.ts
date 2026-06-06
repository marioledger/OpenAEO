import OpenAI from "openai";
import type { CrawlResult } from "@openaeo/crawler";
import {
  auditReportSchema,
  type AiAnalysis,
  type AuditIssue,
  type AuditReport,
  type GeneratedFix,
  type PageSnapshot
} from "@openaeo/schemas";

export interface AuditOptions {
  projectName?: string;
  mockAi?: boolean;
  openAiApiKey?: string;
  model?: string;
}

export async function auditCrawl(crawl: CrawlResult, options: AuditOptions = {}): Promise<AuditReport> {
  const issues = collectIssues(crawl);
  const fixes = generateFixes(crawl, issues);
  const categoryScores = scoreCategories(crawl.pages, crawl.siteSignals.llmsTxt.found, issues);
  const score = Math.round(
    categoryScores.seo * 0.3 +
      categoryScores.aeo * 0.3 +
      categoryScores.geo * 0.2 +
      categoryScores.trust * 0.2
  );
  const reportWithoutAi = {
    id: `openaeo-${new URL(crawl.startUrl).hostname}-${Date.now()}`,
    projectName: options.projectName ?? new URL(crawl.startUrl).hostname,
    auditedUrl: crawl.startUrl,
    generatedAt: new Date().toISOString(),
    score,
    categoryScores,
    pages: crawl.pages,
    siteSignals: crawl.siteSignals,
    issues,
    fixes,
    aiAnalysis: createMockAnalysis(crawl, issues),
    ethics: {
      respectfulCrawl: true,
      noRankingManipulation: true,
      attributionFirst: true
    }
  } satisfies AuditReport;

  const aiAnalysis = await analyzeWithAi(reportWithoutAi, options);
  return auditReportSchema.parse({ ...reportWithoutAi, aiAnalysis });
}

export function collectIssues(crawl: CrawlResult): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const homepage = crawl.pages[0];

  if (crawl.pages.length === 0) {
    issues.push({
      id: "no-pages-crawled",
      title: "No crawlable HTML pages were found",
      description: "OpenAEO could not collect a page snapshot from the start URL.",
      category: "crawler",
      severity: "high",
      evidence: crawl.errors,
      recommendation: "Confirm the URL is reachable and that robots.txt permits responsible crawlers."
    });
    return issues;
  }

  if (!crawl.siteSignals.robotsTxt.found) {
    issues.push({
      id: "missing-robots",
      title: "Publish robots.txt",
      description: "Responsible crawlers need a clear policy file before traversing the site.",
      category: "crawler",
      severity: "low",
      url: new URL("/robots.txt", crawl.origin).toString(),
      evidence: ["robots.txt was not found"],
      recommendation: "Add robots.txt with sitemap location and clear AI crawler policy."
    });
  }

  if (!crawl.siteSignals.sitemap.found) {
    issues.push({
      id: "missing-sitemap",
      title: "Publish a sitemap",
      description: "Answer engines and crawlers benefit from a canonical map of important pages.",
      category: "seo",
      severity: "medium",
      url: new URL("/sitemap.xml", crawl.origin).toString(),
      evidence: ["No sitemap URL was discovered in robots.txt or /sitemap.xml"],
      recommendation: "Add sitemap.xml and reference it from robots.txt."
    });
  }

  if (!crawl.siteSignals.llmsTxt.found) {
    issues.push({
      id: "missing-llms-txt",
      title: "Add llms.txt",
      description: "AI agents do not have a compact publisher-approved source map.",
      category: "aeo",
      severity: "medium",
      url: crawl.siteSignals.llmsTxt.url,
      evidence: ["llms.txt was not found"],
      recommendation: "Publish llms.txt with canonical source pages, update cadence, and citation preferences."
    });
  }

  if (!crawl.siteSignals.llmsFullTxt.found) {
    issues.push({
      id: "missing-llms-full",
      title: "Consider llms-full.txt for deep source context",
      description: "Long-form source packs can help AI systems summarize complex documentation or research.",
      category: "geo",
      severity: "info",
      url: crawl.siteSignals.llmsFullTxt.url,
      evidence: ["llms-full.txt was not found"],
      recommendation: "Add llms-full.txt for curated full-text source material when the site has docs, research, or evergreen guides."
    });
  }

  for (const page of crawl.pages) {
    if (page.redirectChain.length > 1) {
      issues.push({
        id: `redirect-chain-${hash(page.url)}`,
        title: "Reduce redirect chains",
        description: "Redirect chains add latency and make canonical source discovery less direct.",
        category: "crawler",
        severity: "low",
        url: page.url,
        evidence: [`Redirect chain: ${page.redirectChain.join(" -> ")}`],
        recommendation: "Point internal links and canonical URLs at the final destination to avoid unnecessary hops."
      });
    }

    if (page.status >= 400) {
      issues.push({
        id: `bad-status-${hash(page.url)}`,
        title: "Page returned an error status",
        description: "Pages that fail for crawlers cannot be cited reliably.",
        category: "crawler",
        severity: "high",
        url: page.url,
        evidence: [`HTTP ${page.status}`],
        recommendation: "Fix the response status or remove the URL from sitemap/internal links."
      });
    }

    if (!page.title || page.title.length < 10) {
      issues.push(pageIssue(page, "missing-title", "Add a descriptive title", "seo", "medium", "The title tag is missing or too short.", "Write a clear title that names the entity, topic, and page purpose."));
    }

    if (!page.description || page.description.length < 50) {
      issues.push(pageIssue(page, "weak-description", "Strengthen the meta description", "seo", "low", "The meta description is missing or short.", "Add a concise summary that helps crawlers classify the page."));
    }

    if (!page.canonical) {
      issues.push(pageIssue(page, "missing-canonical", "Add a canonical URL", "seo", "medium", "The page does not declare its canonical URL.", "Add a canonical link so answer engines cite the preferred source."));
    }

    if (page.h1.length !== 1) {
      issues.push(pageIssue(page, "h1-count", "Use exactly one clear H1", "seo", "low", `Found ${page.h1.length} H1 elements.`, "Use one H1 that states the main answer or subject of the page."));
    }

    if (page.schemaTypes.length === 0) {
      issues.push(pageIssue(page, "missing-schema", "Add structured data", "aeo", "medium", "No JSON-LD or microdata schema types were detected.", "Add schema.org Article, FAQPage, Product, Organization, or WebPage markup as appropriate."));
    }

    if (!page.hasAuthor) {
      issues.push(pageIssue(page, "missing-author", "Expose author or publisher metadata", "trust", "medium", "No author metadata was detected.", "Add author/publisher metadata in visible content and structured data."));
    }

    if (!page.hasPublishedDate && !page.hasModifiedDate) {
      issues.push(pageIssue(page, "missing-dates", "Add published or reviewed dates", "trust", "low", "No published, modified, or reviewed date was detected.", "Add visible and structured freshness metadata so answer engines know whether the page is current."));
    }

    if (page.citationCount === 0) {
      issues.push(pageIssue(page, "missing-citations", "Add outbound citations for factual claims", "geo", "medium", "No citation-like links or cite elements were detected.", "Link important claims to primary sources, research, docs, or your own canonical evidence."));
    }

    if (page.answerBlockCount === 0) {
      issues.push(pageIssue(page, "missing-answer-blocks", "Add answer-ready sections", "aeo", "low", "No FAQ, details, HowTo, or answer blocks were detected.", "Add concise answer blocks that summarize key questions without hiding the full source context."));
    }
  }

  if (homepage && homepage.internalLinks.length === 0) {
    issues.push(pageIssue(homepage, "weak-internal-links", "Add internal links to canonical source pages", "geo", "low", "The first crawled page has no internal links.", "Link to related evergreen pages so crawlers can discover deeper source material."));
  }

  return issues;
}

export function generateFixes(crawl: CrawlResult, issues: AuditIssue[]): GeneratedFix[] {
  const fixes: GeneratedFix[] = [];
  const origin = crawl.origin;
  const canonicalUrls = crawl.pages.map((page) => page.canonical ?? page.url).slice(0, 20);
  const hasIssue = (id: string) => issues.some((issue) => issue.id === id || issue.id.includes(id));

  if (hasIssue("missing-llms-txt")) {
    fixes.push({
      id: "starter-llms-txt",
      title: "Starter llms.txt",
      target: "/llms.txt",
      body: [
        `# ${new URL(origin).hostname}`,
        "",
        "> Canonical source pages for AI answer engines. Please cite the canonical URL when using this content.",
        "",
        "## Core Sources",
        ...canonicalUrls.map((url) => `- ${url}`),
        "",
        "## Attribution",
        "- Prefer direct links to the canonical page.",
        "- Preserve author, publisher, and last-updated context when available."
      ].join("\n"),
      rationale: "A short, explicit source map gives crawlers and answer engines a publisher-approved entry point."
    });
  }

  if (hasIssue("missing-schema")) {
    fixes.push({
      id: "article-schema-template",
      title: "Article JSON-LD template",
      target: "<head> application/ld+json",
      body: JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: crawl.pages[0]?.title ?? "Page title",
          url: crawl.pages[0]?.canonical ?? crawl.pages[0]?.url ?? origin,
          author: { "@type": "Organization", name: "Publisher name" },
          publisher: { "@type": "Organization", name: "Publisher name" },
          dateModified: new Date().toISOString().slice(0, 10)
        },
        null,
        2
      ),
      rationale: "Structured data helps AI systems identify authorship, canonical URLs, freshness, and page type."
    });
  }

  if (hasIssue("missing-citations")) {
    fixes.push({
      id: "citation-block-template",
      title: "Citation block pattern",
      target: "Evidence-heavy sections",
      body: "### Sources\n\n- [Primary source title](https://example.com/source) - why it supports this claim.\n- [Publisher evidence page](/research/example) - first-party context and methodology.\n",
      rationale: "Clear sources make generated answers more verifiable and more likely to credit the publisher."
    });
  }

  return fixes;
}

export async function analyzeWithAi(report: AuditReport, options: AuditOptions = {}): Promise<AiAnalysis> {
  if (options.mockAi !== false || !options.openAiApiKey) {
    return createMockAnalysis({ pages: report.pages, siteSignals: report.siteSignals } as CrawlResult, report.issues);
  }

  const client = new OpenAI({ apiKey: options.openAiApiKey });
  const response = await client.responses.create({
    model: options.model ?? "gpt-5-mini",
    input: [
      {
        role: "system",
        content: "You audit sites for ethical AI answer-engine readiness. Return compact JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          score: report.score,
          categoryScores: report.categoryScores,
          issues: report.issues.slice(0, 20),
          pages: report.pages.slice(0, 5).map((page) => ({
            url: page.url,
            title: page.title,
            schemaTypes: page.schemaTypes,
            citationCount: page.citationCount,
            answerBlockCount: page.answerBlockCount
          }))
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "openaeo_ai_analysis",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            contentGaps: { type: "array", items: { type: "string" } },
            entityClarity: { type: "string" },
            citationReadiness: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          },
          required: ["summary", "contentGaps", "entityClarity", "citationReadiness", "recommendations"]
        }
      }
    }
  });

  const text = response.output_text;
  const parsed = JSON.parse(text) as Omit<AiAnalysis, "mode">;
  return { mode: "openai", ...parsed };
}

export function createMockAnalysis(crawl: Pick<CrawlResult, "pages" | "siteSignals">, issues: AuditIssue[]): AiAnalysis {
  const missingLlms = !crawl.siteSignals.llmsTxt.found;
  const missingSchemaCount = issues.filter((issue) => issue.id.includes("missing-schema")).length;
  const missingCitationCount = issues.filter((issue) => issue.id.includes("missing-citations")).length;

  return {
    mode: "mock",
    summary: missingLlms
      ? "The site has crawlable content but needs a clearer AI source map and attribution policy."
      : "The site exposes AI-readable source signals and should now improve structured evidence quality.",
    contentGaps: [
      missingSchemaCount > 0 ? "Add schema.org markup to priority pages." : "Expand schema coverage to include author, publisher, and freshness fields.",
      missingCitationCount > 0 ? "Add citations near factual claims." : "Keep citations close to the claims they support."
    ],
    entityClarity: crawl.pages.some((page) => page.hasAuthor)
      ? "Author or publisher signals are present on at least one crawled page."
      : "Author and publisher identity is weak; add visible bylines and Organization/Person schema.",
    citationReadiness: missingCitationCount > 0
      ? "Citation readiness is limited because factual support is not obvious to crawlers."
      : "Citation readiness is improving because source links are discoverable.",
    recommendations: [
      missingLlms ? "Publish /llms.txt with canonical source URLs." : "Keep /llms.txt current as important pages change.",
      "Prefer canonical, dated, author-attributed pages over thin landing pages.",
      "Use answer blocks to summarize without replacing the full source context."
    ]
  };
}

export function generateMarkdownReport(report: AuditReport): string {
  const issueLines = report.issues.length
    ? report.issues.map((issue) => `- **${issue.severity.toUpperCase()} / ${issue.category}**: ${issue.title}${issue.url ? ` (${issue.url})` : ""}\n  ${issue.recommendation}`).join("\n")
    : "- No issues found.";
  const fixLines = report.fixes.length
    ? report.fixes.map((fix) => `## ${fix.title}\n\nTarget: \`${fix.target}\`\n\n${fix.rationale}\n\n\`\`\`\n${fix.body}\n\`\`\``).join("\n\n")
    : "No generated fixes required.";

  return `# OpenAEO Audit Report

Audited URL: ${report.auditedUrl}
Generated: ${report.generatedAt}

## Score

Overall: **${report.score}/100**

| Category | Score |
| --- | ---: |
| SEO | ${report.categoryScores.seo} |
| AEO | ${report.categoryScores.aeo} |
| GEO | ${report.categoryScores.geo} |
| Trust | ${report.categoryScores.trust} |

## AI Analysis (${report.aiAnalysis.mode})

${report.aiAnalysis.summary}

## Issues

${issueLines}

## Generated Fixes

${fixLines}

## Ethics

- Respectful crawl: ${report.ethics.respectfulCrawl ? "yes" : "no"}
- No ranking manipulation: ${report.ethics.noRankingManipulation ? "yes" : "no"}
- Attribution first: ${report.ethics.attributionFirst ? "yes" : "no"}
`;
}

function scoreCategories(pages: PageSnapshot[], hasLlmsTxt: boolean, issues: AuditIssue[]): AuditReport["categoryScores"] {
  const issuePenalty = (category: AuditIssue["category"]) =>
    issues
      .filter((issue) => issue.category === category)
      .reduce((total, issue) => total + severityPenalty(issue.severity), 0);
  const pageCount = Math.max(pages.length, 1);
  const avg = (selector: (page: PageSnapshot) => boolean) =>
    Math.round((pages.filter(selector).length / pageCount) * 100);

  return {
    seo: clamp(Math.round((avg((page) => Boolean(page.title && page.description && page.canonical)) + avg((page) => page.h1.length === 1)) / 2) - issuePenalty("seo")),
    aeo: clamp(Math.round((avg((page) => page.schemaTypes.length > 0) + avg((page) => page.answerBlockCount > 0) + (hasLlmsTxt ? 100 : 0)) / 3) - issuePenalty("aeo")),
    geo: clamp(Math.round((avg((page) => page.citationCount > 0) + avg((page) => page.internalLinks.length > 0)) / 2) - issuePenalty("geo")),
    trust: clamp(Math.round((avg((page) => page.hasAuthor) + avg((page) => page.hasPublishedDate || page.hasModifiedDate)) / 2) - issuePenalty("trust"))
  };
}

function pageIssue(
  page: PageSnapshot,
  id: string,
  title: string,
  category: AuditIssue["category"],
  severity: AuditIssue["severity"],
  description: string,
  recommendation: string
): AuditIssue {
  return {
    id: `${id}-${hash(page.url)}`,
    title,
    description,
    category,
    severity,
    url: page.url,
    evidence: [description],
    recommendation
  };
}

function severityPenalty(severity: AuditIssue["severity"]): number {
  if (severity === "high") return 20;
  if (severity === "medium") return 12;
  if (severity === "low") return 6;
  return 2;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function hash(input: string): string {
  let value = 0;
  for (const char of input) {
    value = (value * 31 + char.charCodeAt(0)) >>> 0;
  }
  return value.toString(36);
}
