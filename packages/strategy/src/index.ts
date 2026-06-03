import { lookup } from "node:dns/promises";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import OpenAI from "openai";
import {
  strategyBriefSchema,
  type StrategyBrief,
  type StrategyItem,
  type StrategySignal
} from "@openaeo/schemas";

export interface StrategyMonitorOptions {
  siteUrl: string;
  feedUrls: string[];
  maxItems?: number;
  timeoutMs?: number;
  mockAi?: boolean;
  openAiApiKey?: string;
  model?: string;
  allowPrivateNetwork?: boolean;
}

interface TopicRule {
  id: string;
  topic: string;
  terms: string[];
  urgency: StrategySignal["urgency"];
  action: string;
}

const TOPIC_RULES: TopicRule[] = [
  {
    id: "citation-attribution",
    topic: "Citation and attribution changes",
    terms: ["citation", "cite", "source", "attribution", "publisher", "credit"],
    urgency: "now",
    action: "Review priority pages for visible citations, canonical URLs, and publisher metadata."
  },
  {
    id: "ai-crawler-access",
    topic: "AI crawler access and source maps",
    terms: ["crawler", "robots.txt", "llms.txt", "indexing", "retrieval", "crawl"],
    urgency: "now",
    action: "Confirm robots.txt, sitemap.xml, llms.txt, and high-value source pages are consistent."
  },
  {
    id: "structured-data",
    topic: "Structured data and entity clarity",
    terms: ["schema", "structured data", "json-ld", "entity", "knowledge graph", "metadata"],
    urgency: "soon",
    action: "Add or refresh schema.org markup for author, organization, article, FAQ, product, or dataset pages."
  },
  {
    id: "answer-format",
    topic: "Answer-ready content patterns",
    terms: ["answer", "overview", "summary", "faq", "howto", "snippet", "generated answer"],
    urgency: "soon",
    action: "Add concise answer blocks near evidence-heavy sections without replacing the full source context."
  },
  {
    id: "freshness-trust",
    topic: "Freshness and trust signals",
    terms: ["freshness", "updated", "date", "trust", "quality", "reviewed", "verification"],
    urgency: "watch",
    action: "Check last-reviewed dates and update stale pages that are likely to be cited by AI search."
  }
];

export async function runStrategyMonitor(options: StrategyMonitorOptions): Promise<StrategyBrief> {
  const maxItems = Math.max(1, options.maxItems ?? 20);
  const feedResults = await Promise.all(
    options.feedUrls.map((feedUrl) =>
      fetchFeedItems(feedUrl, {
        timeoutMs: options.timeoutMs ?? 10_000,
        allowPrivateNetwork: options.allowPrivateNetwork ?? false
      })
    )
  );
  const items = uniqueItems(feedResults.flat()).slice(0, maxItems);
  return createStrategyBrief({ ...options, items });
}

export async function createStrategyBrief(
  options: Omit<StrategyMonitorOptions, "feedUrls"> & { feedUrls?: string[]; items: StrategyItem[] }
): Promise<StrategyBrief> {
  const siteUrl = normalizeHttpUrl(options.siteUrl);
  const signals = detectStrategySignals(options.items);
  const baseBrief = {
    id: `openaeo-strategy-${new URL(siteUrl).hostname}-${Date.now()}`,
    siteUrl,
    generatedAt: new Date().toISOString(),
    mode: "mock" as const,
    scannedFeeds: options.feedUrls ?? [],
    items: options.items,
    signals,
    ...createDeterministicStrategy(signals, options.items)
  } satisfies StrategyBrief;

  if (options.mockAi !== false || !options.openAiApiKey) {
    return strategyBriefSchema.parse(baseBrief);
  }

  const aiFields = await analyzeStrategyWithOpenAi(baseBrief, options.openAiApiKey, options.model);
  return strategyBriefSchema.parse({ ...baseBrief, mode: "openai", ...aiFields });
}

export function detectStrategySignals(items: StrategyItem[]): StrategySignal[] {
  const lowerItems = items.map((item) => ({
    item,
    haystack: `${item.title} ${item.summary}`.toLowerCase()
  }));

  return TOPIC_RULES.map((rule) => {
    const matchingItems = lowerItems.filter(({ haystack }) => rule.terms.some((term) => haystack.includes(term)));
    if (matchingItems.length === 0) return undefined;
    const matchedTerms = unique(
      matchingItems.flatMap(({ haystack }) => rule.terms.filter((term) => haystack.includes(term)))
    );
    return {
      id: rule.id,
      topic: rule.topic,
      urgency: rule.urgency,
      evidence: matchedTerms.map((term) => `Matched "${term}" in monitored news or changelog items.`),
      action: rule.action,
      sourceItemIds: matchingItems.map(({ item }) => item.id)
    } satisfies StrategySignal;
  }).filter((signal): signal is StrategySignal => Boolean(signal));
}

export function generateStrategyMarkdown(brief: StrategyBrief): string {
  const signalLines = brief.signals.length
    ? brief.signals.map((signal) => `- **${signal.urgency.toUpperCase()} / ${signal.topic}**: ${signal.action}`).join("\n")
    : "- No urgent AI-search strategy shifts detected.";
  const actionLines = brief.immediateActions.map((action) => `- ${action}`).join("\n");
  const experimentLines = brief.experiments.map((experiment) => `- ${experiment}`).join("\n");
  const updateLines = brief.contentUpdates.map((update) => `- ${update}`).join("\n");
  const sourceLines = brief.items.length
    ? brief.items.map((item) => `- [${item.title}](${item.url})${item.publishedAt ? ` - ${item.publishedAt}` : ""}`).join("\n")
    : "- No feed items collected.";

  return `# OpenAEO Strategy Brief

Site: ${brief.siteUrl}
Generated: ${brief.generatedAt}
Mode: ${brief.mode}

## Summary

${brief.summary}

## Signals

${signalLines}

## Immediate Actions

${actionLines || "- No immediate actions."}

## Experiments

${experimentLines || "- No experiments recommended."}

## Content Updates

${updateLines || "- No content updates recommended."}

## Sources

${sourceLines}
`;
}

