import type {
  Competitor,
  DistributionChannel,
  MarketSignal,
  SignalStrength,
  SignalType,
  StructuredIdea
} from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";

type Scenario = "invoice" | "refund" | "meal" | "crm" | "generic";

function scenarioFor(idea: StructuredIdea): Scenario {
  const text = `${idea.name} ${idea.description} ${idea.problem} ${idea.keywords.join(" ")}`.toLowerCase();
  if (/invoice|factur|payment follow|relance/.test(text)) return "invoice";
  if (/refund|return|shopify|rembours/.test(text)) return "refund";
  if (/meal|food|nutrition|repas/.test(text)) return "meal";
  if (/crm|customer relationship|sales pipeline/.test(text)) return "crm";
  return "generic";
}

function signal(
  projectId: string,
  index: number,
  source: string,
  signalType: SignalType,
  strength: SignalStrength,
  title: string,
  excerpt: string
): MarketSignal {
  const createdAt = `2026-08-${String(4 + index).padStart(2, "0")}T10:00:00.000Z`;
  return {
    id: `${projectId}-signal-${index}`,
    projectId,
    source,
    sourceUrl: "/methodology#demo-data",
    title,
    excerpt,
    signalType,
    strength,
    sentiment: signalType === "market_growth" || signalType === "demand" ? "positive" : "negative",
    createdAt,
    collectedAt: createdAt,
    provenance: "inferred",
    reliability: 0.78,
    isDemo: true
  };
}

const scenarioSignals: Record<Scenario, Array<[string, SignalType, SignalStrength, string, string]>> = {
  invoice: [
    ["Demo interview", "pain", "strong", "Late payments consume billable time", "Freelancers describe repeated follow-ups as emotionally draining and easy to postpone."],
    ["Demo community sample", "workaround", "strong", "Spreadsheet plus calendar reminders", "The common workaround combines a spreadsheet, email templates and manual reminders."],
    ["Demo pricing study", "willingness_to_pay", "strong", "Existing spend around receivables", "Several sampled businesses already pay for accounting tools but still handle reminders manually."],
    ["Demo competitor review", "competitor_complaint", "moderate", "Accounting suites feel oversized", "Users want follow-up automation without migrating their complete bookkeeping workflow."],
    ["Demo search sample", "demand", "strong", "Recurring intent around overdue invoices", "Problem-aware searches focus on reducing payment delay and awkward client conversations."],
    ["Demo channel map", "distribution", "strong", "Freelancer communities are concentrated", "Professional communities and accountant partnerships provide identifiable access points."],
    ["Demo interview", "feature_request", "moderate", "Tone-aware reminders", "Users ask for reminders that become firmer without damaging the client relationship."],
    ["Demo pricing study", "willingness_to_pay", "moderate", "Outcome-linked pricing resonates", "A small monthly fee feels reasonable when positioned against days-sales-outstanding."],
    ["Demo competitor review", "churn_risk", "moderate", "Setup complexity causes abandonment", "People stop using broad finance suites when automation requires too much configuration."],
    ["Demo trend sample", "market_growth", "moderate", "Independent work remains a large niche", "A large base of solo operators makes the segment testable across multiple verticals."]
  ],
  refund: [
    ["Demo merchant interview", "pain", "strong", "Refund status creates support load", "Small merchants repeatedly answer where-is-my-refund tickets across several systems."],
    ["Demo app review", "competitor_complaint", "strong", "Return suites price for larger brands", "Small stores describe current tooling as expensive and operationally heavy."],
    ["Demo workflow sample", "workaround", "strong", "Shared sheets coordinate exceptions", "Teams export orders and track refund exceptions in shared spreadsheets."],
    ["Demo pricing study", "willingness_to_pay", "strong", "Support savings create a budget", "Merchants compare tooling cost with support hours and chargeback risk."],
    ["Demo ecosystem map", "distribution", "strong", "Shopify ecosystem is concentrated", "App listings, agencies and merchant communities can reach a defined audience."],
    ["Demo search sample", "demand", "strong", "Refund automation intent", "Queries cluster around refund status, return exceptions and customer notifications."],
    ["Demo app review", "feature_request", "moderate", "Proactive customer updates", "Merchants ask for branded status pages and automatic exception alerts."],
    ["Demo partner interview", "distribution", "moderate", "Agencies see the pain repeatedly", "Implementation agencies can identify stores with rising support volume."],
    ["Demo competitor review", "churn_risk", "moderate", "Complex setup weakens retention", "Smaller merchants churn when tools require enterprise-style workflow configuration."],
    ["Demo trend sample", "market_growth", "moderate", "Post-purchase operations matter more", "Retention pressure increases attention on the experience after checkout."]
  ],
  meal: [
    ["Demo consumer interview", "pain", "moderate", "Planning fatigue is real", "People dislike deciding what to cook, but the frustration is often short-lived."],
    ["Demo app review", "competitor_complaint", "moderate", "Recommendations become repetitive", "Users complain that generic plans ignore household preferences after initial setup."],
    ["Demo workflow sample", "workaround", "strong", "General AI is the free workaround", "Consumers already ask general-purpose assistants for meal plans at no incremental cost."],
    ["Demo pricing study", "willingness_to_pay", "weak", "Subscription resistance", "Sampled users expect planning to be bundled with grocery, fitness or recipe products."],
    ["Demo social sample", "demand", "moderate", "High interest, weak purchase intent", "Meal-plan content attracts attention but rarely contains explicit buying language."],
    ["Demo channel map", "distribution", "moderate", "Creator channels are crowded", "Food creators offer reach, but paid acquisition competes with abundant free content."],
    ["Demo app review", "churn_risk", "strong", "Novelty wears off quickly", "Reviews describe strong first-week use followed by declining engagement."]
  ],
  crm: [
    ["Demo founder interview", "pain", "moderate", "CRM upkeep feels like admin", "Teams dislike manual data entry but disagree on the workflow that should replace it."],
    ["Demo competitor review", "competitor_complaint", "strong", "Incumbents are complex", "Users repeatedly criticize configuration overhead and seat-based pricing."],
    ["Demo workflow sample", "workaround", "moderate", "Spreadsheets remain flexible", "Small teams return to spreadsheets when the CRM process becomes rigid."],
    ["Demo pricing study", "willingness_to_pay", "weak", "Budget exists but switching is costly", "CRM is a proven spend category, though migration risk reduces purchase intent."],
    ["Demo search sample", "demand", "weak", "Large established category", "The category has demand, but generic positioning captures little solution-specific intent."],
    ["Demo channel map", "distribution", "weak", "Audience definition is too broad", "Nearly every business is a possible buyer, leaving no efficient first channel."],
    ["Demo competitor review", "churn_risk", "moderate", "Data migration blocks switching", "Even unhappy teams hesitate when history and integrations live in the incumbent."],
    ["Demo migration interview", "churn_risk", "strong", "Switching incentive is weak", "The cost of cleaning and migrating contact history outweighs incremental AI convenience."],
    ["Demo buyer panel", "competitor_complaint", "moderate", "AI is becoming table stakes", "Buyers expect automation from existing CRM vendors and do not view it as a standalone reason to switch."]
  ],
  generic: [
    ["Demo discovery interview", "pain", "moderate", "Problem mentioned without urgency", "The target user recognizes the issue but has not quantified its cost or frequency."],
    ["Demo workflow sample", "workaround", "moderate", "Manual workaround exists", "People combine familiar tools instead of buying a dedicated product."],
    ["Demo pricing study", "willingness_to_pay", "weak", "Budget remains unproven", "No sampled user made an explicit commitment to pay yet."],
    ["Demo search sample", "demand", "moderate", "Some problem-aware interest", "Search intent exists, but it mixes educational and product-seeking behavior."],
    ["Demo channel map", "distribution", "moderate", "One testable community", "A focused community offers a place to run interviews and a manual pilot."],
    ["Demo competitor review", "competitor_complaint", "weak", "Alternatives have minor gaps", "Complaints exist but do not yet reveal a strong switching trigger."]
  ]
};

