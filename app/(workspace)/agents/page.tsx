"use client";

import { useEffect, useState } from "react";
import { Bot, Check, Clipboard, ExternalLink, Radio, ShieldCheck, TerminalSquare } from "lucide-react";
import { useDemoStore } from "@/components/demo-store";
import { buildCheckToolNames, webMcpToolCatalog } from "@/lib/webmcp/tool-catalog";
import { useLanguage } from "@/components/language-provider";

interface WebMcpStatus {
  checked: boolean;
  supported: boolean;
  registered: number;
  error?: string;
}

function relativeTime(value: string, locale: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  return formatter.format(Math.round(minutes / 60), "hour");
}

export default function AgentsPage() {
  const { activities } = useDemoStore();
  const { t, localeCode, locale } = useLanguage();
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
      }).catch((error: unknown) => setStatus({ checked: true, supported: true, registered: 0, error: error instanceof Error ? error.message : t("Inspection failed") }));
    } else {
      queueMicrotask(() => setStatus({ checked: true, supported: false, registered: 0 }));
    }
    return () => window.removeEventListener("buildcheck:webmcp-status", onStatus);
  }, [t]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(locale === "fr" ? "Devrais-je construire un CRM IA pour les freelances ? Utilise BuildCheck avant d’écrire du code." : "Should I build an AI CRM for freelancers? Use BuildCheck before writing code.");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const available = status.supported && status.registered > 0;
  return (
    <div className="page">
      <header className="page-heading">
        <div><span className="eyebrow">Agents · WebMCP</span><h1>{t("Give your coding agent permission to say no.")}</h1><p className="subtitle">{t("BuildCheck is the pre-build decision layer: should we build, what must we validate, and what is the smallest thing worth coding?")}</p></div>
        <span className={`agent-status ${available ? "available" : "unavailable"}`}><span className="dot" />{!status.checked ? t("Checking WebMCP…") : available ? t(`${status.registered} site tools available`) : status.supported ? t("WebMCP detected · registration unavailable") : t("WebMCP unavailable in this browser")}</span>
      </header>

      <section className="card agent-hero">
        <div className="row between" style={{ alignItems: "flex-start" }}><div><span className="eyebrow">{t("Experimental open standard")}</span><h2 style={{ marginTop: 8 }}>{t("Connect BuildCheck to the agent viewing this page.")}</h2><p className="muted" style={{ maxWidth: 720 }}>{t("The native")} <code>document.modelContext</code> {t("API is feature-detected. In a supported secure browser, the seven tools below are registered against this live page and current demo session. No remote MCP server is being simulated.")}</p></div><Radio color={available ? "var(--green)" : "var(--orange)"} /></div>
        <div className="agent-flow" aria-label={t("Pre-build agent flow")}>
          {["User intent", "Coding agent", "BuildCheck evidence", "Build / Validate / Pivot / Kill", "Minimum code worth building"].map((label, index) => <div className="agent-flow-step" key={label}><span>{t("Step")} {index + 1}</span><strong>{t(label)}</strong></div>)}
        </div>
      </section>

      <section className="card card-pad section">
        <div className="row between challenge-setup-head" style={{ alignItems: "flex-start" }}>
          <div>
            <span className="eyebrow">{t("Challenge-ready setup")}</span>
            <h2 style={{ marginTop: 8 }}>{t("Use the supported Site tools environment.")}</h2>
            <p className="muted" style={{ maxWidth: 760, marginBottom: 0 }}>{t("Use the latest ChatGPT desktop app with GPT-5.6 Sol or Terra. Keep Site tools enabled in Settings → Browser → Permissions.")}</p>
          </div>
          <span className="badge green"><Check size={13} /> {t("7/7 tool contracts tested")}</span>
        </div>
        <ul className="clean-list">
          <li>{t("Open this /agents page in the built-in browser")}</li>
          <li>{t("Inspect Available site tools in the address bar")}</li>
          <li>{t("Run the demo prompt before allowing any code")}</li>
          <li>{t("Availability still depends on the current OpenAI rollout and workspace type")}</li>
        </ul>
      </section>

      <section className="section">
        <div className="section-heading"><div><h2>{t("Available site tools")}</h2><p>{t("Narrow inputs, structured JSON outputs and explicit read/write annotations")}</p></div><span className="badge orange">{t("Experimental WebMCP")}</span></div>
        <div className="tool-grid">{webMcpToolCatalog.map((tool) => <article className="card tool-card" key={tool.name}><div className="row between"><code className="tool-name">{tool.name}</code><span className={`badge ${tool.access === "write" ? "orange" : "green"}`}>{t(tool.access)}</span></div><p>{t(tool.description)}</p><div className="tool-example">“{t(tool.example)}”</div></article>)}</div>
      </section>

      <div className="dashboard-grid section">
        <section className="card card-pad">
          <span className="eyebrow">{t("Try the challenge story")}</span><h2 style={{ marginTop: 8 }}>{t("One prompt, before any code.")}</h2><p className="muted">{t("Open this deployed page in ChatGPT’s in-app browser, inspect Site tools in the address bar, then ask:")}</p><div className="tool-example" style={{ fontSize: 12, padding: 14 }}>{t("Should I build an AI CRM for freelancers? Use BuildCheck before writing code.")}</div><button className="button primary" style={{ marginTop: 14 }} onClick={copyPrompt}>{copied ? <><Check /> {t("Copied")}</> : <><Clipboard /> {t("Copy demo prompt")}</>}</button>
        </section>
        <section className="card card-pad">
          <span className="eyebrow">{t("Current boundary")}</span><h2 style={{ marginTop: 8 }}>{t("Page-bound, not background MCP.")}</h2><ul className="clean-list"><li>{t("Requires a secure context and supported browser")}</li><li>{t("Tools belong to the open page")}</li><li>{t("Demo state stays in this browser")}</li><li>{t("Supabase continuity is schema-ready, not connected")}</li></ul><a className="button ghost" style={{ marginTop: 16 }} href="https://learn.chatgpt.com/docs/webmcp" target="_blank" rel="noreferrer">{t("Official WebMCP docs")} <ExternalLink /></a>
        </section>
      </div>

      <section className="section">
        <div className="section-heading"><div><h2>{t("Agent activity")}</h2><p>{t("Local structured audit stream — no prompts, secrets or raw inputs are logged")}</p></div><ShieldCheck size={18} color="var(--green)" /></div>
        <div className="card activity-list">{activities.length ? activities.slice(0, 8).map((activity) => <div className="activity-row" key={activity.id}><span className="activity-icon"><Bot size={15} /></span><div><strong>{activity.tool}</strong><span className="tiny" style={{ display: "block" }}>{activity.projectId ? t(`Project ${activity.projectId}`) : t("Workspace tool call")} · {t(activity.outcome)}</span></div><span className="tiny">{relativeTime(activity.createdAt, localeCode)}</span></div>) : <div className="empty-state"><span className="empty-icon"><TerminalSquare /></span><h3>{t("No agent calls yet")}</h3><p>{t("Activity appears here after a compatible browser invokes a BuildCheck site tool.")}</p></div>}</div>
      </section>
    </div>
  );
}
