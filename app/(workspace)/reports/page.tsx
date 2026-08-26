"use client";

import Link from "next/link";
import { FileBarChart, Printer } from "lucide-react";
import { useDemoStore } from "@/components/demo-store";
import { PageLoading } from "@/components/loading-state";
import { VerdictBadge } from "@/components/verdict-badge";

export default function ReportsPage() {
  const { projects, loading } = useDemoStore();
  if (loading) return <PageLoading />;
  const reports = projects.flatMap((project) => project.analyses.map((analysis) => ({ project, analysis }))).sort((a, b) => b.analysis.createdAt.localeCompare(a.analysis.createdAt));
  return (
    <div className="page">
      <header className="page-heading"><div><span className="eyebrow">Reports</span><h1>Every analysis, still explainable.</h1><p className="subtitle">Review past decisions and print browser-ready reports. PDF export comes after the product workflow is validated.</p></div><button className="button ghost" onClick={() => window.print()}><Printer /> Print list</button></header>
      {reports.length ? <div className="card">
        {reports.map(({ project, analysis }) => <Link className="project-row" href={`/projects/${project.id}`} key={analysis.id}><div className="project-title"><span className="project-icon"><FileBarChart size={16} /></span><div><strong>{project.name} · v{analysis.version}</strong><span>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(analysis.createdAt))}</span></div></div><span className="score-text">{analysis.buildScore}<span className="tiny"> / 100</span></span><VerdictBadge verdict={analysis.verdict} /><span className="tiny">{analysis.confidenceScore}% conf.</span></Link>)}
      </div> : <div className="card empty-state"><span className="empty-icon"><FileBarChart /></span><h2>No reports yet</h2><p>Analyze your first idea to create a versioned report.</p><Link href="/validate" className="button primary">Analyze an idea</Link></div>}
    </div>
  );
}
