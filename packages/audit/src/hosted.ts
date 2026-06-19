export const HOSTED_AUDIT_MAX_REQUEST_BYTES = 16_384;
export const HOSTED_AUDIT_MAX_PAGES = 8;
export const HOSTED_AUDIT_TIMEOUT_MS = 8_000;
export const HOSTED_AUDIT_DEFAULT_MAX_PAGES = 5;
export const HOSTED_AUDIT_MAX_LINK_CHECKS = 120;
export const HOSTED_AUDIT_DEFAULT_MAX_LINK_CHECKS = 50;
export const HOSTED_AUDIT_MAX_PATTERNS = 8;

export interface HostedAuditRequest {
  url: string;
  maxPages: number;
  includePatterns: string[];
  excludePatterns: string[];
  checkExternalLinks: boolean;
  maxLinkChecks: number;
}

export function parseHostedAuditRequest(body: unknown): HostedAuditRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object");
  }

  const record = body as Record<string, unknown>;
  const url = parseHostedAuditUrl(record.url);
  const maxPages = parseHostedAuditMaxPages(record.maxPages);
  const includePatterns = parseHostedPatterns(record.includePatterns);
  const excludePatterns = parseHostedPatterns(record.excludePatterns);
  const checkExternalLinks = parseHostedExternalLinkChecks(record.checkExternalLinks);
  const maxLinkChecks = parseHostedMaxLinkChecks(record.maxLinkChecks);

  return { url, maxPages, includePatterns, excludePatterns, checkExternalLinks, maxLinkChecks };
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

function parseHostedPatterns(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error("includePatterns and excludePatterns must be arrays");
  }

  return value
    .map((pattern) => {
      if (typeof pattern !== "string") {
        throw new Error("crawl patterns must be strings");
      }
      return pattern.trim();
    })
    .filter(Boolean)
    .slice(0, HOSTED_AUDIT_MAX_PATTERNS);
}

function parseHostedExternalLinkChecks(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== "boolean") {
    throw new Error("checkExternalLinks must be a boolean");
  }
  return value;
}

function parseHostedMaxLinkChecks(value: unknown): number {
  if (value === undefined || value === null) {
    return HOSTED_AUDIT_DEFAULT_MAX_LINK_CHECKS;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("maxLinkChecks must be zero or a positive integer");
  }

  return Math.min(value, HOSTED_AUDIT_MAX_LINK_CHECKS);
}
