import { createServer } from "node:http";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createSampleReport } from "@openaeo/schemas";

let baseUrl = "";
const server = createServer((request, response) => {
  if (request.url === "/robots.txt") {
    response.end("User-agent: *\nSitemap: /sitemap.xml\n");
    return;
  }
  if (request.url === "/sitemap.xml") {
    response.end(`<urlset><url><loc>${baseUrl}/</loc></url><url><loc>${baseUrl}/about</loc></url><url><loc>${baseUrl}/draft</loc></url></urlset>`);
    return;
  }
  if (request.url === "/feed.xml") {
    response.setHeader("content-type", "application/rss+xml");
    response.end(`<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>AI Search Updates</title>
          <item>
            <title>AI search citation update for publishers</title>
            <link>${baseUrl}/news/citations</link>
            <pubDate>Thu, 04 Jun 2026 00:00:00 GMT</pubDate>
            <description>Crawler, attribution, and source citation guidance changed for publisher pages.</description>
          </item>
        </channel>
      </rss>`);
    return;
  }
  if (request.url === "/about") {
    response.end(`<!doctype html><html><head><title>About Fixture Publisher</title><meta name="description" content="An about page with enough descriptive metadata for OpenAEO tests."><link rel="canonical" href="/about"></head><body><h1>About Fixture Publisher</h1><p data-answer>Short answer.</p></body></html>`);
    return;
  }
  if (request.url === "/draft") {
    response.end(`<!doctype html><html><head><title>Draft Fixture Publisher</title><meta name="description" content="A draft page with enough descriptive metadata for OpenAEO tests."><link rel="canonical" href="/draft"></head><body><h1>Draft Fixture Publisher</h1><p data-answer>Short answer.</p></body></html>`);
    return;
  }
  response.end(`<!doctype html><html><head><title>Fixture Publisher Page</title><meta name="description" content="A fixture page with enough descriptive metadata for OpenAEO tests."><link rel="canonical" href="/"></head><body><h1>Fixture Publisher Page</h1><p data-answer>Short answer.</p><a href="/about">About</a><a href="/draft">Draft</a></body></html>`);
});

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

const cliPackageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
};

