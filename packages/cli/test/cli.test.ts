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
      const result = await execa("tsx", ["packages/cli/src/index.ts", "audit", baseUrl, "--out", outDir, "--max-pages", "2", "--mock-ai"], {
        cwd: process.cwd()
      });
      expect(result.stdout).toContain("OpenAEO score:");
      expect(await readFile(join(outDir, "openaeo-report.json"), "utf8")).toContain("\"score\"");
      expect(await readFile(join(outDir, "openaeo-report.md"), "utf8")).toContain("# OpenAEO Audit Report");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
