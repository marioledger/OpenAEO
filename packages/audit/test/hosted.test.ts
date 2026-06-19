import { describe, expect, it } from "vitest";
import {
  HOSTED_AUDIT_DEFAULT_MAX_LINK_CHECKS,
  HOSTED_AUDIT_DEFAULT_MAX_PAGES,
  HOSTED_AUDIT_MAX_LINK_CHECKS,
  HOSTED_AUDIT_MAX_PAGES,
  parseHostedAuditRequest
} from "../src/hosted.js";

describe("parseHostedAuditRequest", () => {
  it("normalizes hosted audit requests", () => {
    expect(parseHostedAuditRequest({
      url: "https://example.com",
      maxPages: 99,
      maxLinkChecks: 999,
      includePatterns: ["/docs/*", " "],
      excludePatterns: ["/tag/*"],
      checkExternalLinks: false
    })).toEqual({
      url: "https://example.com/",
      maxPages: HOSTED_AUDIT_MAX_PAGES,
      includePatterns: ["/docs/*"],
      excludePatterns: ["/tag/*"],
      checkExternalLinks: false,
      maxLinkChecks: HOSTED_AUDIT_MAX_LINK_CHECKS
    });
  });

  it("uses the default crawl budget when maxPages is omitted", () => {
    expect(parseHostedAuditRequest({ url: "https://example.com" })).toEqual({
      url: "https://example.com/",
      maxPages: HOSTED_AUDIT_DEFAULT_MAX_PAGES,
      includePatterns: [],
      excludePatterns: [],
      checkExternalLinks: true,
      maxLinkChecks: HOSTED_AUDIT_DEFAULT_MAX_LINK_CHECKS
    });
  });

  it("rejects invalid hosted audit requests", () => {
    expect(() => parseHostedAuditRequest({ url: "ftp://example.com" })).toThrow("http or https");
    expect(() => parseHostedAuditRequest({ url: "https://example.com", maxPages: 0 })).toThrow("positive integer");
    expect(() => parseHostedAuditRequest({ url: "https://example.com", maxLinkChecks: -1 })).toThrow("zero or a positive integer");
    expect(() => parseHostedAuditRequest({ url: "https://example.com", includePatterns: "/docs" })).toThrow("arrays");
    expect(() => parseHostedAuditRequest({ url: "https://example.com", checkExternalLinks: "yes" })).toThrow("boolean");
    expect(() => parseHostedAuditRequest(null)).toThrow("JSON object");
  });
});
