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
import { useLanguage } from "@/components/language-provider";

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

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { notation: value >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function ScoreBreakdown({ analysis }: { analysis: Analysis }) {
  const { t } = useLanguage();
  return (
    <section className="section">
      <div className="section-heading"><div><h2>{t("Score breakdown")}</h2><p>{t("Seven independent dimensions, weighted to exactly 100 points")}</p></div></div>
      <div className="score-grid">
        {analysis.dimensions.map((dimension) => (
          <article className="card score-dimension" key={dimension.key}>
            <div className="dimension-head"><h3>{t(dimension.label)}</h3><span className="dimension-value">{dimension.score.toFixed(1)} <span className="tiny">/ 10 · {dimension.weightedPoints}/{dimension.maxPoints} pts</span></span></div>
            <p>{t(dimension.justification)}</p>
            <div className="progress-track"><span style={{ width: `${dimension.score * 10}%` }} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Frustrations({ analysis }: { analysis: Analysis }) {
  const { t } = useLanguage();
  return (
    <section className="section">
      <div className="section-heading"><div><h2>{t("Top user frustrations")}</h2><p>{t("Frequency is simulated from the demo discovery sample")}</p></div></div>
      <div className="frustration-list">
        {analysis.frustrations.map((frustration) => (
          <article className="card frustration" key={frustration.label}>
            <strong>{t(frustration.label)}</strong>
            <span className="frustration-meta">{frustration.mentions} {t("mentions")} · {t(frustration.intensity)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Evidence({ analysis }: { analysis: Analysis }) {
  const { t } = useLanguage();
  const complaintCount = analysis.signals.filter((signal) => ["pain", "competitor_complaint", "churn_risk"].includes(signal.signalType)).length;
  const paymentCount = analysis.signals.filter((signal) => signal.signalType === "willingness_to_pay").length;
  const sources = new Set(analysis.signals.map((signal) => signal.source)).size;
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">{t("Evidence, not vibes.")}</span><h2 style={{ marginTop: 7 }}>{t("Observable signals behind the score")}</h2><p>{t(analysis.isDemo ? "Every item below belongs to the curated demo dataset — none came from a live platform." : "Every item below links to the observed public discussion. Classification and scoring remain deterministic interpretations.")}</p></div><span className={`badge ${analysis.isDemo ? "demo-badge" : "green"}`}>{t(analysis.evidenceMeta?.mode === "fallback" ? "Demo fallback" : analysis.isDemo ? "Simulated dataset" : "Observed public source")}</span></div>
        <div className="evidence-stats">
          {[
            [analysis.signals.length, "signals"], [sources, "source groups"], [analysis.competitors.length, "competitors"], [complaintCount, "complaints"], [paymentCount, "payment signals"]
          ].map(([value, label]) => <div className="card evidence-stat" key={label}><strong>{value}</strong><span>{t(String(label))}</span></div>)}
        </div>
        <div className="evidence-grid">
          {analysis.signals.map((signal) => (
            <article className="card evidence-card" key={signal.id}>
              <div className="evidence-source"><strong>{t(signal.source)}</strong><span className={`badge ${signal.isDemo ? "demo-badge" : "green"}`}>{t(signal.isDemo ? "Demo" : "Observed")}</span></div>
              <h3>{t(signal.title)}</h3>
              <blockquote>“{t(signal.excerpt)}”</blockquote>
              <div className="evidence-meta"><span className="badge">{t(signal.signalType.replaceAll("_", " "))}</span><span className={`badge ${signal.strength === "strong" ? "green" : signal.strength === "weak" ? "red" : "orange"}`}>{t(signal.strength)}</span></div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Competition({ analysis }: { analysis: Analysis }) {
  const { t, locale } = useLanguage();
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><h2>{t("Competitive landscape")}</h2><p>{t("Alternatives validate the category; their repeated weaknesses define the wedge.")}</p></div><span className="badge demo-badge">{analysis.competitors.length} {t("demo competitors")}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Name")}</th><th>{t("Positioning")}</th><th>{t("Pricing")}</th><th>{t("Strengths")}</th><th>{t("Weaknesses")}</th><th>{t("Opportunity")}</th></tr></thead>
            <tbody>{analysis.competitors.map((competitor) => <tr key={competitor.id}><td><strong>{t(competitor.name)}</strong><br />{t(competitor.targetAudience)}</td><td>{t(competitor.positioning)}</td><td>{t(competitor.pricing)}</td><td>{competitor.strengths.map(t).join(", ")}</td><td>{competitor.weaknesses.map(t).join(", ")}</td><td>{t(competitor.opportunity)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="section">
        <div className="section-heading"><div><h2>{t("Opportunity matrix")}</h2><p>{t("Qualitative placement from this dataset, not a market-size model")}</p></div></div>
        <div className="matrix">
          <div className="matrix-cell"><span className="tiny">{t("HIGH COMPETITION · LOW OPPORTUNITY")}</span><h3 style={{ marginTop: 10 }}>{t("Feature-for-feature clone")}</h3><p>{t("Incumbents win on breadth and distribution.")}</p></div>
          <div className="matrix-cell highlight"><span className="tiny">{t("HIGH COMPETITION · HIGH OPPORTUNITY")}</span><h3 style={{ marginTop: 10 }}>{t("Focused workflow wedge")}</h3><p>{t("Users pay already but complain about complexity and poor segment fit.")}</p></div>
          <div className="matrix-cell"><span className="tiny">{t("LOW COMPETITION · LOW DEMAND")}</span><h3 style={{ marginTop: 10 }}>{t("Category creation")}</h3><p>{t("Avoid until problem frequency and budget are proven.")}</p></div>
          <div className="matrix-cell"><span className="tiny">{t("LOW COMPETITION · HIGH OPPORTUNITY")}</span><h3 style={{ marginTop: 10 }}>{t("Manual-first vertical")}</h3><p>{t("Best explored with a paid concierge offer.")}</p></div>
        </div>
      </section>
      <section className="card card-pad section">
        <span className="eyebrow">{t("Market gap")}</span>
        <h2 style={{ marginTop: 9 }}>{t("Win through a narrower operating model, not more features.")}</h2>
        <p className="muted" style={{ marginBottom: 0 }}>{t("The category has alternatives, but demo evidence consistently penalizes broad setup and pricing.")} {locale === "fr" ? `Le résultat léger destiné à ${t(analysis.competitors[0]?.targetAudience.toLowerCase() || "one vertical")} constitue l’angle le plus clair à tester.` : `A lightweight outcome for ${analysis.competitors[0]?.targetAudience.toLowerCase() || "one vertical"} is the clearest wedge to test.`}</p>
      </section>
    </>
  );
}

function Distribution({ analysis }: { analysis: Analysis }) {
  const { t } = useLanguage();
  const score = analysis.dimensions.find((dimension) => dimension.key === "distribution")?.score || 0;
  const first = analysis.channels[0];
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">{t("Can you actually reach these people?")}</span><h2 style={{ marginTop: 7 }}>{t("Distribution score")}: {score.toFixed(1)} / 10</h2><p>{t("A market is only useful when an early channel is specific, accessible and repeatable.")}</p></div></div>
        <div className="channel-grid">
          {analysis.channels.map((channel) => (
            <article className="card channel-card" key={channel.name}>
              <div className="row between"><h3>{t(channel.name)}</h3><span className={`badge ${channel.potential === "Strong" ? "green" : channel.potential === "Low" ? "red" : "orange"}`}>{t(channel.potential)}</span></div>
              <strong className="tiny">{t(channel.detail)}</strong>
              <p>{t(channel.rationale)}</p>
            </article>
          ))}
        </div>
      </section>
      {first && <section className="card card-pad section"><span className="eyebrow">{t("Best first acquisition channel")}</span><h2 style={{ marginTop: 8 }}>{t(first.name)}</h2><p className="muted" style={{ marginBottom: 0 }}>{t(first.rationale)} {t("Start with conversations and paid pilots, not scale.")}</p></section>}
      <section className="section">
        <div className="section-heading"><div><h2>{t("How to get your first 100 users")}</h2><p>{t("A proof-led sequence that begins manually")}</p></div></div>
        <div className="numbered-plan">{analysis.firstHundredUsers.map((item, index) => <article className="card plan-step" key={item}><span className="plan-number">{index + 1}</span><span>{t(item)}</span></article>)}</div>
      </section>
    </>
  );
}

function Mvp({ project, analysis }: { project: Project; analysis: Analysis }) {
  const [generated, setGenerated] = useState(false);
  const { t } = useLanguage();
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">{t("Do you really need to build all of this?")}</span><h2 style={{ marginTop: 7 }}>{t("Cut scope until the riskiest assumption is exposed.")}</h2></div></div>
        <div className="mvp-compare">
          <article className="card mvp-card"><span className="tiny">{t("ORIGINAL CONCEPT")}</span><h3 style={{ marginTop: 11 }}>{t(project.name)}</h3><p className="muted">{t(project.description)}</p><div className="metric-line"><span>{t("Complexity")}</span><strong>{t(analysis.complexity.level)}</strong></div><div className="metric-line"><span>{t("Potential build")}</span><strong>{analysis.complexity.estimatedHours[0]}–{analysis.complexity.estimatedHours[1]}h</strong></div></article>
          <div className="compare-arrow"><ArrowRight /></div>
          <article className="card mvp-card recommended"><div className="row between"><span className="tiny">{t("MINIMUM TESTABLE VERSION")}</span><span className="badge green">{t("Recommended")}</span></div><h3 style={{ marginTop: 11 }}>{t(analysis.mvp.scope)}</h3><ul className="clean-list">{analysis.mvp.include.map((item) => <li key={item}>{t(item)}</li>)}</ul><div className="metric-line"><span>{t("Estimated build")}</span><strong>{t(analysis.mvp.estimatedHours)}</strong></div></article>
        </div>
      </section>
      <section className="card card-pad section">
        <div className="row between"><div><span className="eyebrow">{t("Test hypothesis")}</span><h2 style={{ marginTop: 8, maxWidth: 720 }}>{t(analysis.mvp.hypothesis)}</h2></div><Target color="var(--green)" /></div>
        <div className="score-grid" style={{ marginTop: 17 }}>
          <div><h3>{t("Include")}</h3><ul className="clean-list">{analysis.mvp.include.map((item) => <li key={item}>{t(item)}</li>)}</ul></div>
          <div><h3>{t("Explicitly exclude")}</h3><ul className="clean-list">{analysis.mvp.exclude.map((item) => <li key={item}>{t(item)}</li>)}</ul></div>
        </div>
        <h3 style={{ marginTop: 25 }}>{t("Success criteria")}</h3>
        <div className="row" style={{ flexWrap: "wrap", marginTop: 10 }}>{analysis.mvp.successCriteria.map((item) => <span className="badge" key={item}><Check size={11} /> {t(item)}</span>)}</div>
        <button className="button primary" style={{ marginTop: 23 }} onClick={() => setGenerated(true)}><Sparkles /> {t(generated ? "Validation MVP generated" : "Generate validation MVP")}</button>
        {generated && <p role="status" className="muted" style={{ margin: "13px 0 0", fontSize: 12 }}>{t("Scope locked in this demo session. The next production step would persist it to")} <code>mvp_recommendations</code>.</p>}
      </section>
    </>
  );
}

function Pivots({ analysis }: { analysis: Analysis }) {
  const { t } = useLanguage();
  return (
    <section className="section">
      <div className="section-heading"><div><h2>{t("Possible pivots")}</h2><p>{t("Narrower concepts inferred only from the supplied idea and demo evidence")}</p></div></div>
      <div className="pivot-grid">{analysis.pivots.map((pivot) => <article className="card pivot-card" key={pivot.concept}><div className="row between"><div className="row"><span className="badge">{t("Potential score")}</span><span className="badge orange">{t("Hypothetical")}</span></div><span className="pivot-score">{pivot.estimatedScore}</span></div><h3 style={{ marginTop: 20 }}>{t(pivot.concept)}</h3><p className="muted">{t("For")} {t(pivot.targetAudience)}</p><p style={{ fontSize: 12 }}>{t(pivot.whyStronger)}</p><div className="badge green" style={{ whiteSpace: "normal", height: "auto", paddingBlock: 6 }}>{t(pivot.keyDifference)}</div></article>)}</div>
    </section>
  );
}

function TokenRoi({ analysis }: { analysis: Analysis }) {
  const [minimum, maximum] = analysis.complexity.estimatedHours;
  const { t, localeCode } = useLanguage();
  return (
    <>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">{t("Token economics")}</span><h2 style={{ marginTop: 7 }}>{t("What coding this concept could consume")}</h2><p>{t("Directional engineering estimate based on scope, not an API invoice.")}</p></div></div>
        <div className="token-grid">
          <article className="card token-metric"><span className="tiny">{t("AI CODING USAGE")}</span><strong>{formatNumber(analysis.complexity.estimatedTokens, localeCode)} tokens</strong></article>
          <article className="card token-metric"><span className="tiny">{t("DEBUG ITERATIONS")}</span><strong>≈ {analysis.complexity.debuggingIterations}</strong></article>
          <article className="card token-metric"><span className="tiny">{t("BUILD COMPLEXITY")}</span><strong>{t(analysis.complexity.level)}</strong></article>
          <article className="card token-metric"><span className="tiny">{t("BUILD EFFORT")}</span><strong>{minimum}–{maximum}h</strong></article>
        </div>
      </section>
      <section className={`card card-pad section ${analysis.confidenceScore < 60 ? "roast-card" : ""}`}>
        <span className="eyebrow">{t("Recommendation")}</span>
        <h2 style={{ marginTop: 9 }}>{t(analysis.confidenceScore < 60 ? "Do not spend these tokens yet." : "Spend only enough to run the validation MVP.")}</h2>
        <p className="muted" style={{ marginBottom: 0 }}>{t("Confidence is")} {analysis.confidenceScore}%. {t("Resolve the riskiest unknown with a test before committing to the full build.")} ({t(analysis.mvp.estimatedHours)} → {minimum}–{maximum} h)</p>
      </section>
    </>
  );
}

function Roast({ project, analysis }: { project: Project; analysis: Analysis }) {
  const { t, locale } = useLanguage();
  return (
    <>
      <section className="card card-pad roast-card section">
        <div className="row between"><div><span className="eyebrow" style={{ color: "var(--red)" }}>{t("Adversarial review")}</span><h2 style={{ marginTop: 8 }}>{locale === "fr" ? `Essayons de démonter ${t(project.name)}.` : `Let’s try to kill ${project.name}.`}</h2></div><Flame color="var(--red)" /></div>
        <p className="muted">{t("These are failure hypotheses, not invented evidence. Each one should become a cheap test.")}</p>
      </section>
      <div className="roast-grid section">
        <section className="card card-pad"><h2>{t("Reasons this could fail")}</h2><ol className="risk-list">{analysis.roast.risks.map((risk) => <li key={risk}>{t(risk)}</li>)}</ol></section>
        <section className="card card-pad"><h2>{t("What would change our mind?")}</h2><ul className="clean-list">{analysis.roast.changeOurMind.map((item) => <li key={item}>{t(item)}</li>)}</ul></section>
      </div>
      <section className="card card-pad section">
        <div className="row between"><div><span className="eyebrow">{t("Better angle detected")}</span><h2 style={{ marginTop: 8, maxWidth: 760 }}>{t(analysis.roast.betterAngle)}</h2></div><div style={{ textAlign: "right" }}><span className="tiny">{t("POTENTIAL SCORE")}</span><div className="pivot-score">{analysis.roast.estimatedScore}</div></div></div>
      </section>
    </>
  );
}

function HistoryTab({ project }: { project: Project }) {
  const { t, localeCode } = useLanguage();
  return (
    <section className="section">
      <div className="section-heading"><div><h2>{t("Immutable analysis history")}</h2><p>{t("Re-analysis appends a version; prior verdicts remain available.")}</p></div></div>
      <div className="stack">{project.analyses.map((analysis, index) => {
        const previous = project.analyses[index + 1];
        const delta = previous ? analysis.buildScore - previous.buildScore : 0;
        return <article className="card card-pad row between" key={analysis.id}><div className="row"><span className="project-icon"><History size={17} /></span><div><strong>{t(`Analysis v${analysis.version}`)}</strong><span className="tiny" style={{ display: "block" }}>{formatDate(analysis.createdAt, localeCode)} · {analysis.signals.length} {t("signals")}</span></div></div><div className="row"><VerdictBadge verdict={analysis.verdict} /><strong>{analysis.buildScore}</strong>{previous && <span className={delta < 0 ? "trend down" : "trend"}>{delta > 0 ? "+" : ""}{delta}</span>}</div></article>;
      })}</div>
    </section>
  );
}

export function ProjectReport({ projectId, initialTab = "overview" }: { projectId: string; initialTab?: string }) {
  const { projects, loading, reanalyze, archiveProject } = useDemoStore();
  const { t, locale } = useLanguage();
  const allowedInitial = tabs.some((item) => item.id === initialTab) ? initialTab as Tab : "overview";
  const [tab, setTab] = useState<Tab>(allowedInitial);
  const [running, setRunning] = useState(false);
  const [archived, setArchived] = useState(false);
  const [showAgentGuide, setShowAgentGuide] = useState(false);
  const project = projects.find((item) => item.id === projectId);

  if (loading) return <PageLoading />;
  if (!project) return <div className="page"><div className="card empty-state"><span className="empty-icon"><AlertTriangle /></span><h2>{t("Project not found")}</h2><p>{t("This idea is not in the current demo workspace. Local demo data may have been reset.")}</p><Link href="/projects" className="button primary">{t("Back to projects")}</Link></div></div>;
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
        <Link href="/projects" className="tiny">{t("Projects")} <ChevronRight size={11} style={{ verticalAlign: "middle" }} /> {t(project.name)}</Link>
        <div className="row report-toolbar-actions">
          <button className="button ghost" onClick={() => setShowAgentGuide((value) => !value)}><Bot /> {t("Use with agent")}</button>
          <button className="button ghost" onClick={() => window.print()}><Printer /> {t("Print")}</button>
          <button className="button ghost" onClick={runAgain} disabled={running}><RefreshCw className={running ? "spin" : ""} /> {t(running ? "Analyzing…" : "Re-analyze")}</button>
        </div>
      </div>

      <header className="card report-hero">
        <div>
          <div className="row" style={{ marginBottom: 12 }}><VerdictBadge verdict={analysis.verdict} /><span className={`badge ${analysis.isDemo ? "demo-badge" : "green"}`}>{t(analysis.evidenceMeta?.mode === "fallback" ? "Demo fallback" : analysis.isDemo ? "Demo evidence" : "Observed evidence")}</span>{agentReady && <span className="badge green"><Bot size={11} /> {t("Agent Ready")}</span>}<span className="tiny">{t(`Analysis v${analysis.version}`)}</span></div>
          <h1>{t(project.name)}</h1>
          <p className="subtitle">{t(project.tagline)}</p>
          <p className="report-summary">{t(analysis.summary)}</p>
          <div className="confidence"><ShieldCheck size={15} color="var(--purple)" /><strong>{t("Confidence")}{locale === "fr" ? " :" : ":"} {analysis.confidenceScore}%</strong><span className="confidence-bar"><span style={{ width: `${analysis.confidenceScore}%` }} /></span>{analysis.confidenceScore < 60 && <span>{t("Promising, but insufficient evidence.")}</span>}</div>
        </div>
        <div className="report-score-panel">
          <ScoreRing score={analysis.buildScore} />
          <div className="prebuild-decision">
            <span>{t("Pre-build decision")}</span>
            <strong>{t(analysis.verdict)}</strong>
            <p>{locale === "fr" ? `Avant la construction complète, validez l’hypothèse la plus risquée : ${t(weakestMarketDimension?.label || "the riskiest assumption").toLowerCase()}.` : `Before the full build, validate ${weakestMarketDimension?.label.toLowerCase() || "the riskiest assumption"}.`}</p>
            <div className="prebuild-actions"><button className="button primary" onClick={() => setTab("mvp")}>{t("Generate MVP")}</button><button className="button ghost" onClick={() => setTab("evidence")}>{t("View evidence")}</button></div>
          </div>
        </div>
      </header>

      {showAgentGuide && <section className="card card-pad agent-guide section no-print"><div className="row between"><div><span className="eyebrow">{t("Use with agent")}</span><h2 style={{ marginTop: 8 }}>{t("Ask the agent on this live page for project")} <code>{project.id}</code>.</h2><p className="muted" style={{ marginBottom: 0 }}>{locale === "fr" ? `Dans un navigateur WebMCP compatible : « Récupère mon analyse BuildCheck pour ${t(project.name)}, puis indique-moi la plus petite chose qui mérite d’être construite. » L’outil lit uniquement les projets de cette session de démonstration connectée.` : `In a supported WebMCP browser: “Get my BuildCheck analysis for ${project.name}, then tell me the smallest thing worth building.” The tool reads only projects in this signed-in demo session.`}</p></div><Link href="/agents" className="button ghost">{t("WebMCP status")} <ArrowRight /></Link></div></section>}

      <nav className="report-tabs no-print" aria-label={t("Report sections")}>
        {tabs.map((item) => <button key={item.id} className={`report-tab ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>{t(item.label)}</button>)}
      </nav>

      {tab === "overview" && <><ScoreBreakdown analysis={analysis} /><Frustrations analysis={analysis} /><section className="card card-pad section"><div className="row between"><div><span className="eyebrow">{t("Next best action")}</span><h2 style={{ marginTop: 8 }}>{t(analysis.mvp.scope)}</h2><p className="muted" style={{ marginBottom: 0 }}>{t(analysis.mvp.hypothesis)}</p></div><button className="button primary" onClick={() => setTab("mvp")}>{t("Open MVP plan")} <ArrowRight /></button></div></section></>}
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
          <div><strong className="tiny">{t("Analysis ID")}</strong><span className="tiny" style={{ display: "block" }}>{analysis.id}</span></div>
          <button className="button danger" onClick={archive} disabled={archived}>{archived ? <><Check /> {t("Archived")}</> : <><X /> {t("Archive project")}</>}</button>
        </div>
      </section>
    </div>
  );
}
