"use client";

import { useEffect, useState } from "react";
import { Bot, Check, Clipboard, ExternalLink, Radio, ShieldCheck, TerminalSquare } from "lucide-react";
import { useDemoStore } from "@/components/demo-store";
import { buildCheckToolNames, webMcpToolCatalog } from "@/lib/webmcp/tool-catalog";

interface WebMcpStatus {
  checked: boolean;
  supported: boolean;
  registered: number;
  error?: string;
}

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  return formatter.format(Math.round(minutes / 60), "hour");
}

export default function AgentsPage() {
  const { activities } = useDemoStore();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<WebMcpStatus>({ checked: false, supported: false, registered: 0 });

  useEffect(() => {
    function onStatus(event: WindowEventMap["buildcheck:webmcp-status"]) {
      setStatus({ checked: true, ...event.detail });
    }
    window.addEventListener("buildcheck:webmcp-status", onStatus);
    const context = document.modelContext;
    if (typeof context?.getTools === "function") {
      void context.getTools().then((tools) => {
        setStatus({ checked: true, supported: true, registered: tools.filter((tool) => buildCheckToolNames.has(tool.name)).length });
      }).catch((error: unknown) => setStatus({ checked: true, supported: true, registered: 0, error: error instanceof Error ? error.message : "Inspection failed" }));
    } else {
      queueMicrotask(() => setStatus({ checked: true, supported: false, registered: 0 }));
    }
    return () => window.removeEventListener("buildcheck:webmcp-status", onStatus);
  }, []);

  async function copyPrompt() {
    await navigator.clipboard.writeText("Should I build an AI CRM for freelancers? Use BuildCheck before writing code.");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const available = status.supported && status.registered > 0;
  return (
    <div className="page">
      <header className="page-heading">
        <div><span className="eyebrow">Agents · WebMCP</span><h1>Give your coding agent permission to say no.</h1><p className="subtitle">BuildCheck is the pre-build decision layer: should we build, what must we validate, and what is the smallest thing worth coding?</p></div>
        <span className={`agent-status ${available ? "available" : "unavailable"}`}><span className="dot" />{!status.checked ? "Checking WebMCP…" : available ? `${status.registered} site tools available` : status.supported ? "WebMCP detected · registration unavailable" : "WebMCP unavailable in this browser"}</span>
      </header>

      <section className="card agent-hero">
        <div className="row between" style={{ alignItems: "flex-start" }}><div><span className="eyebrow">Experimental open standard</span><h2 style={{ marginTop: 8 }}>Connect BuildCheck to the agent viewing this page.</h2><p className="muted" style={{ maxWidth: 720 }}>The native <code>document.modelContext</code> API is feature-detected. In a supported secure browser, the seven tools below are registered against this live page and current demo session. No remote MCP server is being simulated.</p></div><Radio color={available ? "var(--green)" : "var(--orange)"} /></div>
        <div className="agent-flow" aria-label="Pre-build agent flow">
          {["User intent", "Coding agent", "BuildCheck evidence", "Build / Validate / Pivot / Kill", "Minimum code worth building"].map((label, index) => <div className="agent-flow-step" key={label}><span>Step {index + 1}</span><strong>{label}</strong></div>)}
        </div>
      </section>

      <section className="section">
        <div className="section-heading"><div><h2>Available site tools</h2><p>Narrow inputs, structured JSON outputs and explicit read/write annotations</p></div><span className="badge orange">Experimental WebMCP</span></div>
        <div className="tool-grid">{webMcpToolCatalog.map((tool) => <article className="card tool-card" key={tool.name}><div className="row between"><code className="tool-name">{tool.name}</code><span className={`badge ${tool.access === "write" ? "orange" : "green"}`}>{tool.access}</span></div><p>{tool.description}</p><div className="tool-example">“{tool.example}”</div></article>)}</div>
      </section>

      <div className="dashboard-grid section">
        <section className="card card-pad">
          <span className="eyebrow">Try the challenge story</span><h2 style={{ marginTop: 8 }}>One prompt, before any code.</h2><p className="muted">Open this deployed page in ChatGPT’s in-app browser, inspect Site tools in the address bar, then ask:</p><div className="tool-example" style={{ fontSize: 12, padding: 14 }}>Should I build an AI CRM for freelancers? Use BuildCheck before writing code.</div><button className="button primary" style={{ marginTop: 14 }} onClick={copyPrompt}>{copied ? <><Check /> Copied</> : <><Clipboard /> Copy demo prompt</>}</button>
        </section>
        <section className="card card-pad">
          <span className="eyebrow">Current boundary</span><h2 style={{ marginTop: 8 }}>Page-bound, not background MCP.</h2><ul className="clean-list"><li>Requires a secure context and supported browser</li><li>Tools belong to the open page</li><li>Demo state stays in this browser</li><li>Supabase continuity is schema-ready, not connected</li></ul><a className="button ghost" style={{ marginTop: 16 }} href="https://learn.chatgpt.com/docs/webmcp" target="_blank" rel="noreferrer">Official WebMCP docs <ExternalLink /></a>
        </section>
      </div>

      <section className="section">
        <div className="section-heading"><div><h2>Agent activity</h2><p>Local structured audit stream — no prompts, secrets or raw inputs are logged</p></div><ShieldCheck size={18} color="var(--green)" /></div>
        <div className="card activity-list">{activities.length ? activities.slice(0, 8).map((activity) => <div className="activity-row" key={activity.id}><span className="activity-icon"><Bot size={15} /></span><div><strong>{activity.tool}</strong><span className="tiny" style={{ display: "block" }}>{activity.projectId ? `Project ${activity.projectId}` : "Workspace tool call"} · {activity.outcome}</span></div><span className="tiny">{relativeTime(activity.createdAt)}</span></div>) : <div className="empty-state"><span className="empty-icon"><TerminalSquare /></span><h3>No agent calls yet</h3><p>Activity appears here after a compatible browser invokes a BuildCheck site tool.</p></div>}</div>
      </section>
    </div>
  );
}
