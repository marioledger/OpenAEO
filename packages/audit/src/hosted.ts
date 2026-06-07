export const HOSTED_AUDIT_MAX_REQUEST_BYTES = 16_384;
export const HOSTED_AUDIT_MAX_PAGES = 8;
export const HOSTED_AUDIT_TIMEOUT_MS = 8_000;
export const HOSTED_AUDIT_DEFAULT_MAX_PAGES = 5;

export interface HostedAuditRequest {
  url: string;
  maxPages: number;
}

export function parseHostedAuditRequest(body: unknown): HostedAuditRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object");
  }

  const record = body as Record<string, unknown>;
  const url = parseHostedAuditUrl(record.url);
  const maxPages = parseHostedAuditMaxPages(record.maxPages);

  return { url, maxPages };
}

function parseHostedAuditUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("URL is required");
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }
  if (trimmed.length > 2048) {
    throw new Error("URL is too long");
  }

  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("URL must use http or https");
  }

  return parsed.toString();
}

function parseHostedAuditMaxPages(value: unknown): number {
  if (value === undefined || value === null) {
    return HOSTED_AUDIT_DEFAULT_MAX_PAGES;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error("maxPages must be a positive integer");
  }

  return Math.min(value, HOSTED_AUDIT_MAX_PAGES);
}
