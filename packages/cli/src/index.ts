#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { auditCrawl, generateMarkdownReport } from "@openaeo/audit";
import { crawlSite } from "@openaeo/crawler";
import { generateComparisonMarkdown, compareAuditReports, loadAuditReport } from "./report-comparison.js";
import { generateStrategyMarkdown, runStrategyMonitor } from "@openaeo/strategy";

interface AuditCommandOptions {
  maxPages: string;
  out: string;
  json: boolean;
  markdown: boolean;
  mockAi: boolean;
  openaiApiKey?: string;
  model?: string;
  projectName?: string;
  allowPrivateNetwork: boolean;
  include: string[];
  exclude: string[];
}

interface MonitorCommandOptions {
  site: string;
  feed: string[];
  maxItems: string;
  out: string;
  json: boolean;
  markdown: boolean;
  mockAi: boolean;
  openaiApiKey?: string;
  model?: string;
  allowPrivateNetwork: boolean;
}

interface CompareCommandOptions {
  out: string;
  json: boolean;
  markdown: boolean;
}

const program = new Command();

program
  .name("openaeo")
  .description("Audit websites for AI answer-engine readiness, classic SEO health, and attribution signals.")
  .version("0.1.0");

program
  .command("audit")
  .argument("<url>", "URL to audit")
  .option("--max-pages <number>", "Maximum same-origin pages to crawl", "8")
  .option("--out <directory>", "Directory for report artifacts", "reports")
  .option("--json", "Write JSON report", true)
  .option("--markdown", "Write Markdown report", true)
  .option("--mock-ai", "Use deterministic mock analysis instead of the OpenAI API", false)
  .option("--openai-api-key <key>", "OpenAI API key for analysis; defaults to OPENAI_API_KEY")
  .option("--model <model>", "OpenAI model for analysis", "gpt-5-mini")
  .option("--project-name <name>", "Readable project name for report output")
  .option("--allow-private-network", "Allow localhost/private-network targets for trusted local fixtures", false)
  .option("--include <pattern>", "Only crawl URLs whose path matches this pattern (* wildcard only); repeat for multiple patterns", collectRepeatable, [])
  .option("--exclude <pattern>", "Skip URLs whose path matches this pattern (* wildcard only); repeat for multiple patterns", collectRepeatable, [])
  .action(async (url: string, options: AuditCommandOptions) => {
    const started = Date.now();
    const maxPages = Number.parseInt(options.maxPages, 10);
    if (!Number.isFinite(maxPages) || maxPages < 1) {
      throw new Error("--max-pages must be a positive integer");
    }

    const openAiApiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY;
    const crawl = await crawlSite(url, {
      maxPages,
      allowPrivateNetwork: options.allowPrivateNetwork,
      includePatterns: options.include,
      excludePatterns: options.exclude
    });
    const report = await auditCrawl(crawl, {
      projectName: options.projectName,
      mockAi: options.mockAi || !openAiApiKey,
      openAiApiKey,
      model: options.model
    });
    const outDir = resolve(options.out);
    await mkdir(outDir, { recursive: true });
    const jsonPath = resolve(outDir, "openaeo-report.json");
    const markdownPath = resolve(outDir, "openaeo-report.md");

    if (options.json) {
      await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    }
    if (options.markdown) {
      await writeFile(markdownPath, generateMarkdownReport(report), "utf8");
    }

    console.log(`OpenAEO score: ${report.score}/100`);
    console.log(`Pages crawled: ${report.pages.length}`);
    console.log(`Issues found: ${report.issues.length}`);
    console.log(`Reports: ${options.json ? jsonPath : ""}${options.json && options.markdown ? ", " : ""}${options.markdown ? markdownPath : ""}`);
    console.log(`Completed in ${Date.now() - started}ms`);
  });

