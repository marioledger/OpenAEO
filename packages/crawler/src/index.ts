import * as cheerio from "cheerio";
import type { PageSnapshot, SiteSignals } from "@openaeo/schemas";

export interface CrawlOptions {
  maxPages?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export interface CrawlResult {
  origin: string;
  startUrl: string;
  pages: PageSnapshot[];
  siteSignals: SiteSignals;
  blockedUrls: string[];
  errors: string[];
}

const DEFAULT_USER_AGENT = "OpenAEO/0.1";

export async function crawlSite(startUrl: string, options: CrawlOptions = {}): Promise<CrawlResult> {
  const normalizedStart = normalizeUrl(startUrl);
  const origin = new URL(normalizedStart).origin;
  const maxPages = Math.max(1, options.maxPages ?? 8);
  const timeoutMs = options.timeoutMs ?? 10_000;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const errors: string[] = [];
  const blockedUrls: string[] = [];

  const robotsUrl = new URL("/robots.txt", origin).toString();
  const robotsText = await fetchText(robotsUrl, { timeoutMs, userAgent }).catch(() => undefined);
  const robotsRules = parseRobotsTxt(robotsText ?? "");
  const siteSignals = await discoverSiteSignals(origin, robotsText, { timeoutMs, userAgent });

  const sitemapQueue = siteSignals.sitemap.discoveredUrls.filter((url) => sameOrigin(url, origin));
  const queue = unique([normalizedStart, ...sitemapQueue]).slice(0, Math.max(maxPages * 2, maxPages));
  const visited = new Set<string>();
  const pages: PageSnapshot[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const nextUrl = queue.shift()!;
    if (visited.has(nextUrl)) continue;
    visited.add(nextUrl);

    if (!isAllowedByRobots(nextUrl, robotsRules)) {
      blockedUrls.push(nextUrl);
      continue;
    }

    try {
      const page = await fetchPageSnapshot(nextUrl, { timeoutMs, userAgent });
      pages.push(page);
      for (const link of page.internalLinks) {
        if (!visited.has(link) && queue.length < maxPages * 3) {
          queue.push(link);
        }
      }
    } catch (error) {
      errors.push(`${nextUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    origin,
    startUrl: normalizedStart,
    pages,
    siteSignals,
    blockedUrls,
    errors
  };
}

export function normalizeUrl(rawUrl: string, base?: string): string {
  const url = new URL(rawUrl, base);
  url.hash = "";
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

async function discoverSiteSignals(
  origin: string,
  robotsText: string | undefined,
  options: Required<Pick<CrawlOptions, "timeoutMs" | "userAgent">>
): Promise<SiteSignals> {
  const robotsUrl = new URL("/robots.txt", origin).toString();
  const sitemapFromRobots = robotsText?.match(/^sitemap:\s*(.+)$/im)?.[1]?.trim();
  const sitemapCandidates = unique([
    sitemapFromRobots,
    new URL("/sitemap.xml", origin).toString()
  ].filter(Boolean) as string[]);
  const sitemap = await findFirstText(sitemapCandidates, options);
  const llmsUrl = new URL("/llms.txt", origin).toString();
  const llmsFullUrl = new URL("/llms-full.txt", origin).toString();
  const llmsText = await fetchText(llmsUrl, options).catch(() => undefined);
  const llmsFullText = await fetchText(llmsFullUrl, options).catch(() => undefined);

  return {
    robotsTxt: {
      found: Boolean(robotsText),
      url: robotsUrl
    },
    sitemap: {
      found: Boolean(sitemap.text),
      url: sitemap.url,
      discoveredUrls: sitemap.text ? parseSitemapUrls(sitemap.text) : []
    },
    llmsTxt: {
      found: Boolean(llmsText),
      url: llmsUrl,
      summary: llmsText ? llmsText.slice(0, 500) : undefined
    },
    llmsFullTxt: {
      found: Boolean(llmsFullText),
      url: llmsFullUrl
    }
  };
}

async function fetchPageSnapshot(
  url: string,
  options: Required<Pick<CrawlOptions, "timeoutMs" | "userAgent">>
): Promise<PageSnapshot> {
  const started = Date.now();
  const response = await fetchWithTimeout(url, options);
  const contentType = response.headers.get("content-type") ?? "";
  const html = !contentType || contentType.includes("text/html") ? await response.text() : "";
  const $ = cheerio.load(html);
  const origin = new URL(url).origin;
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const schemaTypes = extractSchemaTypes($);
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
    try {
      const absolute = normalizeUrl(href, url);
      if (sameOrigin(absolute, origin)) {
        internalLinks.push(absolute);
      } else {
        externalLinks.push(absolute);
      }
    } catch {
      // Ignore malformed links; the audit layer reports link quality from valid URLs.
    }
  });

  const openGraph: Record<string, string> = {};
  $("meta[property^='og:']").each((_, element) => {
    const property = $(element).attr("property");
    const content = $(element).attr("content");
    if (property && content) openGraph[property] = content;
  });

  return {
    url,
    status: response.status,
    title: $("title").first().text().trim() || undefined,
    description: $("meta[name='description']").attr("content")?.trim(),
    canonical: $("link[rel='canonical']").attr("href")
      ? normalizeUrl($("link[rel='canonical']").attr("href")!, url)
      : undefined,
    h1: $("h1").map((_, element) => $(element).text().replace(/\s+/g, " ").trim()).get().filter(Boolean),
    headings: $("h1,h2,h3").map((_, element) => $(element).text().replace(/\s+/g, " ").trim()).get().filter(Boolean),
    internalLinks: unique(internalLinks),
    externalLinks: unique(externalLinks),
    schemaTypes,
    openGraph,
    hasAuthor: Boolean($("[rel='author'], meta[name='author'], [itemprop='author']").length),
    hasPublishedDate: Boolean($("time[datetime], meta[property='article:published_time'], [itemprop='datePublished']").length),
    hasModifiedDate: Boolean($("meta[property='article:modified_time'], [itemprop='dateModified']").length),
    citationCount: $("blockquote, cite, a[href^='http']").length,
    answerBlockCount: $("[itemtype*='FAQPage'], [itemtype*='HowTo'], details, .faq, [data-answer]").length,
    wordCount: text ? text.split(/\s+/).length : 0,
    fetchMs: Date.now() - started
  };
}

function extractSchemaTypes($: cheerio.CheerioAPI): string[] {
  const types = new Set<string>();
  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).contents().text();
    try {
      const parsed = JSON.parse(raw);
      for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
        collectJsonLdTypes(item, types);
      }
    } catch {
      // Broken JSON-LD is handled as absence of trusted structured data for v1.
    }
  });
  $("[itemtype]").each((_, element) => {
    const itemType = $(element).attr("itemtype");
    if (itemType) types.add(itemType.split("/").pop() ?? itemType);
  });
  return [...types].sort();
}

function collectJsonLdTypes(value: unknown, types: Set<string>): void {
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (typeof type === "string") types.add(type);
  if (Array.isArray(type)) type.filter((entry): entry is string => typeof entry === "string").forEach((entry) => types.add(entry));
  for (const nested of Object.values(record)) {
    if (Array.isArray(nested)) nested.forEach((entry) => collectJsonLdTypes(entry, types));
    else collectJsonLdTypes(nested, types);
  }
}

async function findFirstText(
  urls: string[],
  options: Required<Pick<CrawlOptions, "timeoutMs" | "userAgent">>
): Promise<{ url?: string; text?: string }> {
  for (const url of urls) {
    try {
      return { url, text: await fetchText(url, options) };
    } catch {
      // Try the next conventional location.
    }
  }
  return {};
}

async function fetchText(
  url: string,
  options: Required<Pick<CrawlOptions, "timeoutMs" | "userAgent">>
): Promise<string> {
  const response = await fetchWithTimeout(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchWithTimeout(
  url: string,
  options: Required<Pick<CrawlOptions, "timeoutMs" | "userAgent">>
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": options.userAgent }
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseRobotsTxt(text: string): string[] {
  const disallow: string[] = [];
  let appliesToAll = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") appliesToAll = value === "*" || value.toLowerCase().includes("openaeo");
    if (key === "disallow" && appliesToAll && value) disallow.push(value);
  }
  return disallow;
}

function isAllowedByRobots(url: string, disallowRules: string[]): boolean {
  const pathname = new URL(url).pathname;
  return !disallowRules.some((rule) => pathname.startsWith(rule));
}

function parseSitemapUrls(xml: string): string[] {
  const urls = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1]!.trim());
  return unique(urls.filter((url) => /^https?:\/\//i.test(url)));
}

function sameOrigin(url: string, origin: string): boolean {
  return new URL(url).origin === origin;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
