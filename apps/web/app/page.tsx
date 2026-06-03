"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Bot,
  CheckCircle2,
  CircleGauge,
  ExternalLink,
  FileText,
  Gauge,
  Github,
  Globe2,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  XCircle
} from "lucide-react";
import { auditReportSchema, createSampleReport, type AuditReport } from "@openaeo/schemas";

const categoryCopy: Record<keyof AuditReport["categoryScores"], string> = {
  seo: "Indexing basics",
  aeo: "Answer readiness",
  geo: "Citation pull",
  trust: "Source quality"
};

export default function Dashboard() {
  const [report, setReport] = useState<AuditReport>(() => createSampleReport());
  const [url, setUrl] = useState("https://example.com");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const groupedIssues = useMemo(() => groupByCategory(report.issues), [report.issues]);
  const priorityIssues = useMemo(
    () => [...report.issues].sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).slice(0, 4),
    [report.issues]
  );
  const healthySignals = [
    report.siteSignals.robotsTxt.found,
    report.siteSignals.sitemap.found,
    report.siteSignals.llmsTxt.found,
    report.siteSignals.llmsFullTxt.found
  ].filter(Boolean).length;

  async function runAudit() {
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, maxPages: 5 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Audit failed");
      setReport(auditReportSchema.parse(data));
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "Audit failed");
    } finally {
      setIsRunning(false);
    }
  }

  function loadSample() {
    setReport(createSampleReport());
    setError(null);
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "openaeo-report.json";
    anchor.click();
    URL.revokeObjectURL(href);
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
          <a href="#fixes"><FileText size={18} /> Fixes</a>
          <a href="#ethics"><ShieldCheck size={18} /> Policy</a>
        </nav>

        <div className="sidebarPanel">
          <span>Audit mode</span>
          <strong>{report.aiAnalysis.mode === "mock" ? "Deterministic demo" : "OpenAI API"}</strong>
          <p>{report.aiAnalysis.mode === "mock" ? "Use OPENAI_API_KEY for model analysis." : "Model-generated recommendations are enabled."}</p>
        </div>

        <a className="repoLink" href="https://github.com/marioledger/OpenAEO" target="_blank" rel="noreferrer">
          <Github size={17} /> GitHub repo <ExternalLink size={14} />
        </a>
      </aside>

      <section className="content">
        <header className="hero">
          <div>
            <div className="kicker"><Sparkles size={15} /> AI search readiness</div>
            <h1>Make publisher pages crawlable, citeable, and credited.</h1>
            <p>
              OpenAEO audits the source signals that answer engines need: canonicals, schema, citations,
              freshness, `llms.txt`, and attribution metadata.
            </p>
          </div>
          <div className="heroActions">
            <button type="button" onClick={loadSample} title="Load sample report">
              <FileText size={18} /> Sample
            </button>
            <button type="button" onClick={downloadJson} title="Download JSON report">
              <ArrowDownToLine size={18} /> Export
            </button>
          </div>
        </header>

        <section className="commandBar" aria-label="Run audit">
          <Globe2 size={21} />
          <input value={url} onChange={(event) => setUrl(event.target.value)} aria-label="Audit URL" />
          <button type="button" onClick={runAudit} disabled={isRunning} title="Run audit">
            {isRunning ? <CircleGauge size={18} className="spin" /> : <Search size={18} />}
            {isRunning ? "Running" : "Audit"}
          </button>
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
              </div>
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

        <section id="issues" className="workbench">
          <div className="sectionIntro">
            <span className="sectionLabel">Findings</span>
            <h2>What blocks attribution?</h2>
            <p>{report.issues.length} findings across {report.pages.length} crawled page{report.pages.length === 1 ? "" : "s"}.</p>
          </div>

          <div className="issueList">
            {Object.entries(groupedIssues).map(([category, issues]) => (
              <article className="issueGroup" key={category}>
                <div className="groupHeader">
                  <h3>{category.toUpperCase()}</h3>
                  <span>{issues.length}</span>
                </div>
                {issues.map((issue) => (
                  <div className="issue" key={issue.id}>
                    <span className={`pill ${issue.severity}`}>{issue.severity}</span>
                    <div>
                      <strong>{issue.title}</strong>
                      <p>{issue.recommendation}</p>
                      {issue.url ? <a href={issue.url} target="_blank" rel="noreferrer">{issue.url}</a> : null}
                    </div>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section id="fixes" className="workbench">
          <div className="sectionIntro">
            <span className="sectionLabel">Generated fixes</span>
            <h2>Reviewable source upgrades</h2>
            <p>Templates for source maps, schema, citations, and crawler-readable metadata.</p>
          </div>
          <div className="fixList">
            {report.fixes.map((fix) => (
              <article className="fix" key={fix.id}>
                <div>
                  <h3>{fix.title}</h3>
                  <span>{fix.target}</span>
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
    <div className="scoreRing" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties} aria-label={`Overall score ${score} out of 100`}>
      <div>
        <span>{score}</span>
        <small>/100</small>
      </div>
    </div>
  );
}

function Signal({ icon, label, detail, active }: { icon: React.ReactNode; label: string; detail: string; active: boolean }) {
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

function groupByCategory(issues: AuditReport["issues"]) {
  return issues.reduce<Record<string, AuditReport["issues"]>>((groups, issue) => {
    groups[issue.category] ??= [];
    groups[issue.category]!.push(issue);
    return groups;
  }, {});
}

function severityRank(severity: AuditReport["issues"][number]["severity"]) {
  if (severity === "high") return 4;
  if (severity === "medium") return 3;
  if (severity === "low") return 2;
  return 1;
}
