import { describe, expect, it } from "vitest";
import {
  HOSTED_AUDIT_DEFAULT_MAX_PAGES,
  HOSTED_AUDIT_MAX_PAGES,
  parseHostedAuditRequest
} from "../src/hosted.js";

describe("parseHostedAuditRequest", () => {
  it("normalizes hosted audit requests", () => {
    expect(parseHostedAuditRequest({ url: "https://example.com", maxPages: 99 })).toEqual({
      url: "https://example.com/",
      maxPages: HOSTED_AUDIT_MAX_PAGES
    });
  });

  it("uses the default crawl budget when maxPages is omitted", () => {
    expect(parseHostedAuditRequest({ url: "https://example.com" })).toEqual({
      url: "https://example.com/",
      maxPages: HOSTED_AUDIT_DEFAULT_MAX_PAGES
    });
  });

  it("rejects invalid hosted audit requests", () => {
    expect(() => parseHostedAuditRequest({ url: "ftp://example.com" })).toThrow("http or https");
    expect(() => parseHostedAuditRequest({ url: "https://example.com", maxPages: 0 })).toThrow("positive integer");
    expect(() => parseHostedAuditRequest(null)).toThrow("JSON object");
  });
});
