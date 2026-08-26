import type { IdeaInput, Opportunity, Project } from "@/lib/domain/types";
import { validationService } from "@/lib/services/validation-service";

const seedIdeas: Array<{ input: IdeaInput; id: string; date: string }> = [
  {
    id: "invoiceflow",
    date: "2026-08-22T09:30:00.000Z",
    input: {
      name: "InvoiceFlow",
      description: "Automate polite overdue invoice follow-ups for independent consultants without replacing their accounting software.",
      targetCustomer: "Independent consultants and freelance studios",
      problem: "Recover late invoices without awkward manual chasing",
      businessModel: "€19 monthly subscription",
      geography: "Europe",
      marketType: "B2B",
      competitors: "Accounting suites, accounts-receivable tools"
    }
  },
  {
    id: "refund-ops",
    date: "2026-08-20T14:10:00.000Z",
    input: {
      name: "RefundOps",
      description: "A Shopify app that tracks refund exceptions, updates customers automatically and shows support teams what needs attention.",
      targetCustomer: "Shopify stores with 500–5,000 monthly orders",
      problem: "Refund exceptions create repetitive support tickets and chargeback risk",
      businessModel: "$49–$99 monthly subscription",
      geography: "North America and Europe",
      marketType: "B2B"
    }
  },
  {
    id: "petgpt",
    date: "2026-08-18T11:45:00.000Z",
    input: {
      name: "MealMuse AI",
      description: "A native iOS and Android AI meal planner with live grocery integrations, personalized recipes and a family dashboard.",
      targetCustomer: "Busy households",
      problem: "Deciding what to cook every day",
      businessModel: "$9 monthly consumer subscription",
      geography: "Global",
      marketType: "B2C"
    }
  },
  {
    id: "generic-ai-crm",
    date: "2026-08-15T08:20:00.000Z",
    input: {
      name: "Generic AI CRM for freelancers",
      description: "A full AI-powered CRM platform for freelancers with email integrations, realtime chat, native mobile apps and automated sales pipelines.",
      targetCustomer: "Freelancers",
      problem: "CRM data entry takes too much time",
      businessModel: "$29 per seat monthly",
      geography: "Global",
      marketType: "B2B"
    }
  },
  {
    id: "trade-invoice-proof",
    date: "2026-08-11T16:00:00.000Z",
    input: {
      name: "TradePay Proof",
      description: "Invoice follow-up and approval evidence for specialist construction subcontractors working with general contractors.",
      targetCustomer: "Construction subcontractors with five to twenty field teams",
      problem: "Recover approved invoices when payment responsibility is unclear",
      businessModel: "$79 monthly per subcontractor",
      geography: "United Kingdom",
      marketType: "B2B"
    }
  }
];

export async function createDemoProjects(): Promise<Project[]> {
  const results = await Promise.all(
    seedIdeas.map(({ input, id, date }) =>
      validationService.validate(input, {
        projectId: id,
        analysisId: `${id}-analysis-1`,
        createdAt: date
      })
    )
  );
  return results.map((result) => result.project);
}

export const demoOpportunities: Opportunity[] = [
  {
    id: "opp-refund-ops",
    title: "Refund exception desk for small Shopify stores",
    slug: "refund-exception-desk",
    description: "A focused operations layer for delayed, partial and failed refunds.",
    problem: "Support teams cannot see which approved refunds are actually stuck.",
    audience: "Shopify stores with 2–10 support agents",
    category: "Ecommerce",
    marketType: "B2B",
    opportunityScore: 86,
    painScore: 9.1,
    demandScore: 8.4,
    competition: "Medium",
    complexity: "Low",
    pricingMin: 29,
    pricingMax: 79,
    evidenceCount: 124,
    complaints: 74,
    featureRequests: 18,
    competitors: 6,
    isDemo: true
  },
  {
    id: "opp-compliance",
    title: "Compliance handover packs for solar installers",
    slug: "solar-handover-packs",
    description: "Generate customer and regulator-ready evidence packs from field photos and checklists.",
    problem: "Small installers lose hours assembling inconsistent project handovers.",
    audience: "Independent solar installation teams",
    category: "Productivity",
    marketType: "B2B",
    opportunityScore: 82,
    painScore: 8.7,
    demandScore: 7.9,
    competition: "Low",
    complexity: "Medium",
    pricingMin: 49,
    pricingMax: 149,
    evidenceCount: 91,
    complaints: 48,
    featureRequests: 22,
    competitors: 3,
    isDemo: true
  },
  {
    id: "opp-agency-margin",
    title: "Scope-creep ledger for product agencies",
    slug: "scope-creep-ledger",
    description: "Turn client requests into an auditable margin and change-order workflow.",
    problem: "Small agencies discover unbilled work only after project margin has disappeared.",
    audience: "Digital product agencies with 5–30 people",
    category: "Finance",
    marketType: "B2B",
    opportunityScore: 79,
    painScore: 8.8,
    demandScore: 7.3,
    competition: "Medium",
    complexity: "Low",
    pricingMin: 39,
    pricingMax: 99,
    evidenceCount: 76,
    complaints: 39,
    featureRequests: 14,
    competitors: 5,
    isDemo: true
  },
  {
    id: "opp-accessibility",
    title: "Accessibility release checks for Webflow agencies",
    slug: "webflow-accessibility-checks",
    description: "A client-ready preflight and remediation report built around Webflow delivery.",
    problem: "Agencies run generic audits but struggle to turn results into scoped fixes before launch.",
    audience: "Webflow design and development agencies",
    category: "Developer tools",
    marketType: "B2B",
    opportunityScore: 74,
    painScore: 7.6,
    demandScore: 7.8,
    competition: "High",
    complexity: "Medium",
    pricingMin: 19,
    pricingMax: 59,
    evidenceCount: 63,
    complaints: 31,
    featureRequests: 11,
    competitors: 9,
    isDemo: true
  }
];