const competitorSets: Record<Scenario, Competitor[]> = {
  invoice: [
    { id: "invoice-1", name: "Ledger Suite", url: "#", positioning: "All-in-one small-business accounting", pricing: "$30–$90/mo", targetAudience: "Small businesses", strengths: ["Trusted finance workflow", "Broad integrations"], weaknesses: ["Heavy setup", "Follow-up is secondary"], opportunity: "Own the freelancer-specific collection workflow.", isDemo: true },
    { id: "invoice-2", name: "Chaser Pro", url: "#", positioning: "Accounts-receivable automation", pricing: "$45+/mo", targetAudience: "Finance teams", strengths: ["Deep automation"], weaknesses: ["Too expensive for solos", "Finance-team language"], opportunity: "Simplify onboarding and price around solo cash flow.", isDemo: true }
  ],
  refund: [
    { id: "refund-1", name: "Returns Cloud", url: "#", positioning: "Enterprise returns management", pricing: "$99+/mo", targetAudience: "Mid-market retailers", strengths: ["Full returns lifecycle"], weaknesses: ["Complex", "Expensive for small stores"], opportunity: "Focus only on refund exceptions and communication.", isDemo: true },
    { id: "refund-2", name: "Status Desk", url: "#", positioning: "Order-status support automation", pricing: "$49/mo", targetAudience: "Online stores", strengths: ["Customer-facing portal"], weaknesses: ["Weak exception workflow"], opportunity: "Become the operational layer after approval.", isDemo: true }
  ],
  meal: [
    { id: "meal-1", name: "General AI", url: "#", positioning: "Flexible free-form assistant", pricing: "Free", targetAudience: "Everyone", strengths: ["Flexible", "Already adopted"], weaknesses: ["Low continuity", "No specialist workflow"], opportunity: "A narrow clinical or performance niche only.", isDemo: true },
    { id: "meal-2", name: "Recipe Planner", url: "#", positioning: "Recipes and weekly plans", pricing: "$8/mo", targetAudience: "Households", strengths: ["Large recipe catalog"], weaknesses: ["Low personalization"], opportunity: "Avoid the generic household market.", isDemo: true },
    { id: "meal-3", name: "Fitness Tracker", url: "#", positioning: "Training and nutrition bundle", pricing: "$15/mo", targetAudience: "Fitness consumers", strengths: ["Habit loop", "Bundled value"], weaknesses: ["Generic food guidance"], opportunity: "Serve one professional performance workflow.", isDemo: true }
  ],
  crm: [
    { id: "crm-1", name: "Market CRM", url: "#", positioning: "Horizontal sales platform", pricing: "$25–$150/seat", targetAudience: "Sales teams", strengths: ["Ecosystem", "Integrations"], weaknesses: ["Complex", "Expensive"], opportunity: "Requires a vertical workflow wedge.", isDemo: true },
    { id: "crm-2", name: "Simple CRM", url: "#", positioning: "Lightweight pipeline", pricing: "$15/seat", targetAudience: "Small teams", strengths: ["Easy adoption"], weaknesses: ["Limited vertical depth"], opportunity: "Compete on a specific job, not simplicity alone.", isDemo: true },
    { id: "crm-3", name: "Spreadsheet", url: "#", positioning: "Flexible DIY tracking", pricing: "Free", targetAudience: "Small operators", strengths: ["Familiar", "Flexible"], weaknesses: ["Manual", "No process guidance"], opportunity: "Automate one painful repeated update.", isDemo: true }
  ],
  generic: [
    { id: "generic-1", name: "Existing workflow", url: "#", positioning: "Familiar combination of tools", pricing: "Free", targetAudience: "Current target segment", strengths: ["Already adopted"], weaknesses: ["Manual handoffs"], opportunity: "Prove one handoff is painful enough to replace.", isDemo: true }
  ]
};

