"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Download, FileText, Gauge, Globe2, Search, ShieldCheck } from "lucide-react";
import { auditReportSchema, createSampleReport, type AuditReport } from "@openaeo/schemas";

export default function Dashboard() {
  const [report, setReport] = useState<AuditReport>(() => createSampleReport());
  const [url, setUrl] = useState("https://example.com");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const groupedIssues = useMemo(() => groupByCategory(report.issues), [report.issues]);

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
            <span>Attribution-first audits</span>
          </div>
        </div>
        <nav>
          <a href="#overview"><Gauge size={18} /> Overview</a>
          <a href="#issues"><AlertTriangle size={18} /> Issues</a>
          <a href="#fixes"><FileText size={18} /> Fixes</a>
          <a href="#ethics"><ShieldCheck size={18} /> Ethics</a>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI search readiness</p>
            <h1>Make publisher pages easier to crawl, cite, and credit.</h1>
          </div>
          <div className="actions">
            <button type="button" onClick={loadSample} title="Load sample report">
              <FileText size={18} /> Sample
            </button>
            <button type="button" onClick={downloadJson} title="Download JSON report">
              <Download size={18} /> JSON
            </button>
          </div>
        </header>

        <section className="auditBar" aria-label="Run audit">
          <Globe2 size={20} />
          <input value={url} onChange={(event) => setUrl(event.target.value)} aria-label="Audit URL" />
          <button type="button" onClick={runAudit} disabled={isRunning} title="Run audit">
            <Search size={18} /> {isRunning ? "Running" : "Audit"}
          </button>
        </section>
        {error ? <p className="error">{error}</p> : null}

        <section id="overview" className="scoreGrid">
          <article className="scorePanel">
            <div className="scoreRing" aria-label={`Overall score ${report.score} out of 100`}>
              <span>{report.score}</span>
              <small>/100</small>
            </div>
            <div>
              <h2>{report.projectName}</h2>
              <p>{report.aiAnalysis.summary}</p>
            </div>
          </article>

          {Object.entries(report.categoryScores).map(([category, score]) => (
            <article className="metric" key={category}>
              <span>{category.toUpperCase()}</span>
              <strong>{score}</strong>
              <div className="bar"><i style={{ width: `${score}%` }} /></div>
            </article>
          ))}
        </section>

        <section className="signals">
          <Signal icon={<CheckCircle2 size={18} />} label="robots.txt" active={report.siteSignals.robotsTxt.found} />
          <Signal icon={<CheckCircle2 size={18} />} label="sitemap" active={report.siteSignals.sitemap.found} />
          <Signal icon={<Bot size={18} />} label="llms.txt" active={report.siteSignals.llmsTxt.found} />
          <Signal icon={<Bot size={18} />} label="llms-full.txt" active={report.siteSignals.llmsFullTxt.found} />
        </section>

        <section id="issues" className="twoColumn">
          <div>
            <h2>Issues</h2>
            <p className="muted">{report.issues.length} findings across {report.pages.length} crawled page{report.pages.length === 1 ? "" : "s"}.</p>
          </div>
          <div className="issueList">
            {Object.entries(groupedIssues).map(([category, issues]) => (
              <article className="issueGroup" key={category}>
                <h3>{category.toUpperCase()}</h3>
                {issues.map((issue) => (
                  <div className="issue" key={issue.id}>
                    <span className={`pill ${issue.severity}`}>{issue.severity}</span>
                    <strong>{issue.title}</strong>
                    <p>{issue.recommendation}</p>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section id="fixes" className="twoColumn">
          <div>
            <h2>Generated fixes</h2>
            <p className="muted">Ready-to-review artifacts for source maps, schema, and citation patterns.</p>
          </div>
          <div className="fixList">
            {report.fixes.map((fix) => (
              <article className="fix" key={fix.id}>
                <h3>{fix.title}</h3>
                <span>{fix.target}</span>
                <pre>{fix.body}</pre>
              </article>
            ))}
          </div>
        </section>

        <section id="ethics" className="ethics">
          <ShieldCheck size={22} />
          <div>
            <h2>Ethical stance</h2>
            <p>OpenAEO optimizes clarity, source quality, and attribution. It does not ship ranking manipulation, dark-pattern crawling, or spam workflows.</p>
          </div>
        </section>
      </section>
    </main>
  );
}

function Signal({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <article className={active ? "signal active" : "signal"}>
      {icon}
      <span>{label}</span>
      <strong>{active ? "Found" : "Missing"}</strong>
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
