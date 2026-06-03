import { NextResponse } from "next/server";
import { auditCrawl } from "@openaeo/audit";
import { crawlSite } from "@openaeo/crawler";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; maxPages?: number };
  if (!body.url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const crawl = await crawlSite(body.url, { maxPages: Math.min(Math.max(body.maxPages ?? 5, 1), 20) });
    const openAiApiKey = process.env.OPENAI_API_KEY;
    const report = await auditCrawl(crawl, {
      mockAi: !openAiApiKey,
      openAiApiKey
    });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Audit failed" },
      { status: 500 }
    );
  }
}
