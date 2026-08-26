"use client";

import Link from "next/link";
import { ArrowRight, Compass, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { demoOpportunities } from "@/lib/demo/seed";

export default function DiscoverPage() {
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
        <div><span className="eyebrow">Discover</span><h1>Start with pain, not a pitch.</h1><p className="subtitle">Explore recurring problems with testable audiences, pricing hypotheses and implementation constraints.</p></div>
        <span className="badge demo-badge">Curated demo feed</span>
      </header>
      <div className="filters" aria-label="Opportunity filters">
        <select className="filter-select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="filter-select" value={complexity} onChange={(event) => setComplexity(event.target.value)} aria-label="Complexity"><option>Any complexity</option><option>Low</option><option>Medium</option><option>High</option></select>
        <select className="filter-select" value={competition} onChange={(event) => setCompetition(event.target.value)} aria-label="Competition"><option>Any competition</option><option>Low</option><option>Medium</option><option>High</option></select>
        <select className="filter-select" value={minimum} onChange={(event) => setMinimum(event.target.value)} aria-label="Minimum score"><option value="0">Any score</option><option value="75">Score 75+</option><option value="80">Score 80+</option><option value="85">Score 85+</option></select>
      </div>

      {filtered.length ? <div className="opportunity-grid">
        {filtered.map((opportunity) => (
          <article className="card hoverable opportunity-card" key={opportunity.id}>
            <div className="row between" style={{ alignItems: "flex-start" }}><div><div className="row"><span className="badge">{opportunity.category}</span><span className="badge">{opportunity.marketType}</span><span className="badge demo-badge">Demo</span></div><h2 style={{ marginTop: 14, maxWidth: 460 }}>{opportunity.title}</h2></div><span className="opportunity-score">{opportunity.opportunityScore}</span></div>
            <p>{opportunity.description}</p>
            <div className="opportunity-metrics">
              <div className="mini-metric"><span>Pain score</span><strong>{opportunity.painScore}/10</strong></div>
              <div className="mini-metric"><span>Competition</span><strong>{opportunity.competition}</strong></div>
              <div className="mini-metric"><span>Build</span><strong>{opportunity.complexity}</strong></div>
            </div>
            <div className="row" style={{ flexWrap: "wrap" }}><span className="badge">{opportunity.complaints} complaints</span><span className="badge">{opportunity.featureRequests} requests</span><span className="badge">{opportunity.competitors} competitors</span></div>
            <div className="row between" style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}><div><span className="tiny">POTENTIAL PRICING</span><strong style={{ display: "block" }}>${opportunity.pricingMin}–${opportunity.pricingMax}/mo</strong></div><Link className="button primary" href={`/validate?opportunity=${opportunity.slug}`}>Explore <ArrowRight /></Link></div>
          </article>
        ))}
      </div> : <div className="card empty-state"><span className="empty-icon"><Search /></span><h2>No opportunities match</h2><p>Broaden one of the filters. The demo feed contains four carefully documented opportunities.</p><button className="button primary" onClick={() => { setCategory("All categories"); setComplexity("Any complexity"); setCompetition("Any competition"); setMinimum("0"); }}>Clear filters</button></div>}

      <section className="card card-pad section">
        <div className="row between"><div><span className="eyebrow">How opportunities are selected</span><h2 style={{ marginTop: 8 }}>Repeated pain + reachable audience + affordable test.</h2><p className="muted" style={{ marginBottom: 0 }}>Opportunity scores are seeded for this feed and kept separate from project Build Scores. Live discovery providers are not connected.</p></div><Compass color="var(--green)" /></div>
      </section>
    </div>
  );
}