describe("openaeo cli", () => {
  it("prints the package version", async () => {
    const cliEntry = new URL("../src/index.ts", import.meta.url).href;
    const result = await execa(
      "node",
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        `process.argv = ["node", "openaeo", "--version"]; await import(${JSON.stringify(cliEntry)});`
      ],
      {
        cwd: process.cwd()
      }
    );
    expect(result.stdout).toBe(cliPackageJson.version);
  });

  it("writes JSON and Markdown reports", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "openaeo-"));
    try {
      const result = await execa("tsx", ["packages/cli/src/index.ts", "audit", baseUrl, "--out", outDir, "--max-pages", "2", "--mock-ai", "--allow-private-network"], {
        cwd: process.cwd()
      });
      expect(result.stdout).toContain("OpenAEO score:");
      expect(await readFile(join(outDir, "openaeo-report.json"), "utf8")).toContain("\"score\"");
      expect(await readFile(join(outDir, "openaeo-report.md"), "utf8")).toContain("# OpenAEO Audit Report");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("supports disabling Markdown audit output", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "openaeo-audit-json-"));
    try {
      const result = await execa(
        "tsx",
        [
          "packages/cli/src/index.ts",
          "audit",
          baseUrl,
          "--out",
          outDir,
          "--max-pages",
          "2",
          "--mock-ai",
          "--allow-private-network",
          "--generated-at",
          "2026-06-07T14:06:22.231Z",
          "--no-markdown"
        ],
        {
          cwd: process.cwd()
        }
      );
      expect(result.stdout).toContain("Reports:");
      const report = JSON.parse(await readFile(join(outDir, "openaeo-report.json"), "utf8")) as {
        generatedAt: string;
      };
      expect(report.generatedAt).toBe("2026-06-07T14:06:22.231Z");
      await expect(access(join(outDir, "openaeo-report.md"))).rejects.toThrow();
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("passes include and exclude crawl filters to audit reports", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "openaeo-filtered-"));
    try {
      await execa("tsx", [
        "packages/cli/src/index.ts",
        "audit",
        baseUrl,
        "--out",
        outDir,
        "--max-pages",
        "3",
        "--mock-ai",
        "--allow-private-network",
        "--include",
        "/ab*",
        "--include",
        "/dra*",
        "--exclude",
        "/dra*"
      ], {
        cwd: process.cwd()
      });
      const report = JSON.parse(await readFile(join(outDir, "openaeo-report.json"), "utf8")) as {
        pages: { url: string }[];
      };
      expect(report.pages.map((page) => new URL(page.url).pathname)).toEqual(["/", "/about"]);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("writes JSON and Markdown strategy briefs", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "openaeo-strategy-"));
    try {
      const result = await execa("tsx", [
        "packages/cli/src/index.ts",
        "monitor",
        "--site",
        "https://publisher.example",
        "--feed",
        `${baseUrl}/feed.xml`,
        "--out",
        outDir,
        "--mock-ai",
        "--allow-private-network"
      ], {
        cwd: process.cwd()
      });
      expect(result.stdout).toContain("Strategy signals:");
      expect(await readFile(join(outDir, "openaeo-strategy.json"), "utf8")).toContain("\"signals\"");
      expect(await readFile(join(outDir, "openaeo-strategy.md"), "utf8")).toContain("# OpenAEO Strategy Brief");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("supports disabling JSON strategy output", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "openaeo-strategy-md-"));
    try {
      const result = await execa(
        "tsx",
        [
          "packages/cli/src/index.ts",
          "monitor",
          "--site",
          "https://publisher.example",
          "--feed",
          `${baseUrl}/feed.xml`,
          "--out",
          outDir,
          "--mock-ai",
          "--allow-private-network",
          "--no-json"
        ],
        {
          cwd: process.cwd()
        }
      );
      expect(result.stdout).toContain("Reports:");
      expect(await readFile(join(outDir, "openaeo-strategy.md"), "utf8")).toContain("# OpenAEO Strategy Brief");
      await expect(access(join(outDir, "openaeo-strategy.json"))).rejects.toThrow();
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("compares two report JSON files and writes a comparison summary", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "openaeo-compare-"));
    const baseline = {
      ...createSampleReport(),
      id: "baseline-report",
      projectName: "Baseline Report",
      score: 68,
      categoryScores: {
        seo: 74,
        aeo: 63,
        geo: 60,
        trust: 71
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
        },
        {
          id: "missing-author",
          title: "Expose author or publisher metadata",
          description: "No author metadata was detected.",
          category: "trust",
          severity: "medium",
          recommendation: "Add author/publisher metadata in visible content and structured data."
        }
      ]
    };
    const current = {
      ...createSampleReport(),
      id: "current-report",
      projectName: "Current Report",
      score: 76,
      categoryScores: {
        seo: 79,
        aeo: 69,
        geo: 66,
        trust: 80
      },
      siteSignals: {
        ...createSampleReport().siteSignals,
        llmsTxt: {
          found: true,
          url: "https://example.com/llms.txt",
          summary: "Source map now published."
        },
        sitemap: {
          found: true,
          url: "https://example.com/sitemap.xml",
          discoveredUrls: ["https://example.com", "https://example.com/about", "https://example.com/contact"]
        }
      },
      issues: [
        {
          id: "missing-author",
          title: "Expose author or publisher metadata",
          description: "No author metadata was detected.",
          category: "trust",
          severity: "medium",
          recommendation: "Add author/publisher metadata in visible content and structured data."
        },
        {
          id: "missing-citations",
          title: "Add outbound citations for factual claims",
          description: "No citation-like links or cite elements were detected.",
          category: "geo",
          severity: "medium",
          recommendation: "Link important claims to primary sources, research, docs, or your own canonical evidence."
        }
      ]
    };

    try {
      await writeFile(join(outDir, "baseline.json"), `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
      await writeFile(join(outDir, "current.json"), `${JSON.stringify(current, null, 2)}\n`, "utf8");

      const result = await execa("tsx", [
        "packages/cli/src/index.ts",
        "compare",
        join(outDir, "baseline.json"),
        join(outDir, "current.json"),
        "--out",
        outDir
      ], {
        cwd: process.cwd()
      });

      expect(result.stdout).toContain("OpenAEO comparison: Baseline Report -> Current Report");
      expect(result.stdout).toContain("Score delta: +8");
      expect(result.stdout).toContain("Issues: 1 new, 1 resolved, 1 unchanged");
      expect(result.stdout).toContain("Signal changes: 3");
      expect(await readFile(join(outDir, "openaeo-report-comparison.json"), "utf8")).toContain("\"scoreDelta\": 8");
      expect(await readFile(join(outDir, "openaeo-report-comparison.md"), "utf8")).toContain("# OpenAEO Report Comparison");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
