import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Compass,
  Flame,
  Gauge,
  SearchCheck,
  Sparkles,
  TerminalSquare
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  { icon: SearchCheck, title: "Evidence, not vibes", text: "Separate observable signals from interpretation. Every score points back to its evidence." },
  { icon: Gauge, title: "Deterministic Build Score", text: "Demand, pain, pricing, distribution, competition, simplicity and defensibility — weighted in code." },
  { icon: Flame, title: "Roast before you build", text: "Attack weak assumptions and define exactly what evidence would change the verdict." },
  { icon: Compass, title: "Discover real problems", text: "Start from repeated frustrations and costly workarounds, not a solution looking for a market." },
  { icon: TerminalSquare, title: "Protect your tokens", text: "Estimate implementation cost and shrink the idea into a test you can run this afternoon." },
  { icon: Bot, title: "Built for AI-native builders", text: "Service boundaries are ready for a future MCP without coupling product logic to the UI." }
];

export default function MarketingPage() {
  return (
    <main className="marketing">
      <nav className="marketing-nav" aria-label="Marketing navigation">
        <Link href="/"><Brand /></Link>
        <div className="marketing-links">
          <a href="#product">Product</a>
          <a href="#method">Method</a>
          <Link href="/methodology">Methodology</Link>
        </div>
        <div className="marketing-actions">
          <ThemeToggle />
          <Link className="button ghost" href="/login">Sign in</Link>
          <Link className="button primary" href="/dashboard">Open demo <ArrowRight /></Link>
        </div>
      </nav>

      <section className="hero">
        <span className="hero-badge"><Sparkles size={13} /> Built for humans and AI agents</span>
        <h1>Stop building SaaS <span>nobody wants.</span></h1>
        <p>BuildCheck validates demand, competition and distribution before you — or your coding agent — spend weeks building the wrong product.</p>
        <div className="hero-actions">
          <Link href="/validate" className="button primary wide">Analyze my idea <ArrowRight /></Link>
          <Link href="/discover" className="button ghost wide">Explore opportunities</Link>
        </div>
      </section>

      <div className="dashboard-preview" aria-label="BuildCheck dashboard preview">
        <div className="preview-window">
          <div className="preview-bar"><span className="preview-dot" /><span className="preview-dot" /><span className="preview-dot" /></div>
          <div className="preview-content">
            <div className="preview-sidebar">
              {[true, false, false, false, false].map((active, index) => <div key={index} className={`preview-line ${active ? "active" : ""}`} />)}
            </div>
            <div className="preview-main">
              <span className="eyebrow">InvoiceFlow analysis</span>
              <h2 style={{ fontSize: 29, marginTop: 6 }}>Evidence says: validate the wedge.</h2>
              <div className="preview-score-row">
                <div className="card preview-report">
                  <div className="row between"><strong>Score breakdown</strong><span className="badge green">81 · BUILD</span></div>
                  <div className="preview-bars">
                    <div><div className="metric-line"><span>Demand</span><strong>8.9</strong></div><div className="progress-track"><span style={{ width: "89%" }} /></div></div>
                    <div><div className="metric-line"><span>Pain</span><strong>7.2</strong></div><div className="progress-track"><span /></div></div>
                    <div><div className="metric-line"><span>Distribution</span><strong>5.4</strong></div><div className="progress-track"><span /></div></div>
                  </div>
                </div>
                <div className="card preview-side-card">
                  <span className="tiny">Minimum testable version</span>
                  <h3 style={{ marginTop: 10 }}>Sell the outcome first.</h3>
                  <ul className="clean-list"><li>Focused landing page</li><li>3 paid pilots</li><li>Manual delivery</li></ul>
                  <div className="badge green" style={{ marginTop: 25 }}>4–6 hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="marketing-section center">
        <span className="eyebrow">The pre-build layer</span>
        <h2>Your coding agent can code. But should it?</h2>
        <p>Give your coding agent permission to say no — or to propose the smallest validation MVP worth building first.</p>
        <div className="agent-flow" style={{ textAlign: "left" }}>
          {["User intent", "Coding agent", "BuildCheck", "Build / Validate / Pivot / Kill", "Code the minimum next action"].map((label, index) => <div className="agent-flow-step" key={label}><span>Step {index + 1}</span><strong>{label}</strong></div>)}
        </div>
        <Link href="/agents" className="button ghost wide" style={{ marginTop: 25 }}>Explore WebMCP site tools <ArrowRight /></Link>
      </section>

      <section className="marketing-section center" id="product">
        <span className="eyebrow">One decision system</span>
        <h2>Your AI knows how to code. BuildCheck tells it what’s worth coding.</h2>
        <p>See the market case, the failure case and the cheapest validation test in one explainable report.</p>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="card feature-card" key={feature.title}>
              <span className="feature-icon"><feature.icon /></span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section center" id="method">
        <div className="final-cta">
          <span className="eyebrow">Demo workspace included</span>
          <h2 style={{ marginTop: 13 }}>Kill weak ideas before they kill your roadmap.</h2>
          <p style={{ margin: "0 auto 28px", color: "var(--text-soft)" }}>No API key required. The demo uses a transparent, curated dataset and the same deterministic scoring engine as future live-source analyses.</p>
          <Link href="/dashboard" className="button primary wide">Try the full product <CheckCircle2 /></Link>
        </div>
      </section>

      <footer className="footer">
        <Brand />
        <span>Demo evidence is clearly labeled. No market data is invented by an LLM.</span>
        <span>© 2026 BuildCheck</span>
      </footer>
    </main>
  );
}
