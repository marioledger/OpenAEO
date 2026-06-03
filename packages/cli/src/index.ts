#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { auditCrawl, generateMarkdownReport } from "@openaeo/audit";
import { crawlSite } from "@openaeo/crawler";

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
  .option("--mock-ai", "Use deterministic mock analysis even when an API key exists", true)
  .option("--openai-api-key <key>", "OpenAI API key for optional BYOK analysis")
  .option("--model <model>", "OpenAI model for optional BYOK analysis", "gpt-5-mini")
  .option("--project-name <name>", "Readable project name for report output")
  .option("--allow-private-network", "Allow localhost/private-network targets for trusted local fixtures", false)
  .action(async (url: string, options: AuditCommandOptions) => {
    const started = Date.now();
    const maxPages = Number.parseInt(options.maxPages, 10);
    if (!Number.isFinite(maxPages) || maxPages < 1) {
      throw new Error("--max-pages must be a positive integer");
    }

    const crawl = await crawlSite(url, { maxPages, allowPrivateNetwork: options.allowPrivateNetwork });
    const report = await auditCrawl(crawl, {
      projectName: options.projectName,
      mockAi: options.mockAi || !options.openaiApiKey,
      openAiApiKey: options.openaiApiKey,
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

await program.parseAsync(process.argv);