const channelSets: Record<Scenario, DistributionChannel[]> = {
  invoice: [
    { name: "Freelancer communities", potential: "Strong", detail: "12 focused communities", rationale: "The job title and pain are both explicit." },
    { name: "Accountant partnerships", potential: "Strong", detail: "Trusted referral path", rationale: "Accountants observe late-payment pain repeatedly." },
    { name: "SEO", potential: "Medium", detail: "24 problem-aware topics", rationale: "Intent exists but content competition is mature." },
    { name: "LinkedIn", potential: "Medium", detail: "Role-based targeting", rationale: "Useful for interviews and founder-led sales." }
  ],
  refund: [
    { name: "Shopify App Store", potential: "Strong", detail: "High-intent marketplace", rationale: "Merchants search where they already manage the store." },
    { name: "Ecommerce agencies", potential: "Strong", detail: "Repeat referral channel", rationale: "Agencies see the same operational issue across clients." },
    { name: "Merchant communities", potential: "Medium", detail: "9 focused groups", rationale: "Good for discovery, with promotion constraints." },
    { name: "SEO", potential: "Medium", detail: "18 operational keywords", rationale: "Queries reveal active implementation intent." }
  ],
  meal: [
    { name: "Creator partnerships", potential: "Medium", detail: "Crowded attention market", rationale: "Reach is available but trust is creator-owned." },
    { name: "App marketplaces", potential: "Low", detail: "Heavy category competition", rationale: "Generic discovery is expensive and undifferentiated." },
    { name: "SEO", potential: "Low", detail: "Free content dominates", rationale: "High volume does not imply paid intent." }
  ],
  crm: [
    { name: "LinkedIn", potential: "Medium", detail: "Large reachable audience", rationale: "Targeting is possible but competitive and expensive." },
    { name: "SEO", potential: "Low", detail: "Incumbent-dominated results", rationale: "Generic CRM terms have weak entry economics." },
    { name: "Vertical partnerships", potential: "Low", detail: "No vertical selected", rationale: "A niche is required before this channel becomes usable." }
  ],
  generic: [
    { name: "Focused community", potential: "Medium", detail: "1 initial test channel", rationale: "Enough for interviews and a concierge pilot, not yet scalable." },
    { name: "Founder-led outreach", potential: "Medium", detail: "Manual first conversations", rationale: "Direct learning is more valuable than broad reach at this stage." }
  ]
};

export class MockDataSourceProvider implements DataSourceProvider {
  readonly name = "Mock sources · curated scenarios";

  async collect(idea: StructuredIdea, projectId: string): Promise<EvidenceBundle> {
    const scenario = scenarioFor(idea);
    const signals = scenarioSignals[scenario].map((item, index) =>
      signal(projectId, index + 1, ...item)
    );
    return {
      signals,
      competitors: competitorSets[scenario].map((competitor) => ({ ...competitor })),
      channels: channelSets[scenario].map((channel) => ({ ...channel })),
      meta: {
        providerId: "mock",
        providerName: this.name,
        mode: "demo",
        warnings: ["Curated demo evidence; no live market source was queried."]
      }
    };
  }
}
