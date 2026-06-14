import { describe, expect, it } from "vitest";
import { auditReportSchema, createSampleReport } from "../src/index.js";

describe("sample report factory", () => {
  it("returns a report that matches the audit schema", () => {
    const report = createSampleReport();

    expect(auditReportSchema.parse(report)).toEqual(report);
  });
});
