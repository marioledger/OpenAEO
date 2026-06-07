import { NextResponse } from "next/server";
import {
  auditCrawl,
  HOSTED_AUDIT_MAX_REQUEST_BYTES,
  HOSTED_AUDIT_TIMEOUT_MS,
  parseHostedAuditRequest
} from "@openaeo/audit";
import { crawlSite } from "@openaeo/crawler";

export async function POST(request: Request) {
  const requestBody = await readHostedRequestBody(request);
  if ("error" in requestBody) {
    return NextResponse.json({ error: requestBody.error }, { status: requestBody.status });
  }

  try {
    const crawl = await crawlSite(requestBody.url, {
      maxPages: requestBody.maxPages,
      timeoutMs: HOSTED_AUDIT_TIMEOUT_MS
    });
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

async function readHostedRequestBody(
  request: Request
): Promise<{ url: string; maxPages: number } | { error: string; status: number }> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > HOSTED_AUDIT_MAX_REQUEST_BYTES) {
    return { error: "Request body is too large", status: 413 };
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > HOSTED_AUDIT_MAX_REQUEST_BYTES) {
    return { error: "Request body is too large", status: 413 };
  }

  try {
    return parseHostedAuditRequest(JSON.parse(rawBody));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid audit request",
      status: 400
    };
  }
}
