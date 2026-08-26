"use client";

import Link from "next/link";
import { FolderKanban, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useDemoStore } from "@/components/demo-store";
import { PageLoading } from "@/components/loading-state";
import { VerdictBadge } from "@/components/verdict-badge";
import type { ProjectStatus } from "@/lib/domain/types";

const filters: Array<{ label: string; value: "all" | ProjectStatus }> = [
  { label: "All", value: "all" }, { label: "Build", value: "build" }, { label: "Validate", value: "validate" }, { label: "Pivot", value: "pivot" }, { label: "Killed", value: "kill" }, { label: "Archived", value: "archived" }
];

export default function ProjectsPage() {
  const { projects, loading } = useDemoStore();
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => projects.filter((project) =>
    (filter === "all" ? project.status !== "archived" : project.status === filter) &&
    `${project.name} ${project.tagline} ${project.targetCustomer}`.toLowerCase().includes(query.toLowerCase())
  ), [projects, filter, query]);
  if (loading) return <PageLoading />;

  return (
    <div className="page">
      <header className="page-heading"><div><span className="eyebrow">Projects</span><h1>Your idea portfolio.</h1><p className="subtitle">Keep every decision, score and re-analysis in one place.</p></div><Link className="button primary wide" href="/validate"><Plus /> New analysis</Link></header>
      <div className="projects-toolbar">
        <div className="tabs">{filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`tab ${filter === item.value ? "active" : ""}`}>{item.label}</button>)}</div>
        <div className="field" style={{ display: "block", width: 210, position: "relative" }}><Search size={14} style={{ position: "absolute", left: 11, top: 13, color: "var(--text-faint)" }} /><input aria-label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" style={{ paddingLeft: 33 }} /></div>
      </div>
      {visible.length ? <div className="projects-grid">{visible.map((project) => {
        const analysis = project.analyses[0];
        if (!analysis) return null;
        return <Link className="card hoverable project-card" href={`/projects/${project.id}`} key={project.id}><span className="project-icon">{project.name.slice(0, 1)}</span><div className="row between"><h3>{project.name}</h3><VerdictBadge verdict={analysis.verdict} /></div><p>{project.tagline}</p><div className="project-score-line"><div><span className="tiny">BUILD SCORE</span><div className="score-text" style={{ fontSize: 22 }}>{analysis.buildScore}</div></div><div style={{ textAlign: "right" }}><span className="tiny">CONFIDENCE</span><div>{analysis.confidenceScore}%</div></div></div></Link>;
      })}</div> : <div className="card empty-state"><span className="empty-icon"><FolderKanban /></span><h2>No projects here</h2><p>There are no ideas matching this status and search query.</p><button className="button primary" onClick={() => { setFilter("all"); setQuery(""); }}>Show all projects</button></div>}
    </div>
  );
}