program
  .command("monitor")
  .description("Scan news/RSS/Atom feeds for AI-search strategy changes and generate an action brief.")
  .requiredOption("--site <url>", "Website URL the strategy brief is for")
  .option("--feed <url>", "RSS or Atom feed URL to scan; repeat for multiple feeds", collectRepeatable, [])
  .option("--max-items <number>", "Maximum feed items to analyze", "20")
  .option("--out <directory>", "Directory for strategy artifacts", "reports")
  .option("--json", "Write JSON strategy brief", true)
  .option("--markdown", "Write Markdown strategy brief", true)
  .option("--mock-ai", "Use deterministic strategy analysis instead of the OpenAI API", false)
  .option("--openai-api-key <key>", "OpenAI API key for strategy analysis; defaults to OPENAI_API_KEY")
  .option("--model <model>", "OpenAI model for strategy analysis", "gpt-5-mini")
  .option("--allow-private-network", "Allow localhost/private-network feeds for trusted fixtures", false)
  .action(async (options: MonitorCommandOptions) => {
    const started = Date.now();
    const maxItems = Number.parseInt(options.maxItems, 10);
    if (!Number.isFinite(maxItems) || maxItems < 1) {
      throw new Error("--max-items must be a positive integer");
    }
    if (options.feed.length === 0) {
      throw new Error("At least one --feed URL is required");
    }

    const openAiApiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY;
    const brief = await runStrategyMonitor({
      siteUrl: options.site,
      feedUrls: options.feed,
      maxItems,
      mockAi: options.mockAi || !openAiApiKey,
      openAiApiKey,
      model: options.model,
      allowPrivateNetwork: options.allowPrivateNetwork
    });
    const outDir = resolve(options.out);
    await mkdir(outDir, { recursive: true });
    const jsonPath = resolve(outDir, "openaeo-strategy.json");
    const markdownPath = resolve(outDir, "openaeo-strategy.md");

    if (options.json) {
      await writeFile(jsonPath, `${JSON.stringify(brief, null, 2)}\n`, "utf8");
    }
    if (options.markdown) {
      await writeFile(markdownPath, generateStrategyMarkdown(brief), "utf8");
    }

    console.log(`Strategy signals: ${brief.signals.length}`);
    console.log(`Items scanned: ${brief.items.length}`);
    console.log(`Mode: ${brief.mode}`);
    console.log(`Reports: ${options.json ? jsonPath : ""}${options.json && options.markdown ? ", " : ""}${options.markdown ? markdownPath : ""}`);
    console.log(`Completed in ${Date.now() - started}ms`);
  });

program
  .command("compare")
  .description("Compare two audit report JSON files and summarize score, issue, and signal changes.")
  .argument("<baseline>", "Baseline audit report JSON file")
  .argument("<current>", "Current audit report JSON file")
  .option("--out <directory>", "Directory for comparison artifacts", "reports")
  .option("--json", "Write JSON comparison", true)
  .option("--markdown", "Write Markdown comparison", true)
  .action(async (baselinePath: string, currentPath: string, options: CompareCommandOptions) => {
    const started = Date.now();
    const baseline = await loadAuditReport(baselinePath);
    const current = await loadAuditReport(currentPath);
    const comparison = compareAuditReports(baseline, current);
    const outDir = resolve(options.out);
    await mkdir(outDir, { recursive: true });
    const jsonPath = resolve(outDir, "openaeo-report-comparison.json");
    const markdownPath = resolve(outDir, "openaeo-report-comparison.md");

    if (options.json) {
      await writeFile(jsonPath, `${JSON.stringify(comparison, null, 2)}\n`, "utf8");
    }
    if (options.markdown) {
      await writeFile(markdownPath, generateComparisonMarkdown(comparison), "utf8");
    }

    console.log(`OpenAEO comparison: ${baseline.projectName} -> ${current.projectName}`);
    console.log(`Score delta: ${comparison.scoreDelta > 0 ? "+" : ""}${comparison.scoreDelta}`);
    console.log(
      `Issues: ${comparison.issueComparison.newIssues.length} new, ${comparison.issueComparison.resolvedIssues.length} resolved, ${comparison.issueComparison.unchangedIssues.length} unchanged`
    );
    console.log(`Signal changes: ${comparison.signalChanges.length}`);
    console.log(`Reports: ${options.json ? jsonPath : ""}${options.json && options.markdown ? ", " : ""}${options.markdown ? markdownPath : ""}`);
    console.log(`Completed in ${Date.now() - started}ms`);
  });

function collectRepeatable(value: string, previous: string[]): string[] {
  return [...previous, value];
}

await program.parseAsync(process.argv);
