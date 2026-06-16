import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crawlSite, normalizeUrl } from "../src/index.js";

let baseUrl = "";
const server = createServer((request, response) => {
  const path = request.url ?? "/";
  if (path === "/robots.txt") {
    response.end("User-agent: *\nDisallow: /private\nSitemap: /sitemap.xml\n");
    return;
  }
  if (path === "/sitemap.xml") {
    response.end(`<urlset><url><loc>${baseUrl}/</loc></url><url><loc>${baseUrl}/about</loc></url><url><loc>${baseUrl}/draft</loc></url></urlset>`);
    return;
  }
  if (path === "/llms.txt") {
    response.end("# Fixture\n- /\n- /about\n");
    return;
  }
  if (path === "/llms-full.txt") {
    response.end("# Fixture Full Pack\n- /\n- /about\n");
    return;
  }
  if (path === "/redirect") {
    response.statusCode = 302;
    response.setHeader("location", "/about");
    response.end();
    return;
  }
  if (path === "/about") {
    response.end("<html><head><title>About</title></head><body><h1>About</h1></body></html>");
    return;
  }
  if (path === "/draft") {
    response.end("<html><head><title>Draft</title></head><body><h1>Draft</h1></body></html>");
    return;
  }
  response.end(`<!doctype html>
    <html>
      <head>
        <title>Fixture Site</title>
        <meta name="description" content="Fixture description">
        <link rel="canonical" href="/">
        <meta property="og:title" content="Fixture Site">
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","author":{"@type":"Person","name":"Ada"}}</script>
      </head>
      <body>
        <h1>Fixture Site</h1>
        <a href="/about">About</a>
        <a href="/draft">Draft</a>
        <a href="https://schema.org/Article">Schema</a>
      </body>
    </html>`);
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

describe("crawlSite", () => {
  it("normalizes URLs", () => {
    expect(normalizeUrl("/docs/#intro", "https://example.com")).toBe("https://example.com/docs");
  });

  it("collects page and site signals", async () => {
    const result = await crawlSite(baseUrl, { maxPages: 2, allowPrivateNetwork: true });
    expect(result.pages.length).toBeGreaterThanOrEqual(1);
    expect(result.pages[0]?.title).toBe("Fixture Site");
    expect(result.pages[0]?.schemaTypes).toContain("Article");
    expect(result.siteSignals.llmsTxt.found).toBe(true);
    expect(result.siteSignals.llmsFullTxt.found).toBe(true);
    expect(result.siteSignals.sitemap.discoveredUrls).toContain(`${baseUrl}/`);
  });

  it("applies include and exclude patterns to discovered URLs", async () => {
    const result = await crawlSite(baseUrl, {
      maxPages: 3,
      allowPrivateNetwork: true,
      includePatterns: ["/ab*", "/dra*"],
      excludePatterns: ["/dra*"]
    });
    const crawledPaths = result.pages.map((page) => new URL(page.url).pathname);
    expect(crawledPaths).toEqual(["/", "/about"]);
  });

  it("tracks redirect chains", async () => {
    const result = await crawlSite(`${baseUrl}/redirect`, { maxPages: 1, allowPrivateNetwork: true });
    expect(result.pages[0]?.redirectChain).toEqual([`${baseUrl}/redirect`, `${baseUrl}/about`]);
  });

  it("blocks private-network crawls unless explicitly allowed", async () => {
    await expect(crawlSite(baseUrl, { maxPages: 1 })).rejects.toThrow("private or local network");
  });
});
