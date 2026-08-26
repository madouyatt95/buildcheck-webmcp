"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, CircleOff, Code2, Plus, TrendingUp } from "lucide-react";
import { useDemoStore } from "@/components/demo-store";
import { PageLoading } from "@/components/loading-state";
import { VerdictBadge } from "@/components/verdict-badge";
import { demoOpportunities } from "@/lib/demo/seed";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatTokens(value: number) {
  return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : `${Math.round(value / 1000)}K`;
}

export default function DashboardPage() {
  const { projects, profile, loading } = useDemoStore();
  if (loading) return <PageLoading />;

  const current = projects.flatMap((project) => project.analyses.slice(0, 1));
  const buildCandidates = current.filter((analysis) => analysis.buildScore >= 80).length;
  const killed = current.filter((analysis) => analysis.verdict === "KILL").length;
  const average = current.length ? Math.round(current.reduce((sum, analysis) => sum + analysis.buildScore, 0) / current.length) : 0;
  const savedTokens = current
    .filter((analysis) => analysis.verdict === "KILL" || analysis.verdict === "PIVOT")
    .reduce((sum, analysis) => sum + analysis.complexity.estimatedTokens, 0);

  const stats = [
    { label: "Ideas analyzed", value: projects.length, meta: "Across this demo workspace", icon: BrainCircuit },
    { label: "Build candidates", value: buildCandidates, meta: "Score ≥ 80", icon: Code2 },
    { label: "Ideas killed", value: killed, meta: "Score below 40", icon: CircleOff },
    { label: "Average Build Score", value: average, meta: "Weighted, not AI-generated", icon: BarChart3 }
  ];

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Decision workspace</span>
          <h1>Good morning, {profile.firstName}.</h1>
          <p className="subtitle">Five ideas on the table. Only the evidence gets a vote.</p>
        </div>
        <Link href="/validate" className="button primary wide"><Plus /> Validate an idea</Link>
      </header>

      <section className="stat-grid" aria-label="Workspace statistics">
        {stats.map((stat) => (
          <article className="card stat-card" key={stat.label}>
            <div className="stat-top"><span>{stat.label}</span><stat.icon /></div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-meta">{stat.meta}</div>
          </article>
        ))}
      </section>

      <div className="dashboard-grid section">
        <section>
          <div className="section-heading"><div><h2>Recent projects</h2><p>Latest analysis for every active idea</p></div><Link href="/projects" className="button ghost">View all <ArrowRight /></Link></div>
          <div className="card">
            {projects.slice(0, 5).map((project) => {
              const analysis = project.analyses[0];
              if (!analysis) return null;
              const previous = project.analyses[1];
              const trend = previous ? analysis.buildScore - previous.buildScore : 0;
              return (
                <Link href={`/projects/${project.id}`} className="project-row" key={project.id}>
                  <div className="project-title">
                    <span className="project-icon">{project.name.slice(0, 1)}</span>
                    <div><strong>{project.name}</strong><span>{project.tagline}</span></div>
                  </div>
                  <span className="score-text">{analysis.buildScore}<span className="tiny"> / 100</span></span>
                  <VerdictBadge verdict={analysis.verdict} />
                  <span className={trend < 0 ? "trend down" : "trend"}>{trend ? `${trend > 0 ? "+" : ""}${trend}` : formatDate(project.updatedAt)}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="stack">
          <div className="section-heading"><div><h2>Opportunities for you</h2><p>Curated demo dataset</p></div></div>
          <div className="opportunity-list">
            {demoOpportunities.slice(0, 3).map((opportunity) => (
              <Link href={`/discover?focus=${opportunity.slug}`} className="card hoverable opportunity-mini" key={opportunity.id}>
                <div className="row between"><span className="badge">{opportunity.category}</span><strong className="score-text">{opportunity.opportunityScore}</strong></div>
                <h3 style={{ marginTop: 12 }}>{opportunity.title}</h3>
                <p>{opportunity.audience}</p>
                <div className="progress-track"><span style={{ width: `${opportunity.opportunityScore}%` }} /></div>
              </Link>
            ))}
          </div>
        </aside>
      </div>

      <section className="section">
        <article className="card token-card">
          <div className="row between"><span className="eyebrow">Token economics</span><TrendingUp size={18} color="var(--green)" /></div>
          <div className="token-value">{formatTokens(savedTokens || 2_400_000)}</div>
          <h3>estimated coding tokens protected</h3>
          <p className="muted" style={{ maxWidth: 540, fontSize: 12 }}>By deferring weak scopes and testing their riskiest assumption first. This is an implementation estimate, not provider billing data.</p>
        </article>
      </section>
    </div>
  );
}
