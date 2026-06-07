import { readFile } from "node:fs/promises";
import { auditReportSchema, type AuditIssue, type AuditReport, type SiteSignals } from "@openaeo/schemas";

export interface ReportComparison {
  baseline: ReportSnapshot;
  current: ReportSnapshot;
  scoreDelta: number;
  categoryDeltas: Record<keyof AuditReport["categoryScores"], number>;
  issueComparison: IssueComparison;
  signalChanges: SignalChange[];
}

export interface ReportSnapshot {
  id: string;
  projectName: string;
  auditedUrl: string;
  generatedAt: string;
  score: number;
}

export interface IssueComparison {
  newIssues: AuditIssue[];
  resolvedIssues: AuditIssue[];
  unchangedIssues: AuditIssue[];
}

export interface SignalChange {
  signal: keyof SiteSignals;
  field: string;
  baseline: string;
  current: string;
}

export async function loadAuditReport(filePath: string): Promise<AuditReport> {
  const contents = await readFile(filePath, "utf8");
  return auditReportSchema.parse(JSON.parse(contents));
}

export function compareAuditReports(baseline: AuditReport, current: AuditReport): ReportComparison {
  const baselineIssues = new Map(baseline.issues.map((issue) => [issue.id, issue]));
  const currentIssues = new Map(current.issues.map((issue) => [issue.id, issue]));

  const newIssues = current.issues.filter((issue) => !baselineIssues.has(issue.id));
  const resolvedIssues = baseline.issues.filter((issue) => !currentIssues.has(issue.id));
  const unchangedIssues = current.issues.filter((issue) => baselineIssues.has(issue.id));

  return {
    baseline: snapshotReport(baseline),
    current: snapshotReport(current),
    scoreDelta: current.score - baseline.score,
    categoryDeltas: {
      seo: current.categoryScores.seo - baseline.categoryScores.seo,
      aeo: current.categoryScores.aeo - baseline.categoryScores.aeo,
      geo: current.categoryScores.geo - baseline.categoryScores.geo,
      trust: current.categoryScores.trust - baseline.categoryScores.trust
    },
    issueComparison: {
      newIssues,
      resolvedIssues,
      unchangedIssues
    },
    signalChanges: compareSiteSignals(baseline.siteSignals, current.siteSignals)
  };
}

export function generateComparisonMarkdown(comparison: ReportComparison): string {
  const categoryRows = (Object.entries(comparison.categoryDeltas) as Array<[keyof AuditReport["categoryScores"], number]>)
    .map(([category, delta]) => `| ${category.toUpperCase()} | ${formatDelta(delta)} |`)
    .join("\n");
  const issueRows = [
    `| New | ${comparison.issueComparison.newIssues.length} |`,
    `| Resolved | ${comparison.issueComparison.resolvedIssues.length} |`,
    `| Unchanged | ${comparison.issueComparison.unchangedIssues.length} |`
  ].join("\n");
  const signalRows = comparison.signalChanges.length
    ? comparison.signalChanges
        .map((change) => `| ${change.signal}.${change.field} | ${change.baseline} | ${change.current} |`)
        .join("\n")
    : "| None | - | - |";

  const issueSection = renderIssueList("New issues", comparison.issueComparison.newIssues) +
    renderIssueList("Resolved issues", comparison.issueComparison.resolvedIssues) +
    renderIssueList("Unchanged issues", comparison.issueComparison.unchangedIssues);

  return `# OpenAEO Report Comparison

Baseline: ${comparison.baseline.projectName} (${comparison.baseline.generatedAt})
Current: ${comparison.current.projectName} (${comparison.current.generatedAt})

## Score Movement

| Metric | Delta |
| --- | ---: |
| Overall score | ${formatDelta(comparison.scoreDelta)} |

### Category Deltas

| Category | Delta |
| --- | ---: |
${categoryRows}

## Issue Movement

| Bucket | Count |
| --- | ---: |
${issueRows}

${issueSection}## Site Signal Changes

| Signal | Baseline | Current |
| --- | --- | --- |
${signalRows}
`;
}

function snapshotReport(report: AuditReport): ReportSnapshot {
  return {
    id: report.id,
    projectName: report.projectName,
    auditedUrl: report.auditedUrl,
    generatedAt: report.generatedAt,
    score: report.score
  };
}

function compareSiteSignals(baseline: SiteSignals, current: SiteSignals): SignalChange[] {
  const changes: SignalChange[] = [];

  for (const signal of Object.keys(baseline) as Array<keyof SiteSignals>) {
    const baselineValue = baseline[signal];
    const currentValue = current[signal];
    const fields = new Set([...Object.keys(baselineValue), ...Object.keys(currentValue)]);
    for (const field of fields) {
      const before = formatValue((baselineValue as Record<string, unknown>)[field]);
      const after = formatValue((currentValue as Record<string, unknown>)[field]);
      if (before !== after) {
        changes.push({
          signal,
          field,
          baseline: before,
          current: after
        });
      }
    }
  }

  return changes;
}

function renderIssueList(title: string, issues: AuditIssue[]): string {
  if (issues.length === 0) {
    return `## ${title}\n\n- None\n\n`;
  }

  return `## ${title}\n\n${issues.map((issue) => `- **${issue.severity.toUpperCase()} / ${issue.category}** ${issue.title}${issue.url ? ` (${issue.url})` : ""}`).join("\n")}\n\n`;
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "(empty)";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "(unset)";
  }
  return JSON.stringify(value);
}
