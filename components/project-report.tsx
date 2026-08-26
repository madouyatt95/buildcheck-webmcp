"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Flame,
  History,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  X
} from "lucide-react";
import { useDemoStore } from "@/components/demo-store";
import { PageLoading } from "@/components/loading-state";
import { ScoreRing } from "@/components/score-ring";
import { VerdictBadge } from "@/components/verdict-badge";
import type { Analysis, Project } from "@/lib/domain/types";

type Tab = "overview" | "evidence" | "competition" | "distribution" | "mvp" | "pivots" | "tokens" | "roast" | "history";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "evidence", label: "Evidence" },
  { id: "competition", label: "Competition" },
  { id: "distribution", label: "Distribution" },
  { id: "mvp", label: "MVP" },
  { id: "pivots", label: "Pivots" },
  { id: "tokens", label: "Token ROI" },
  { id: "roast", label: "Roast" },
  { id: "history", label: "History" }
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function ScoreBreakdown({ analysis }: { analysis: Analysis }) {
  return (
    <section className="section">
      <div className="section-heading"><div><h2>Score breakdown</h2><p>Seven independent dimensions, weighted to exactly 100 points</p></div></div>
      <div className="score-grid">
        {analysis.dimensions.map((dimension) => (
          <article className="card score-dimension" key={dimension.key}>
            <div className="dimension-head"><h3>{dimension.label}</h3><span className="dimension-value">{dimension.score.toFixed(1)} <span className="tiny">/ 10 · {dimension.weightedPoints}/{dimension.maxPoints} pts</span></span></div>
            <p>{dimension.justification}</p>
            <div className="progress-track"><span style={{ width: `${dimension.score * 10}%` }} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Frustrations({ analysis }: { analysis: Analysis }) {
  return (
    <section className="section">
      <div className="section-heading"><div><h2>Top user frustrations</h2><p>Frequency is simulated from the demo discovery sample</p></div></div>
      <div className="frustration-list">
        {analysis.frustrations.map((frustration) => (
          <article className="card frustration" key={frustration.label}>
            <strong>{frustration.label}</strong>
            <span className="frustration-meta">{frustration.mentions} mentions · {frustration.intensity}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Evidence({ analysis }: { analysis: Analysis }) {
  const complaintCount = analysis.signals.filter((signal) => ["pain", "competitor_complaint", "churn_risk"].includes(signal.signalType)).length;
  const paymentCount = analysis.signals.filter((signal) => signal.signalType === "willingness_to_pay").length;
  const sources = new Set(analysis.signals.map((signal) => signal.source)).size;
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">Evidence, not vibes.</span><h2 style={{ marginTop: 7 }}>Observable signals behind the score</h2><p>{analysis.isDemo ? "Every item below belongs to the curated demo dataset — none came from a live platform." : "Every item below links to the observed public discussion. Classification and scoring remain deterministic interpretations."}</p></div><span className={`badge ${analysis.isDemo ? "demo-badge" : "green"}`}>{analysis.evidenceMeta.mode === "fallback" ? "Demo fallback" : analysis.isDemo ? "Simulated dataset" : "Observed public source"}</span></div>
        <div className="evidence-stats">
          {[
            [analysis.signals.length, "signals"], [sources, "source groups"], [analysis.competitors.length, "competitors"], [complaintCount, "complaints"], [paymentCount, "payment signals"]
          ].map(([value, label]) => <div className="card evidence-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        <div className="evidence-grid">
          {analysis.signals.map((signal) => (
            <article className="card evidence-card" key={signal.id}>
              <div className="evidence-source"><strong>{signal.source}</strong><span className={`badge ${signal.isDemo ? "demo-badge" : "green"}`}>{signal.isDemo ? "Demo" : "Observed"}</span></div>
              <h3>{signal.title}</h3>
              <blockquote>“{signal.excerpt}”</blockquote>
              <div className="evidence-meta"><span className="badge">{signal.signalType.replaceAll("_", " ")}</span><span className={`badge ${signal.strength === "strong" ? "green" : signal.strength === "weak" ? "red" : "orange"}`}>{signal.strength}</span></div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Competition({ analysis }: { analysis: Analysis }) {
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><h2>Competitive landscape</h2><p>Alternatives validate the category; their repeated weaknesses define the wedge.</p></div><span className="badge demo-badge">{analysis.competitors.length} demo competitors</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Positioning</th><th>Pricing</th><th>Strengths</th><th>Weaknesses</th><th>Opportunity</th></tr></thead>
            <tbody>{analysis.competitors.map((competitor) => <tr key={competitor.id}><td><strong>{competitor.name}</strong><br />{competitor.targetAudience}</td><td>{competitor.positioning}</td><td>{competitor.pricing}</td><td>{competitor.strengths.join(", ")}</td><td>{competitor.weaknesses.join(", ")}</td><td>{competitor.opportunity}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="section">
        <div className="section-heading"><div><h2>Opportunity matrix</h2><p>Qualitative placement from this dataset, not a market-size model</p></div></div>
        <div className="matrix">
          <div className="matrix-cell"><span className="tiny">HIGH COMPETITION · LOW OPPORTUNITY</span><h3 style={{ marginTop: 10 }}>Feature-for-feature clone</h3><p>Incumbents win on breadth and distribution.</p></div>
          <div className="matrix-cell highlight"><span className="tiny">HIGH COMPETITION · HIGH OPPORTUNITY</span><h3 style={{ marginTop: 10 }}>Focused workflow wedge</h3><p>Users pay already but complain about complexity and poor segment fit.</p></div>
          <div className="matrix-cell"><span className="tiny">LOW COMPETITION · LOW DEMAND</span><h3 style={{ marginTop: 10 }}>Category creation</h3><p>Avoid until problem frequency and budget are proven.</p></div>
          <div className="matrix-cell"><span className="tiny">LOW COMPETITION · HIGH OPPORTUNITY</span><h3 style={{ marginTop: 10 }}>Manual-first vertical</h3><p>Best explored with a paid concierge offer.</p></div>
        </div>
      </section>
      <section className="card card-pad section">
        <span className="eyebrow">Market gap</span>
        <h2 style={{ marginTop: 9 }}>Win through a narrower operating model, not more features.</h2>
        <p className="muted" style={{ marginBottom: 0 }}>The category has alternatives, but demo evidence consistently penalizes broad setup and pricing. A lightweight outcome for {analysis.competitors[0]?.targetAudience.toLowerCase() || "one vertical"} is the clearest wedge to test.</p>
      </section>
    </>
  );
}

function Distribution({ analysis }: { analysis: Analysis }) {
  const score = analysis.dimensions.find((dimension) => dimension.key === "distribution")?.score || 0;
  const first = analysis.channels[0];
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">Can you actually reach these people?</span><h2 style={{ marginTop: 7 }}>Distribution score: {score.toFixed(1)} / 10</h2><p>A market is only useful when an early channel is specific, accessible and repeatable.</p></div></div>
        <div className="channel-grid">
          {analysis.channels.map((channel) => (
            <article className="card channel-card" key={channel.name}>
              <div className="row between"><h3>{channel.name}</h3><span className={`badge ${channel.potential === "Strong" ? "green" : channel.potential === "Low" ? "red" : "orange"}`}>{channel.potential}</span></div>
              <strong className="tiny">{channel.detail}</strong>
              <p>{channel.rationale}</p>
            </article>
          ))}
        </div>
      </section>
      {first && <section className="card card-pad section"><span className="eyebrow">Best first acquisition channel</span><h2 style={{ marginTop: 8 }}>{first.name}</h2><p className="muted" style={{ marginBottom: 0 }}>{first.rationale} Start with conversations and paid pilots, not scale.</p></section>}
      <section className="section">
        <div className="section-heading"><div><h2>How to get your first 100 users</h2><p>A proof-led sequence that begins manually</p></div></div>
        <div className="numbered-plan">{analysis.firstHundredUsers.map((item, index) => <article className="card plan-step" key={item}><span className="plan-number">{index + 1}</span><span>{item}</span></article>)}</div>
      </section>
    </>
  );
}

function Mvp({ project, analysis }: { project: Project; analysis: Analysis }) {
  const [generated, setGenerated] = useState(false);
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">Do you really need to build all of this?</span><h2 style={{ marginTop: 7 }}>Cut scope until the riskiest assumption is exposed.</h2></div></div>
        <div className="mvp-compare">
          <article className="card mvp-card"><span className="tiny">ORIGINAL CONCEPT</span><h3 style={{ marginTop: 11 }}>{project.name}</h3><p className="muted">{project.description}</p><div className="metric-line"><span>Complexity</span><strong>{analysis.complexity.level}</strong></div><div className="metric-line"><span>Potential build</span><strong>{analysis.complexity.estimatedHours[0]}–{analysis.complexity.estimatedHours[1]}h</strong></div></article>
          <div className="compare-arrow"><ArrowRight /></div>
          <article className="card mvp-card recommended"><div className="row between"><span className="tiny">MINIMUM TESTABLE VERSION</span><span className="badge green">Recommended</span></div><h3 style={{ marginTop: 11 }}>{analysis.mvp.scope}</h3><ul className="clean-list">{analysis.mvp.include.map((item) => <li key={item}>{item}</li>)}</ul><div className="metric-line"><span>Estimated build</span><strong>{analysis.mvp.estimatedHours}</strong></div></article>
        </div>
      </section>
      <section className="card card-pad section">
        <div className="row between"><div><span className="eyebrow">Test hypothesis</span><h2 style={{ marginTop: 8, maxWidth: 720 }}>{analysis.mvp.hypothesis}</h2></div><Target color="var(--green)" /></div>
        <div className="score-grid" style={{ marginTop: 17 }}>
          <div><h3>Include</h3><ul className="clean-list">{analysis.mvp.include.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h3>Explicitly exclude</h3><ul className="clean-list">{analysis.mvp.exclude.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <h3 style={{ marginTop: 25 }}>Success criteria</h3>
        <div className="row" style={{ flexWrap: "wrap", marginTop: 10 }}>{analysis.mvp.successCriteria.map((item) => <span className="badge" key={item}><Check size={11} /> {item}</span>)}</div>
        <button className="button primary" style={{ marginTop: 23 }} onClick={() => setGenerated(true)}><Sparkles /> {generated ? "Validation MVP generated" : "Generate validation MVP"}</button>
        {generated && <p role="status" className="muted" style={{ margin: "13px 0 0", fontSize: 12 }}>Scope locked in this demo session. The next production step would persist it to <code>mvp_recommendations</code>.</p>}
      </section>
    </>
  );
}

function Pivots({ analysis }: { analysis: Analysis }) {
  return (
    <section className="section">
      <div className="section-heading"><div><h2>Possible pivots</h2><p>Narrower concepts inferred only from the supplied idea and demo evidence</p></div></div>
      <div className="pivot-grid">{analysis.pivots.map((pivot) => <article className="card pivot-card" key={pivot.concept}><div className="row between"><div className="row"><span className="badge">Potential score</span><span className="badge orange">Hypothetical</span></div><span className="pivot-score">{pivot.estimatedScore}</span></div><h3 style={{ marginTop: 20 }}>{pivot.concept}</h3><p className="muted">For {pivot.targetAudience}</p><p style={{ fontSize: 12 }}>{pivot.whyStronger}</p><div className="badge green" style={{ whiteSpace: "normal", height: "auto", paddingBlock: 6 }}>{pivot.keyDifference}</div></article>)}</div>
    </section>
  );
}

function TokenRoi({ analysis }: { analysis: Analysis }) {
  const [minimum, maximum] = analysis.complexity.estimatedHours;
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">Token economics</span><h2 style={{ marginTop: 7 }}>What coding this concept could consume</h2><p>Directional engineering estimate based on scope, not an API invoice.</p></div></div>
        <div className="token-grid">
          <article className="card token-metric"><span className="tiny">AI CODING USAGE</span><strong>{formatNumber(analysis.complexity.estimatedTokens)} tokens</strong></article>
          <article className="card token-metric"><span className="tiny">DEBUG ITERATIONS</span><strong>≈ {analysis.complexity.debuggingIterations}</strong></article>
          <article className="card token-metric"><span className="tiny">BUILD COMPLEXITY</span><strong>{analysis.complexity.level}</strong></article>
          <article className="card token-metric"><span className="tiny">BUILD EFFORT</span><strong>{minimum}–{maximum}h</strong></article>
        </div>
      </section>
      <section className={`card card-pad section ${analysis.confidenceScore < 60 ? "roast-card" : ""}`}>
        <span className="eyebrow">Recommendation</span>
        <h2 style={{ marginTop: 9 }}>{analysis.confidenceScore < 60 ? "Do not spend these tokens yet." : "Spend only enough to run the validation MVP."}</h2>
        <p className="muted" style={{ marginBottom: 0 }}>Confidence is {analysis.confidenceScore}%. Resolve the riskiest unknown with a {analysis.mvp.estimatedHours} test before committing to the full {minimum}–{maximum} hour build.</p>
      </section>
    </>
  );
}

function Roast({ project, analysis }: { project: Project; analysis: Analysis }) {
  return (
    <>
      <section className="card card-pad roast-card section">
        <div className="row between"><div><span className="eyebrow" style={{ color: "var(--red)" }}>Adversarial review</span><h2 style={{ marginTop: 8 }}>Let’s try to kill {project.name}.</h2></div><Flame color="var(--red)" /></div>
        <p className="muted">These are failure hypotheses, not invented evidence. Each one should become a cheap test.</p>
      </section>
      <div className="roast-grid section">
        <section className="card card-pad"><h2>Reasons this could fail</h2><ol className="risk-list">{analysis.roast.risks.map((risk) => <li key={risk}>{risk}</li>)}</ol></section>
        <section className="card card-pad"><h2>What would change our mind?</h2><ul className="clean-list">{analysis.roast.changeOurMind.map((item) => <li key={item}>{item}</li>)}</ul></section>
      </div>
      <section className="card card-pad section">
        <div className="row between"><div><span className="eyebrow">Better angle detected</span><h2 style={{ marginTop: 8, maxWidth: 760 }}>{analysis.roast.betterAngle}</h2></div><div style={{ textAlign: "right" }}><span className="tiny">POTENTIAL SCORE</span><div className="pivot-score">{analysis.roast.estimatedScore}</div></div></div>
      </section>
    </>
  );
}

function HistoryTab({ project }: { project: Project }) {
  return (
    <section className="section">
      <div className="section-heading"><div><h2>Immutable analysis history</h2><p>Re-analysis appends a version; prior verdicts remain available.</p></div></div>
      <div className="stack">{project.analyses.map((analysis, index) => {
        const previous = project.analyses[index + 1];
        const delta = previous ? analysis.buildScore - previous.buildScore : 0;
        return <article className="card card-pad row between" key={analysis.id}><div className="row"><span className="project-icon"><History size={17} /></span><div><strong>Analysis v{analysis.version}</strong><span className="tiny" style={{ display: "block" }}>{formatDate(analysis.createdAt)} · {analysis.signals.length} signals</span></div></div><div className="row"><VerdictBadge verdict={analysis.verdict} /><strong>{analysis.buildScore}</strong>{previous && <span className={delta < 0 ? "trend down" : "trend"}>{delta > 0 ? "+" : ""}{delta}</span>}</div></article>;
      })}</div>
    </section>
  );
}

export function ProjectReport({ projectId, initialTab = "overview" }: { projectId: string; initialTab?: string }) {
  const { projects, loading, reanalyze, archiveProject } = useDemoStore();
  const allowedInitial = tabs.some((item) => item.id === initialTab) ? initialTab as Tab : "overview";
  const [tab, setTab] = useState<Tab>(allowedInitial);
  const [running, setRunning] = useState(false);
  const [archived, setArchived] = useState(false);
  const [showAgentGuide, setShowAgentGuide] = useState(false);
  const project = projects.find((item) => item.id === projectId);

  if (loading) return <PageLoading />;
  if (!project) return <div className="page"><div className="card empty-state"><span className="empty-icon"><AlertTriangle /></span><h2>Project not found</h2><p>This idea is not in the current demo workspace. Local demo data may have been reset.</p><Link href="/projects" className="button primary">Back to projects</Link></div></div>;
  const analysis = project.analyses[0];
  if (!analysis) return null;
  const activeProject = project;
  const agentReady = analysis.confidenceScore >= 50 && analysis.signals.some((signal) => signal.provenance !== "generated");
  const weakestMarketDimension = [...analysis.dimensions]
    .filter((item) => item.key !== "buildSimplicity" && item.key !== "defensibility")
    .sort((a, b) => a.score - b.score)[0];

  async function runAgain() {
    setRunning(true);
    await reanalyze(activeProject.id);
    setRunning(false);
    setTab("history");
  }

  function archive() {
    archiveProject(activeProject.id);
    setArchived(true);
  }

  return (
    <div className="page">
      <div className="row between no-print report-toolbar" style={{ marginBottom: 15, alignItems: "flex-start" }}>
        <Link href="/projects" className="tiny">Projects <ChevronRight size={11} style={{ verticalAlign: "middle" }} /> {project.name}</Link>
        <div className="row report-toolbar-actions">
          <button className="button ghost" onClick={() => setShowAgentGuide((value) => !value)}><Bot /> Use with agent</button>
          <button className="button ghost" onClick={() => window.print()}><Printer /> Print</button>
          <button className="button ghost" onClick={runAgain} disabled={running}><RefreshCw className={running ? "spin" : ""} /> {running ? "Analyzing…" : "Re-analyze"}</button>
        </div>
      </div>

      <header className="card report-hero">
        <div>
          <div className="row" style={{ marginBottom: 12 }}><VerdictBadge verdict={analysis.verdict} /><span className={`badge ${analysis.isDemo ? "demo-badge" : "green"}`}>{analysis.evidenceMeta.mode === "fallback" ? "Demo fallback" : analysis.isDemo ? "Demo evidence" : "Observed evidence"}</span>{agentReady && <span className="badge green"><Bot size={11} /> Agent Ready</span>}<span className="tiny">Analysis v{analysis.version}</span></div>
          <h1>{project.name}</h1>
          <p className="subtitle">{project.tagline}</p>
          <p className="report-summary">{analysis.summary}</p>
          <div className="confidence"><ShieldCheck size={15} color="var(--purple)" /><strong>Confidence: {analysis.confidenceScore}%</strong><span className="confidence-bar"><span style={{ width: `${analysis.confidenceScore}%` }} /></span>{analysis.confidenceScore < 60 && <span>Promising, but insufficient evidence.</span>}</div>
        </div>
        <div className="report-score-panel">
          <ScoreRing score={analysis.buildScore} />
          <div className="prebuild-decision">
            <span>Pre-build decision</span>
            <strong>{analysis.verdict}</strong>
            <p>Before the full build, validate {weakestMarketDimension?.label.toLowerCase() || "the riskiest assumption"}.</p>
            <div className="prebuild-actions"><button className="button primary" onClick={() => setTab("mvp")}>Generate MVP</button><button className="button ghost" onClick={() => setTab("evidence")}>View evidence</button></div>
          </div>
        </div>
      </header>

      {showAgentGuide && <section className="card card-pad agent-guide section no-print"><div className="row between"><div><span className="eyebrow">Use with agent</span><h2 style={{ marginTop: 8 }}>Ask the agent on this live page for project <code>{project.id}</code>.</h2><p className="muted" style={{ marginBottom: 0 }}>In a supported WebMCP browser: “Get my BuildCheck analysis for {project.name}, then tell me the smallest thing worth building.” The tool reads only projects in this signed-in demo session.</p></div><Link href="/agents" className="button ghost">WebMCP status <ArrowRight /></Link></div></section>}

      <nav className="report-tabs no-print" aria-label="Report sections">
        {tabs.map((item) => <button key={item.id} className={`report-tab ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </nav>

      {tab === "overview" && <><ScoreBreakdown analysis={analysis} /><Frustrations analysis={analysis} /><section className="card card-pad section"><div className="row between"><div><span className="eyebrow">Next best action</span><h2 style={{ marginTop: 8 }}>{analysis.mvp.scope}</h2><p className="muted" style={{ marginBottom: 0 }}>{analysis.mvp.hypothesis}</p></div><button className="button primary" onClick={() => setTab("mvp")}>Open MVP plan <ArrowRight /></button></div></section></>}
      {tab === "evidence" && <Evidence analysis={analysis} />}
      {tab === "competition" && <Competition analysis={analysis} />}
      {tab === "distribution" && <Distribution analysis={analysis} />}
      {tab === "mvp" && <Mvp project={project} analysis={analysis} />}
      {tab === "pivots" && <Pivots analysis={analysis} />}
      {tab === "tokens" && <TokenRoi analysis={analysis} />}
      {tab === "roast" && <Roast project={project} analysis={analysis} />}
      {tab === "history" && <HistoryTab project={project} />}

      <section className="section no-print" style={{ borderTop: "1px solid var(--border)", paddingTop: 22 }}>
        <div className="row between">
          <div><strong className="tiny">Analysis ID</strong><span className="tiny" style={{ display: "block" }}>{analysis.id}</span></div>
          <button className="button danger" onClick={archive} disabled={archived}>{archived ? <><Check /> Archived</> : <><X /> Archive project</>}</button>
        </div>
      </section>
    </div>
  );
}
