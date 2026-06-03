import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let baseUrl = "";
const server = createServer((request, response) => {
  if (request.url === "/robots.txt") {
    response.end("User-agent: *\nSitemap: /sitemap.xml\n");
    return;
  }
  if (request.url === "/sitemap.xml") {
    response.end(`<urlset><url><loc>${baseUrl}/</loc></url></urlset>`);
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
  response.end(`<!doctype html><html><head><title>Fixture Publisher Page</title><meta name="description" content="A fixture page with enough descriptive metadata for OpenAEO tests."><link rel="canonical" href="/"></head><body><h1>Fixture Publisher Page</h1><p data-answer>Short answer.</p></body></html>`);
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

describe("openaeo cli", () => {
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
});
