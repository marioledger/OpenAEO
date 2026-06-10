import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StrategyItem } from "@openaeo/schemas";
import { createStrategyBrief, detectStrategySignals, generateStrategyMarkdown, runStrategyMonitor } from "../src/index.js";

const items: StrategyItem[] = [
  {
    id: "item-1",
    title: "AI search engines improve source citation for publishers",
    url: "https://example.com/news/citations",
    source: "https://example.com/feed.xml",
    publishedAt: "2026-06-04T00:00:00.000Z",
    summary: "The update changes citation, attribution, and crawler guidance for source pages.",
    matchedTerms: ["citation", "attribution", "crawler"]
  },
  {
    id: "item-2",
    title: "Structured data quality matters for answer visibility",
    url: "https://example.com/news/schema",
    source: "https://example.com/feed.xml",
    summary: "Publishers should refresh schema and metadata.",
    matchedTerms: ["schema", "metadata"]
  }
];

let baseUrl = "";
const server = createServer((request, response) => {
  if (request.url === "/feed.xml") {
    response.setHeader("content-type", "application/rss+xml");
    response.end(`<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Publisher AI updates</title>
          <item>
            <title>Citation update</title>
            <link>https://example.com/citations</link>
            <pubDate>not-a-real-date</pubDate>
            <description>Publisher citation guidance changed.</description>
          </item>
        </channel>
      </rss>`);
    return;
  }

  if (request.url === "/feed-content.xml") {
    response.setHeader("content-type", "application/rss+xml");
    response.end(`<?xml version="1.0"?>
      <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
        <channel>
          <title>Publisher AI updates</title>
          <item>
            <title>Schema update</title>
            <link>https://example.com/schema</link>
            <content:encoded><![CDATA[Publisher schema guidance changed for citation and metadata quality.]]></content:encoded>
          </item>
        </channel>
      </rss>`);
    return;
  }

  response.statusCode = 404;
  response.end("not found");
});

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

describe("strategy monitor", () => {
  it("detects immediate strategy signals from monitored items", () => {
    const signals = detectStrategySignals(items);
    expect(signals.map((signal) => signal.id)).toContain("citation-attribution");
    expect(signals.map((signal) => signal.id)).toContain("ai-crawler-access");
  });

  it("creates deterministic strategy briefs and markdown", async () => {
    const brief = await createStrategyBrief({
      siteUrl: "https://publisher.example",
      feedUrls: ["https://example.com/feed.xml"],
      items,
      mockAi: true
    });
    const markdown = generateStrategyMarkdown(brief);
    expect(brief.mode).toBe("mock");
    expect(brief.immediateActions.length).toBeGreaterThan(0);
    expect(markdown).toContain("# OpenAEO Strategy Brief");
    expect(markdown).toContain("Source items:");
    expect(markdown).toContain("[AI search engines improve source citation for publishers](https://example.com/news/citations)");
  });
});

describe("runStrategyMonitor", () => {
  it("ignores malformed feed dates instead of throwing", async () => {
    const brief = await runStrategyMonitor({
      siteUrl: "https://publisher.example",
      feedUrls: [`${baseUrl}/feed.xml`],
      mockAi: true,
      allowPrivateNetwork: true
    });

    expect(brief.items).toHaveLength(1);
    expect(brief.items[0]?.publishedAt).toBeUndefined();
    expect(brief.signals.map((signal) => signal.id)).toContain("citation-attribution");
  });

  it("reads RSS content:encoded bodies when descriptions are missing", async () => {
    const brief = await runStrategyMonitor({
      siteUrl: "https://publisher.example",
      feedUrls: [`${baseUrl}/feed-content.xml`],
      mockAi: true,
      allowPrivateNetwork: true
    });

    expect(brief.items).toHaveLength(1);
    expect(brief.items[0]?.summary).toContain("citation and metadata quality");
    expect(brief.items[0]?.matchedTerms).toEqual(expect.arrayContaining(["citation", "metadata"]));
  });
});
