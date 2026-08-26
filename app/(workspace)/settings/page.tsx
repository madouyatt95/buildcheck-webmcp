"use client";

import { FormEvent, useState } from "react";
import { Check, Database, RotateCcw, ShieldAlert } from "lucide-react";
import { useDemoStore } from "@/components/demo-store";
import { providerRegistry } from "@/lib/providers/registry";
import { useLanguage } from "@/components/language-provider";

const sections = ["Profile", "Builder preferences", "Language", "AI provider", "Data sources", "Notifications", "Billing", "Danger zone"] as const;
type Section = typeof sections[number];

export default function SettingsPage() {
  const { profile, updateProfile, resetDemo } = useDemoStore();
  const { locale, setLocale, t } = useLanguage();
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
      <header className="page-heading"><div><span className="eyebrow">{t("Settings")}</span><h1>{t("Workspace configuration.")}</h1><p className="subtitle">{t("Provider boundaries and demo limitations live here, away from the core product workflow.")}</p></div><span className="badge demo-badge">{t("Demo mode active")}</span></header>
      <div className="settings-grid">
        <nav className="settings-nav" aria-label={t("Settings sections")}>{sections.map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{t(item)}</button>)}</nav>
        <section className="card settings-panel">
          {section === "Profile" && <form onSubmit={save}><h2>{t("Profile")}</h2><p className="muted">{t("Used to personalize the decision workspace.")}</p><div className="form-grid" style={{ marginTop: 20 }}><div className="field"><label htmlFor="firstName">{t("First name")}</label><input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div><div className="field"><label htmlFor="email">{t("Email")}</label><input id="email" value="alex@buildcheck.demo" disabled /></div></div><button className="button primary" style={{ marginTop: 20 }}>{saved ? <><Check /> {t("Saved")}</> : t("Save profile")}</button></form>}
          {section === "Builder preferences" && <><h2>{t("Builder preferences")}</h2><p className="muted">{t("These guide future opportunity ranking.")}</p><div className="setting-row"><div><strong>{t("What do you usually build?")}</strong><p>{t("Primary product category")}</p></div><select className="filter-select" value={profile.builds} onChange={(event) => updateProfile({ builds: event.target.value })}>{["SaaS", "Mobile apps", "AI tools", "Chrome extensions", "Developer tools", "Marketplaces", "Other"].map((option) => <option value={option} key={option}>{t(option)}</option>)}</select></div><div className="setting-row"><div><strong>{t("Main goal")}</strong><p>{t("What BuildCheck should optimize for")}</p></div><select className="filter-select" value={profile.goal} onChange={(event) => updateProfile({ goal: event.target.value })}>{["Find ideas", "Validate my ideas", "Avoid wasting time", "Find better niches", "Build faster"].map((option) => <option value={option} key={option}>{t(option)}</option>)}</select></div></>}
          {section === "Language" && <><h2>{t("Language")}</h2><p className="muted">{t("Choose your interface language.")}</p><div className="setting-row"><div><strong>{t("Interface language")}</strong><p>{t("The English version remains the default. Your choice is saved on this device.")}</p></div><div className="segmented" role="group" aria-label={t("Interface language")}><button type="button" className={`segment ${locale === "en" ? "active" : ""}`} onClick={() => setLocale("en")} lang="en">English</button><button type="button" className={`segment ${locale === "fr" ? "active" : ""}`} onClick={() => setLocale("fr")} lang="fr">Français</button></div></div></>}
          {section === "AI provider" && <><h2>{t("AI provider")}</h2><p className="muted">{t("AI may structure or interpret supplied evidence. It never sets the final score or invents market proof.")}</p>{providerRegistry.ai.map((provider) => <div className="setting-row" key={provider.id}><div className="provider-status"><span className={`dot ${provider.status === "active" ? "active" : ""}`} /><div><strong>{t(provider.label)}</strong><p>{t(provider.status)} · {t(provider.needsKey ? "server-side key required" : "no key required")}</p></div></div>{provider.status === "active" ? <span className="badge green">{t("Selected")}</span> : <button className="button ghost" disabled>{t("Not connected")}</button>}</div>)}</>}
          {section === "Data sources" && <><h2>{t("Data sources")}</h2><p className="muted">{t("Sources are integrated one by one. Hacker News and GitHub Issues are optional live adapters; this browser workspace remains mock-first until the server enables them and the user consents.")}</p>{providerRegistry.dataSources.map((provider) => <div className="setting-row" key={provider.id}><div className="provider-status"><span className={`dot ${provider.status === "active" ? "active" : ""}`} /><div><strong>{t(provider.label)}</strong><p>{t(provider.status)}</p></div></div>{provider.status === "active" ? <span className="badge green">{t("Default")}</span> : provider.status.startsWith("available") ? <span className="badge orange">{t("Available")}</span> : <span className="badge">{t("Offline")}</span>}</div>)}</>}
          {section === "Notifications" && <><h2>{t("Notifications")}</h2><p className="muted">{t("Notification delivery is local-only in demo mode.")}</p><div className="setting-row"><div><strong>{t("Analysis complete")}</strong><p>{t("Notify when an asynchronous analysis finishes")}</p></div><button className={`toggle ${emailNotifications ? "on" : ""}`} onClick={() => setEmailNotifications((value) => !value)} aria-label={t("Toggle analysis notifications")} /></div><div className="setting-row"><div><strong>{t("Score changes")}</strong><p>{t("Alert when evidence changes a verdict")}</p></div><button className="toggle" aria-label={t("Toggle score change notifications")} /></div></>}
          {section === "Billing" && <><h2>{t("Billing")}</h2><p className="muted">{t("No payment provider is connected.")}</p><div className="card card-pad" style={{ marginTop: 20, background: "var(--bg-subtle)" }}><Database color="var(--green)" /><h3 style={{ marginTop: 17 }}>{t("Demo plan")}</h3><p className="muted">{t("Unlimited local demo analyses · Curated signals · No external usage charges")}</p><button className="button ghost" disabled>{t("Billing coming later")}</button></div></>}
          {section === "Danger zone" && <><h2>{t("Danger zone")}</h2><p className="muted">{t("Reset only local browser data. Nothing is sent to a remote backend.")}</p><div className="setting-row"><div><strong>{t("Reset demo workspace")}</strong><p>{t("Restore the five seed projects and default profile")}</p></div><button className="button danger" onClick={reset} disabled={resetting}><RotateCcw /> {t(resetting ? "Resetting…" : "Reset demo")}</button></div><div className="setting-row"><div className="row"><ShieldAlert color="var(--red)" /><div><strong>{t("Delete account")}</strong><p>{t("Unavailable because this is not a remote account")}</p></div></div><button className="button danger" disabled>{t("Delete account")}</button></div></>}
        </section>
      </div>
    </div>
  );
}
