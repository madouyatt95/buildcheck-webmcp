"use client";

import { FormEvent, useState } from "react";
import { Check, Database, RotateCcw, ShieldAlert } from "lucide-react";
import { useDemoStore } from "@/components/demo-store";
import { providerRegistry } from "@/lib/providers/registry";

const sections = ["Profile", "Builder preferences", "AI provider", "Data sources", "Notifications", "Billing", "Danger zone"] as const;
type Section = typeof sections[number];

export default function SettingsPage() {
  const { profile, updateProfile, resetDemo } = useDemoStore();
  const [section, setSection] = useState<Section>("Profile");
  const [firstName, setFirstName] = useState(profile.firstName);
  const [saved, setSaved] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [resetting, setResetting] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    updateProfile({ firstName });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  async function reset() {
    setResetting(true);
    await resetDemo();
    setFirstName("Alex");
    setResetting(false);
  }

  return (
    <div className="page">
      <header className="page-heading"><div><span className="eyebrow">Settings</span><h1>Workspace configuration.</h1><p className="subtitle">Provider boundaries and demo limitations live here, away from the core product workflow.</p></div><span className="badge demo-badge">Demo mode active</span></header>
      <div className="settings-grid">
        <nav className="settings-nav" aria-label="Settings sections">{sections.map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}</nav>
        <section className="card settings-panel">
          {section === "Profile" && <form onSubmit={save}><h2>Profile</h2><p className="muted">Used to personalize the decision workspace.</p><div className="form-grid" style={{ marginTop: 20 }}><div className="field"><label htmlFor="firstName">First name</label><input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div><div className="field"><label htmlFor="email">Email</label><input id="email" value="alex@buildcheck.demo" disabled /></div></div><button className="button primary" style={{ marginTop: 20 }}>{saved ? <><Check /> Saved</> : "Save profile"}</button></form>}
          {section === "Builder preferences" && <><h2>Builder preferences</h2><p className="muted">These guide future opportunity ranking.</p><div className="setting-row"><div><strong>What do you usually build?</strong><p>Primary product category</p></div><select className="filter-select" value={profile.builds} onChange={(event) => updateProfile({ builds: event.target.value })}><option>SaaS</option><option>Mobile apps</option><option>AI tools</option><option>Chrome extensions</option><option>Developer tools</option><option>Marketplaces</option><option>Other</option></select></div><div className="setting-row"><div><strong>Main goal</strong><p>What BuildCheck should optimize for</p></div><select className="filter-select" value={profile.goal} onChange={(event) => updateProfile({ goal: event.target.value })}><option>Find ideas</option><option>Validate my ideas</option><option>Avoid wasting time</option><option>Find better niches</option><option>Build faster</option></select></div></>}
          {section === "AI provider" && <><h2>AI provider</h2><p className="muted">AI may structure or interpret supplied evidence. It never sets the final score or invents market proof.</p>{providerRegistry.ai.map((provider) => <div className="setting-row" key={provider.id}><div className="provider-status"><span className={`dot ${provider.status === "active" ? "active" : ""}`} /><div><strong>{provider.label}</strong><p>{provider.status}{provider.needsKey ? " · server-side key required" : " · no key required"}</p></div></div>{provider.status === "active" ? <span className="badge green">Selected</span> : <button className="button ghost" disabled>Not connected</button>}</div>)}</>}
          {section === "Data sources" && <><h2>Data sources</h2><p className="muted">Sources are integrated one by one. Hacker News and GitHub Issues are optional live adapters; this browser workspace remains mock-first until the server enables them and the user consents.</p>{providerRegistry.dataSources.map((provider) => <div className="setting-row" key={provider.id}><div className="provider-status"><span className={`dot ${provider.status === "active" ? "active" : ""}`} /><div><strong>{provider.label}</strong><p>{provider.status}</p></div></div>{provider.status === "active" ? <span className="badge green">Default</span> : provider.status.startsWith("available") ? <span className="badge orange">Available</span> : <span className="badge">Offline</span>}</div>)}</>}
          {section === "Notifications" && <><h2>Notifications</h2><p className="muted">Notification delivery is local-only in demo mode.</p><div className="setting-row"><div><strong>Analysis complete</strong><p>Notify when an asynchronous analysis finishes</p></div><button className={`toggle ${emailNotifications ? "on" : ""}`} onClick={() => setEmailNotifications((value) => !value)} aria-label="Toggle analysis notifications" /></div><div className="setting-row"><div><strong>Score changes</strong><p>Alert when evidence changes a verdict</p></div><button className="toggle" aria-label="Toggle score change notifications" /></div></>}
          {section === "Billing" && <><h2>Billing</h2><p className="muted">No payment provider is connected.</p><div className="card card-pad" style={{ marginTop: 20, background: "var(--bg-subtle)" }}><Database color="var(--green)" /><h3 style={{ marginTop: 17 }}>Demo plan</h3><p className="muted">Unlimited local demo analyses · Curated signals · No external usage charges</p><button className="button ghost" disabled>Billing coming later</button></div></>}
          {section === "Danger zone" && <><h2>Danger zone</h2><p className="muted">Reset only local browser data. Nothing is sent to a remote backend.</p><div className="setting-row"><div><strong>Reset demo workspace</strong><p>Restore the five seed projects and default profile</p></div><button className="button danger" onClick={reset} disabled={resetting}><RotateCcw /> {resetting ? "Resetting…" : "Reset demo"}</button></div><div className="setting-row"><div className="row"><ShieldAlert color="var(--red)" /><div><strong>Delete account</strong><p>Unavailable because this is not a remote account</p></div></div><button className="button danger" disabled>Delete account</button></div></>}
        </section>
      </div>
    </div>
  );
}
