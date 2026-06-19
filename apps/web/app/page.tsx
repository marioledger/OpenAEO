"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  CircleGauge,
  Clipboard,
  ExternalLink,
  FileCode2,
  FileJson,
  FileText,
  Filter,
  Gauge,
  GitCompareArrows,
  Globe2,
  Code2,
  Layers3,
  Link2Off,
  Search,
  ShieldCheck,
  Sparkles,
  TableProperties,
  Workflow,
  XCircle
} from "lucide-react";
import { auditReportSchema, createSampleReport, type AuditReport } from "@openaeo/schemas";

type Issue = AuditReport["issues"][number];
type SeverityFilter = "all" | Issue["severity"];
type CategoryFilter = "all" | Issue["category"];

const categoryCopy: Record<keyof AuditReport["categoryScores"], string> = {
  seo: "Indexing basics",
  aeo: "Answer readiness",
  geo: "Citation pull",
  trust: "Source quality"
};

const severityOptions = ["all", "high", "medium", "low", "info"] as const;
const categoryOptions = ["all", "crawler", "seo", "aeo", "geo", "trust"] as const;
const categoryOrder: Issue["category"][] = ["crawler", "seo", "aeo", "geo", "trust"];

export default function Dashboard() {
  const [report, setReport] = useState<AuditReport>(() => createSampleReport());
  const [previousReport, setPreviousReport] = useState<AuditReport | null>(null);
  const [url, setUrl] = useState("https://example.com");
  const [maxPages, setMaxPages] = useState(5);
  const [maxLinkChecks, setMaxLinkChecks] = useState(50);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [checkExternalLinks, setCheckExternalLinks] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [copiedFix, setCopiedFix] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredIssues = useMemo(
    () =>
      report.issues
        .filter((issue) => severityFilter === "all" || issue.severity === severityFilter)
        .filter((issue) => categoryFilter === "all" || issue.category === categoryFilter)
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
    [categoryFilter, report.issues, severityFilter]
  );
  const groupedIssues = useMemo(() => groupByCategory(filteredIssues), [filteredIssues]);
  const priorityIssues = useMemo(
    () => [...report.issues].sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).slice(0, 5),
    [report.issues]
  );
  const linkSummary = useMemo(() => summarizeLinkChecks(report.linkChecks), [report.linkChecks]);
  const brokenLinks = useMemo(() => report.linkChecks.filter((link) => !link.ok), [report.linkChecks]);
  const redirectedLinks = useMemo(() => report.linkChecks.filter((link) => link.redirectChain.length > 0), [report.linkChecks]);
  const pageRows = useMemo(
    () =>
      report.pages.map((page) => ({
        page,
        score: pageReadinessScore(page),
        issueCount: report.issues.filter((issue) => issue.url === page.url).length
      })),
    [report.issues, report.pages]
  );
  const comparison = useMemo(() => compareReports(report, previousReport), [previousReport, report]);
  const healthySignals = [
    report.siteSignals.robotsTxt.found,
    report.siteSignals.sitemap.found,
    report.siteSignals.llmsTxt.found,
    report.siteSignals.llmsFullTxt.found
  ].filter(Boolean).length;

  async function runAudit() {
    const baseline = report;
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          maxPages,
          maxLinkChecks,
          checkExternalLinks,
          includePatterns: parsePatterns(includeInput),
          excludePatterns: parsePatterns(excludeInput)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Audit failed");
      setPreviousReport(baseline);
      setReport(auditReportSchema.parse(data));
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "Audit failed");
    } finally {
      setIsRunning(false);
    }
  }

  function loadSample() {
    setPreviousReport(report);
    setReport(createSampleReport());
    setError(null);
  }

  function downloadJson() {
    downloadBlob("openaeo-report.json", JSON.stringify(report, null, 2), "application/json");
  }

  function downloadMarkdown() {
    downloadBlob("openaeo-report.md", createMarkdownSnapshot(report), "text/markdown");
  }

  async function copyFix(fix: AuditReport["fixes"][number]) {
    await navigator.clipboard.writeText(fix.body);
    setCopiedFix(fix.id);
    window.setTimeout(() => {
      setCopiedFix((current) => (current === fix.id ? null : current));
    }, 1400);
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="OpenAEO navigation">
        <div className="brand">
          <div className="brandMark">OA</div>
          <div>
            <strong>OpenAEO</strong>
            <span>Open web attribution</span>
          </div>
        </div>

        <nav>
          <a className="active" href="#overview"><Gauge size={18} /> Overview</a>
          <a href="#issues"><AlertTriangle size={18} /> Findings</a>
          <a href="#pages"><TableProperties size={18} /> Pages</a>
          <a href="#links"><Link2Off size={18} /> Links</a>
          <a href="#fixes"><FileText size={18} /> Fixes</a>
        </nav>

        <div className="sidebarPanel">
          <span>Audit mode</span>
          <strong>{report.aiAnalysis.mode === "mock" ? "Deterministic demo" : "OpenAI API"}</strong>
          <p>{report.aiAnalysis.mode === "mock" ? "Use OPENAI_API_KEY for model analysis." : "Model-generated recommendations are enabled."}</p>
        </div>

        <a className="repoLink" href="https://github.com/marioledger/OpenAEO" target="_blank" rel="noreferrer">
          <Code2 size={17} /> GitHub repo <ExternalLink size={14} />
        </a>
      </aside>

      <section className="content">
        <header className="hero">
          <div>
            <div className="kicker"><Sparkles size={15} /> AI search readiness</div>
            <h1>Make publisher pages crawlable, citeable, and credited.</h1>
            <p>
              OpenAEO audits the source signals that answer engines need: canonicals, schema, citations,
              freshness, `llms.txt`, attribution metadata, and link health.
            </p>
          </div>
          <div className="heroActions">
            <button type="button" onClick={loadSample} title="Load sample report">
              <FileText size={18} /> Sample
            </button>
            <button type="button" onClick={downloadJson} title="Download JSON report">
              <FileJson size={18} /> JSON
            </button>
            <button type="button" onClick={downloadMarkdown} title="Download Markdown report">
              <FileCode2 size={18} /> Markdown
            </button>
          </div>
        </header>

        <section className="commandPanel" aria-label="Run audit">
          <div className="commandBar">
            <Globe2 size={21} />
            <input value={url} onChange={(event) => setUrl(event.target.value)} aria-label="Audit URL" />
            <button type="button" onClick={runAudit} disabled={isRunning} title="Run audit">
              {isRunning ? <CircleGauge size={18} className="spin" /> : <Search size={18} />}
              {isRunning ? "Running" : "Audit"}
            </button>
          </div>
          <div className="auditControls">
            <label className="field shortField">
              <span>Pages</span>
              <input
                type="number"
                min={1}
                max={20}
                value={maxPages}
                onChange={(event) => setMaxPages(clampNumber(event.target.valueAsNumber, 1, 20, 5))}
              />
            </label>
            <label className="field shortField">
              <span>Links</span>
              <input
                type="number"
                min={0}
                max={120}
                value={maxLinkChecks}
                onChange={(event) => setMaxLinkChecks(clampNumber(event.target.valueAsNumber, 0, 120, 50))}
              />
            </label>
            <label className="field">
              <span>Include</span>
              <input value={includeInput} onChange={(event) => setIncludeInput(event.target.value)} placeholder="/docs/*, /guides" />
            </label>
            <label className="field">
              <span>Exclude</span>
              <input value={excludeInput} onChange={(event) => setExcludeInput(event.target.value)} placeholder="/tag/*, /search" />
            </label>
            <label className="toggle">
              <input type="checkbox" checked={checkExternalLinks} onChange={(event) => setCheckExternalLinks(event.target.checked)} />
              <span>External links</span>
            </label>
          </div>
        </section>
        {error ? <p className="error">{error}</p> : null}

        <section id="overview" className="overviewGrid">
          <article className="heroScore">
            <ScoreRing score={report.score} />
            <div>
              <span className="sectionLabel">Current report</span>
              <h2>{report.projectName}</h2>
              <p>{report.aiAnalysis.summary}</p>
              <div className="reportMeta">
                <span>{report.pages.length} pages</span>
                <span>{report.issues.length} findings</span>
                <span>{healthySignals}/4 source signals</span>
                <span>{linkSummary.checked} links checked</span>
              </div>
            </div>
          </article>

          <article className="comparisonPanel">
            <div className="panelTitle">
              <GitCompareArrows size={18} />
              <span className="sectionLabel">Run comparison</span>
            </div>
            <strong className={comparison.scoreDelta >= 0 ? "positiveDelta" : "negativeDelta"}>
              {previousReport ? formatDelta(comparison.scoreDelta) : "Ready"}
            </strong>
            <div className="deltaGrid">
              <DeltaStat label="Findings" value={comparison.issueDelta} />
              <DeltaStat label="High risk" value={comparison.highDelta} />
              <DeltaStat label="Broken links" value={comparison.brokenDelta} invert />
            </div>
          </article>

          <article className="actionPanel">
            <span className="sectionLabel">Next best actions</span>
            <div className="actionList">
              {priorityIssues.length > 0 ? (
                priorityIssues.map((issue) => (
                  <div className="actionItem" key={issue.id}>
                    <span className={`dot ${issue.severity}`} />
                    <div>
                      <strong>{issue.title}</strong>
                      <p>{issue.recommendation}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="emptyState">No priority findings. Keep monitoring freshness and citations.</div>
              )}
            </div>
          </article>
        </section>

        <section className="metricGrid">
          {(Object.entries(report.categoryScores) as Array<[keyof AuditReport["categoryScores"], number]>).map(([category, score]) => (
            <article className="metric" key={category}>
              <div>
                <span>{category.toUpperCase()}</span>
                <small>{categoryCopy[category]}</small>
              </div>
              <strong>{score}</strong>
              <div className="bar"><i style={{ width: `${score}%` }} /></div>
            </article>
          ))}
        </section>

        <section className="signalGrid">
          <Signal icon={<CheckCircle2 size={18} />} label="robots.txt" detail="Crawler policy" active={report.siteSignals.robotsTxt.found} />
          <Signal icon={<Workflow size={18} />} label="sitemap" detail="Source map" active={report.siteSignals.sitemap.found} />
          <Signal icon={<Bot size={18} />} label="llms.txt" detail="AI entry point" active={report.siteSignals.llmsTxt.found} />
          <Signal icon={<Layers3 size={18} />} label="llms-full.txt" detail="Deep context" active={report.siteSignals.llmsFullTxt.found} />
        </section>

        <section className="insightGrid">
          <Insight title="Entity clarity" body={report.aiAnalysis.entityClarity} />
          <Insight title="Citation readiness" body={report.aiAnalysis.citationReadiness} />
          <Insight title="Content gaps" body={report.aiAnalysis.contentGaps.join(" ")} />
        </section>

        <section id="issues" className="workbench">
          <div className="sectionIntro">
            <span className="sectionLabel">Findings</span>
            <h2>What blocks attribution?</h2>
            <p>{filteredIssues.length} visible of {report.issues.length} findings across {report.pages.length} crawled page{report.pages.length === 1 ? "" : "s"}.</p>
            <div className="filterStack">
              <SegmentedControl
                icon={<AlertTriangle size={15} />}
                label="Severity"
                options={severityOptions}
                value={severityFilter}
                onChange={(value) => setSeverityFilter(value as SeverityFilter)}
              />
              <SegmentedControl
                icon={<Filter size={15} />}
                label="Category"
                options={categoryOptions}
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value as CategoryFilter)}
              />
            </div>
          </div>

          <div className="issueList">
            {Object.entries(groupedIssues).length > 0 ? (
              Object.entries(groupedIssues).map(([category, issues]) => (
                <article className="issueGroup" key={category}>
                  <div className="groupHeader">
                    <h3>{category.toUpperCase()}</h3>
                    <span>{issues.length}</span>
                  </div>
                  {issues.map((issue) => (
                    <IssueRow issue={issue} key={issue.id} />
                  ))}
                </article>
              ))
            ) : (
              <div className="emptyState">No findings match the active filters.</div>
            )}
          </div>
        </section>

        <section id="pages" className="workbench">
          <div className="sectionIntro">
            <span className="sectionLabel">Page inventory</span>
            <h2>Source readiness by URL</h2>
            <p>{pageRows.length} crawled page{pageRows.length === 1 ? "" : "s"} with page-level metadata, source signals, and finding counts.</p>
          </div>

          <div className="pageList">
            {pageRows.map(({ page, score, issueCount }) => (
              <article className="pageRow" key={page.url}>
                <div className="pageMain">
                  <span className={`statusBadge ${page.status >= 400 ? "high" : "good"}`}>{page.status}</span>
                  <div>
                    <h3>{page.title ?? "Untitled page"}</h3>
                    <a href={page.url} target="_blank" rel="noreferrer">{page.url}</a>
                  </div>
                </div>
                <div className="pageScore">
                  <span>{score}</span>
                  <div className="bar"><i style={{ width: `${score}%` }} /></div>
                </div>
                <div className="pageFacts">
                  <MiniFact label="Words" value={page.wordCount} />
                  <MiniFact label="Schema" value={page.schemaTypes.length || "none"} />
                  <MiniFact label="Links" value={page.internalLinks.length + page.externalLinks.length} />
                  <MiniFact label="Issues" value={issueCount} />
                </div>
                <div className="signalChips">
                  <Chip active={Boolean(page.canonical)} label="Canonical" />
                  <Chip active={page.h1.length === 1} label="H1" />
                  <Chip active={page.hasAuthor} label="Author" />
                  <Chip active={page.hasPublishedDate || page.hasModifiedDate} label="Date" />
                  <Chip active={page.citationCount > 0} label="Cites" />
                  <Chip active={page.answerBlockCount > 0} label="Answers" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="links" className="workbench">
          <div className="sectionIntro">
            <span className="sectionLabel">Link health</span>
            <h2>Verification queue</h2>
            <p>{linkSummary.checked} checked, {linkSummary.broken} broken, {linkSummary.redirected} redirected.</p>
            <div className="linkStats">
              <MiniStat label="Internal broken" value={linkSummary.internalBroken} />
              <MiniStat label="External broken" value={linkSummary.externalBroken} />
              <MiniStat label="Redirects" value={linkSummary.redirected} />
            </div>
          </div>

          <div className="linkWorkbench">
            <article className="linkGroup">
              <div className="groupHeader">
                <h3>Broken links</h3>
                <span>{brokenLinks.length}</span>
              </div>
              {brokenLinks.length > 0 ? (
                brokenLinks.map((link) => <LinkRow link={link} key={`${link.sourceUrl}-${link.targetUrl}`} />)
              ) : (
                <div className="emptyState">No broken links in the checked sample.</div>
              )}
            </article>
            <article className="linkGroup">
              <div className="groupHeader">
                <h3>Redirects</h3>
                <span>{redirectedLinks.length}</span>
              </div>
              {redirectedLinks.length > 0 ? (
                redirectedLinks.map((link) => <LinkRow link={link} key={`${link.sourceUrl}-${link.targetUrl}`} />)
              ) : (
                <div className="emptyState">No redirects in the checked sample.</div>
              )}
            </article>
          </div>
        </section>

        <section id="fixes" className="workbench">
          <div className="sectionIntro">
            <span className="sectionLabel">Generated fixes</span>
            <h2>Reviewable source upgrades</h2>
            <p>{report.fixes.length} templates and remediation queues for source maps, schema, citations, and links.</p>
          </div>
          <div className="fixList">
            {report.fixes.map((fix) => (
              <article className="fix" key={fix.id}>
                <div className="fixHeader">
                  <div>
                    <h3>{fix.title}</h3>
                    <span>{fix.target}</span>
                  </div>
                  <button type="button" className="iconButton" onClick={() => copyFix(fix)} title="Copy fix body">
                    {copiedFix === fix.id ? <Check size={17} /> : <Clipboard size={17} />}
                  </button>
                </div>
                <p>{fix.rationale}</p>
                <pre>{fix.body}</pre>
              </article>
            ))}
          </div>
        </section>

        <section id="ethics" className="policyPanel">
          <div className="policyIcon"><ShieldCheck size={22} /></div>
          <div>
            <span className="sectionLabel">Policy</span>
            <h2>Attribution-first, not spam-first.</h2>
            <p>OpenAEO optimizes clarity, source quality, and credit. It does not ship ranking manipulation, cloaking, dark-pattern crawling, or prompt-injection workflows.</p>
          </div>
          <div className="policyChecks">
            <span><CheckCircle2 size={16} /> Respectful crawl</span>
            <span><CheckCircle2 size={16} /> Human-reviewable fixes</span>
            <span><CheckCircle2 size={16} /> No black-hat GEO</span>
          </div>
        </section>
      </section>
    </main>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="scoreRing" style={{ "--score": `${score * 3.6}deg` } as CSSProperties} aria-label={`Overall score ${score} out of 100`}>
      <div>
        <span>{score}</span>
        <small>/100</small>
      </div>
    </div>
  );
}

function Signal({ icon, label, detail, active }: { icon: ReactNode; label: string; detail: string; active: boolean }) {
  return (
    <article className={active ? "signal active" : "signal"}>
      <div className="signalIcon">{icon}</div>
      <div>
        <span>{label}</span>
        <small>{detail}</small>
      </div>
      <strong>{active ? <CheckCircle2 size={17} /> : <XCircle size={17} />}{active ? "Found" : "Missing"}</strong>
    </article>
  );
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <article className="insight">
      <span className="sectionLabel">{title}</span>
      <p>{body}</p>
    </article>
  );
}

function DeltaStat({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const positive = invert ? value <= 0 : value >= 0;
  return (
    <div className={positive ? "deltaStat positive" : "deltaStat negative"}>
      <span>{label}</span>
      <strong>{formatDelta(value)}</strong>
    </div>
  );
}

function SegmentedControl({
  icon,
  label,
  options,
  value,
  onChange
}: {
  icon: ReactNode;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented">
      <div className="segmentedLabel">{icon}{label}</div>
      <div>
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={value === option ? "selected" : ""}
            onClick={() => onChange(option)}
            aria-pressed={value === option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: Issue }) {
  return (
    <div className="issue">
      <span className={`pill ${issue.severity}`}>{issue.severity}</span>
      <div>
        <strong>{issue.title}</strong>
        <p>{issue.recommendation}</p>
        {issue.url ? <a href={issue.url} target="_blank" rel="noreferrer">{issue.url}</a> : null}
        {issue.evidence.length > 0 ? <small>{issue.evidence.slice(0, 2).join(" | ")}</small> : null}
      </div>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span>{value}</span>
      <small>{label}</small>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="miniStat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Chip({ active, label }: { active: boolean; label: string }) {
  return <span className={active ? "chip active" : "chip"}>{active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{label}</span>;
}

function LinkRow({ link }: { link: AuditReport["linkChecks"][number] }) {
  const status = link.status ? `HTTP ${link.status}` : link.error ?? "Fetch failed";
  const finalUrl = link.finalUrl ?? link.redirectChain.at(-1);
  return (
    <div className="linkRow">
      <span className={`pill ${link.ok ? "low" : link.kind === "internal" ? "high" : "medium"}`}>{link.kind}</span>
      <div>
        <strong>{status}</strong>
        <a href={link.targetUrl} target="_blank" rel="noreferrer">{link.targetUrl}</a>
        <small>From {link.sourceUrl}</small>
        {finalUrl && finalUrl !== link.targetUrl ? <small>Final {finalUrl}</small> : null}
      </div>
    </div>
  );
}

function groupByCategory(issues: AuditReport["issues"]) {
  return categoryOrder.reduce<Record<string, AuditReport["issues"]>>((groups, category) => {
    const matching = issues.filter((issue) => issue.category === category);
    if (matching.length > 0) groups[category] = matching;
    return groups;
  }, {});
}

function severityRank(severity: Issue["severity"]) {
  if (severity === "high") return 4;
  if (severity === "medium") return 3;
  if (severity === "low") return 2;
  return 1;
}

function summarizeLinkChecks(linkChecks: AuditReport["linkChecks"]) {
  return {
    checked: linkChecks.length,
    broken: linkChecks.filter((link) => !link.ok).length,
    redirected: linkChecks.filter((link) => link.redirectChain.length > 0).length,
    internalBroken: linkChecks.filter((link) => !link.ok && link.kind === "internal").length,
    externalBroken: linkChecks.filter((link) => !link.ok && link.kind === "external").length
  };
}

function compareReports(report: AuditReport, previousReport: AuditReport | null) {
  if (!previousReport) {
    return {
      scoreDelta: 0,
      issueDelta: 0,
      highDelta: 0,
      brokenDelta: 0
    };
  }
  return {
    scoreDelta: report.score - previousReport.score,
    issueDelta: report.issues.length - previousReport.issues.length,
    highDelta: report.issues.filter((issue) => issue.severity === "high").length - previousReport.issues.filter((issue) => issue.severity === "high").length,
    brokenDelta: report.linkChecks.filter((link) => !link.ok).length - previousReport.linkChecks.filter((link) => !link.ok).length
  };
}

function pageReadinessScore(page: AuditReport["pages"][number]) {
  const checks = [
    Boolean(page.title && page.title.length >= 10),
    Boolean(page.description && page.description.length >= 50),
    Boolean(page.canonical),
    page.h1.length === 1,
    page.schemaTypes.length > 0,
    page.hasAuthor,
    page.hasPublishedDate || page.hasModifiedDate,
    page.citationCount > 0,
    page.answerBlockCount > 0,
    page.internalLinks.length > 0
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function parsePatterns(value: string) {
  return value.split(",").map((pattern) => pattern.trim()).filter(Boolean);
}

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatDelta(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function downloadBlob(filename: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

function createMarkdownSnapshot(report: AuditReport) {
  const issues = report.issues.length
    ? report.issues.map((issue) => `- **${issue.severity.toUpperCase()} / ${issue.category}**: ${issue.title}\n  ${issue.recommendation}`).join("\n")
    : "- No issues found.";
  const fixes = report.fixes.length
    ? report.fixes.map((fix) => `## ${fix.title}\n\nTarget: \`${fix.target}\`\n\n${fix.rationale}\n\n\`\`\`\n${fix.body}\n\`\`\``).join("\n\n")
    : "No generated fixes required.";
  const brokenLinks = report.linkChecks.filter((link) => !link.ok);
  const linkLines = brokenLinks.length
    ? brokenLinks.map((link) => `- ${link.kind}: ${link.targetUrl} from ${link.sourceUrl}`).join("\n")
    : "- No broken links found in the checked sample.";

  return `# OpenAEO Audit Report

Audited URL: ${report.auditedUrl}
Generated: ${report.generatedAt}
Overall: ${report.score}/100

## Issues

${issues}

## Broken Links

${linkLines}

## Generated Fixes

${fixes}
`;
}
