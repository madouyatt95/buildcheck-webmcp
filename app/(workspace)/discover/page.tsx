"use client";

import Link from "next/link";
import { ArrowRight, Compass, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { demoOpportunities } from "@/lib/demo/seed";
import { useLanguage } from "@/components/language-provider";

export default function DiscoverPage() {
  const { t, locale } = useLanguage();
  const [category, setCategory] = useState("All categories");
  const [complexity, setComplexity] = useState("Any complexity");
  const [competition, setCompetition] = useState("Any competition");
  const [minimum, setMinimum] = useState("0");
  const categories = ["All categories", ...new Set(demoOpportunities.map((item) => item.category))];
  const filtered = useMemo(() => demoOpportunities.filter((item) =>
    (category === "All categories" || item.category === category) &&
    (complexity === "Any complexity" || item.complexity === complexity) &&
    (competition === "Any competition" || item.competition === competition) &&
    item.opportunityScore >= Number(minimum)
  ), [category, complexity, competition, minimum]);

  return (
    <div className="page">
      <header className="page-heading">
        <div><span className="eyebrow">{t("Discover")}</span><h1>{t("Start with pain, not a pitch.")}</h1><p className="subtitle">{t("Explore recurring problems with testable audiences, pricing hypotheses and implementation constraints.")}</p></div>
        <span className="badge demo-badge">{t("Curated demo feed")}</span>
      </header>
      <div className="filters" aria-label={t("Opportunity filters")}>
        <select className="filter-select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label={t("Category")}>{categories.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select>
        <select className="filter-select" value={complexity} onChange={(event) => setComplexity(event.target.value)} aria-label={t("Complexity")}><option value="Any complexity">{t("Any complexity")}</option><option value="Low">{t("Low")}</option><option value="Medium">{t("Medium")}</option><option value="High">{t("High")}</option></select>
        <select className="filter-select" value={competition} onChange={(event) => setCompetition(event.target.value)} aria-label={t("Competition")}><option value="Any competition">{t("Any competition")}</option><option value="Low">{t("Low")}</option><option value="Medium">{t("Medium")}</option><option value="High">{t("High")}</option></select>
        <select className="filter-select" value={minimum} onChange={(event) => setMinimum(event.target.value)} aria-label={t("Minimum score")}><option value="0">{t("Any score")}</option><option value="75">Score 75+</option><option value="80">Score 80+</option><option value="85">Score 85+</option></select>
      </div>

      {filtered.length ? <div className="opportunity-grid">
        {filtered.map((opportunity) => (
          <article className="card hoverable opportunity-card" key={opportunity.id}>
            <div className="row between" style={{ alignItems: "flex-start" }}><div><div className="row"><span className="badge">{t(opportunity.category)}</span><span className="badge">{opportunity.marketType}</span><span className="badge demo-badge">{t("Demo")}</span></div><h2 style={{ marginTop: 14, maxWidth: 460 }}>{t(opportunity.title)}</h2></div><span className="opportunity-score">{opportunity.opportunityScore}</span></div>
            <p>{t(opportunity.description)}</p>
            <div className="opportunity-metrics">
              <div className="mini-metric"><span>{t("Pain score")}</span><strong>{opportunity.painScore}/10</strong></div>
              <div className="mini-metric"><span>{t("Competition")}</span><strong>{t(opportunity.competition)}</strong></div>
              <div className="mini-metric"><span>{t("Build")}</span><strong>{t(opportunity.complexity)}</strong></div>
            </div>
            <div className="row" style={{ flexWrap: "wrap" }}><span className="badge">{opportunity.complaints} {t("complaints")}</span><span className="badge">{opportunity.featureRequests} {t("requests")}</span><span className="badge">{opportunity.competitors} {t("competitors")}</span></div>
            <div className="row between" style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}><div><span className="tiny">{t("POTENTIAL PRICING")}</span><strong style={{ display: "block" }}>${opportunity.pricingMin}–${opportunity.pricingMax}/{locale === "fr" ? "mois" : "mo"}</strong></div><Link className="button primary" href={`/validate?opportunity=${opportunity.slug}`}>{t("Explore")} <ArrowRight /></Link></div>
          </article>
        ))}
      </div> : <div className="card empty-state"><span className="empty-icon"><Search /></span><h2>{t("No opportunities match")}</h2><p>{t("Broaden one of the filters. The demo feed contains four carefully documented opportunities.")}</p><button className="button primary" onClick={() => { setCategory("All categories"); setComplexity("Any complexity"); setCompetition("Any competition"); setMinimum("0"); }}>{t("Clear filters")}</button></div>}

      <section className="card card-pad section">
        <div className="row between"><div><span className="eyebrow">{t("How opportunities are selected")}</span><h2 style={{ marginTop: 8 }}>{t("Repeated pain + reachable audience + affordable test.")}</h2><p className="muted" style={{ marginBottom: 0 }}>{t("Opportunity scores are seeded for this feed and kept separate from project Build Scores. Live discovery providers are not connected.")}</p></div><Compass color="var(--green)" /></div>
      </section>
    </div>
  );
}