async function fetchFeedItems(
  feedUrl: string,
  options: { timeoutMs: number; allowPrivateNetwork: boolean }
): Promise<StrategyItem[]> {
  const normalized = normalizeHttpUrl(feedUrl);
  await assertSafeFetchUrl(normalized, options.allowPrivateNetwork);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(normalized, {
      signal: controller.signal,
      headers: { "user-agent": "OpenAEO/0.1 strategy-monitor" }
    });
    if (!response.ok) throw new Error(`Feed ${normalized} returned HTTP ${response.status}`);
    return parseFeed(await response.text(), normalized);
  } finally {
    clearTimeout(timeout);
  }
}

function parseFeed(xml: string, sourceUrl: string): StrategyItem[] {
  const itemBlocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((match) => match[0]);
  return itemBlocks.map((block) => {
    const title = decodeEntities(stripTags(readFirstTag(block, ["title"]) || "Untitled feed item"));
    const url = normalizeHttpUrl(
      readFirstTag(block, ["link"]) ||
        readLinkHref(block) ||
        readFirstTag(block, ["guid", "id"]) ||
        sourceUrl
    );
    const summary = decodeEntities(stripTags(readFirstTag(block, ["description", "summary", "content"]) || ""));
    const publishedAt = readFirstTag(block, ["pubDate", "published", "updated"]);
    const matchedTerms = matchTerms(`${title} ${summary}`);
    return {
      id: createStableId(`${sourceUrl}:${url}:${title}`),
      title,
      url,
      source: sourceUrl,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      summary,
      matchedTerms
    };
  });
}

function readFirstTag(block: string, tags: string[]): string | undefined {
  for (const tag of tags) {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function readLinkHref(block: string): string | undefined {
  return block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
}

function stripTags(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function matchTerms(value: string): string[] {
  const haystack = value.toLowerCase();
  return unique(TOPIC_RULES.flatMap((rule) => rule.terms).filter((term) => haystack.includes(term)));
}

function createDeterministicStrategy(signals: StrategySignal[], items: StrategyItem[]) {
  const urgentSignals = signals.filter((signal) => signal.urgency === "now");
  return {
    summary: signals.length
      ? `OpenAEO found ${signals.length} strategy signal${signals.length === 1 ? "" : "s"} across ${items.length} monitored item${items.length === 1 ? "" : "s"}.`
      : `OpenAEO scanned ${items.length} monitored item${items.length === 1 ? "" : "s"} and found no urgent AI-search strategy shifts.`,
    immediateActions: urgentSignals.length
      ? urgentSignals.map((signal) => signal.action)
      : ["Keep llms.txt, sitemap.xml, canonical URLs, and schema.org metadata current this week."],
    experiments: signals.slice(0, 3).map((signal) => `Run an audit before and after changing pages related to: ${signal.topic}.`),
    contentUpdates: signals.slice(0, 3).map((signal) => `Refresh one priority page for ${signal.topic.toLowerCase()} and add source evidence near claims.`)
  };
}

async function analyzeStrategyWithOpenAi(
  brief: StrategyBrief,
  openAiApiKey: string,
  model = "gpt-5-mini"
): Promise<Pick<StrategyBrief, "summary" | "immediateActions" | "experiments" | "contentUpdates">> {
  const client = new OpenAI({ apiKey: openAiApiKey });
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: "You create ethical AI-search strategy briefs for publishers. Return compact JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          siteUrl: brief.siteUrl,
          signals: brief.signals,
          items: brief.items.slice(0, 20).map((item) => ({
            title: item.title,
            url: item.url,
            summary: item.summary,
            matchedTerms: item.matchedTerms
          }))
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "openaeo_strategy_brief",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            immediateActions: { type: "array", items: { type: "string" } },
            experiments: { type: "array", items: { type: "string" } },
            contentUpdates: { type: "array", items: { type: "string" } }
          },
          required: ["summary", "immediateActions", "experiments", "contentUpdates"]
        }
      }
    }
  });
  return JSON.parse(response.output_text) as Pick<StrategyBrief, "summary" | "immediateActions" | "experiments" | "contentUpdates">;
}

async function assertSafeFetchUrl(rawUrl: string, allowPrivateNetwork: boolean): Promise<void> {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }
  if (allowPrivateNetwork) return;
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });
  const blocked = addresses.find(({ address }) => isPrivateAddress(address));
  if (blocked) {
    throw new Error(`Refusing to monitor private or local network address: ${hostname}`);
  }
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized !== address) return isPrivateAddress(normalized);
  if (address === "::1" || address === "0:0:0:0:0:0:0:1") return true;
  if (address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true;
  if (address.startsWith("::ffff:")) return isPrivateAddress(address.slice(7));
  if (!address.includes(".")) return false;

  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function normalizeHttpUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  url.hash = "";
  return url.toString();
}

function uniqueItems(items: StrategyItem[]): StrategyItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function createStableId(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}
