import type { AIProvider } from "@/lib/providers/contracts";
import type {
  IdeaInput,
  MarketSignal,
  MvpRecommendation,
  Pivot,
  StructuredIdea
} from "@/lib/domain/types";

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function inferName(input: IdeaInput): string {
  if (input.name?.trim()) return input.name.trim();
  const meaningful = input.description
    .replace(/\b(a|an|the|for|to|with|that|and|of|pour|les|des|une|un|qui)\b/gi, " ")
    .replace(/[^a-zA-Z0-9À-ÿ\s-]/g, " ")
    .trim();
  return titleCase(meaningful) || "Untitled idea";
}

function extractKeywords(value: string): string[] {
  const stopWords = new Set([
    "about", "after", "avec", "build", "faire", "from", "have", "idea", "into", "pour", "that", "their",
    "this", "tool", "using", "users", "will", "with", "would", "application", "platform"
  ]);
  return [...new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9à-ÿ\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
  )].slice(0, 8);
}

export class MockAIProvider implements AIProvider {
  readonly name = "Mock AI · deterministic";

  async structureIdea(input: IdeaInput): Promise<StructuredIdea> {
    const name = inferName(input);
    const targetCustomer = input.targetCustomer?.trim() || "A narrowly defined early-adopter segment";
    const problem = input.problem?.trim() || input.description.trim();
    return {
      name,
      tagline: `${name} for ${targetCustomer.toLowerCase()}`,
      description: input.description.trim(),
      problem,
      targetCustomer,
      businessModel: input.businessModel?.trim() || "Subscription to validate",
      geography: input.geography?.trim() || "Global",
      marketType: input.marketType || "B2B",
      keywords: extractKeywords(`${input.description} ${targetCustomer} ${problem}`),
      explicitCompetitors: (input.competitors || "")
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    };
  }

  async classifySignal(signal: MarketSignal): Promise<MarketSignal["signalType"]> {
    return signal.signalType;
  }

  async summarizeEvidence(idea: StructuredIdea, signals: MarketSignal[]): Promise<string> {
    if (signals.length === 0) return "Not enough evidence.";
    const strong = signals.filter((signal) => signal.strength === "strong").length;
    const types = new Set(signals.map((signal) => signal.signalType)).size;
    const isDemo = signals.every((signal) => signal.isDemo);
    return isDemo
      ? `${idea.name} has ${signals.length} demo signals across ${types} evidence types, including ${strong} strong indicators. Treat this as a product walkthrough until real sources confirm the pattern.`
      : `${idea.name} has ${signals.length} observed public-source signals across ${types} evidence types, including ${strong} strong indicators. Treat anecdotal discussions as directional evidence, not representative market research.`;
  }

  async generatePivots(idea: StructuredIdea, signals: MarketSignal[]): Promise<Pivot[]> {
    if (signals.length === 0) return [];
    if (/crm/i.test(`${idea.name} ${idea.description}`)) {
      return [
        {
          concept: "CRM for independent property photographers",
          targetAudience: "Independent property photographers managing estate-agent relationships",
          whyStronger: "A repeatable job, recognizable workflow and concentrated professional niche create a testable wedge.",
          estimatedScore: 76,
          keyDifference: "Hypothetical vertical workflow, not another horizontal CRM. Requires its own evidence analysis."
        },
        {
          concept: "Client follow-up concierge for one freelance vertical",
          targetAudience: "Freelancers who lose repeat business because follow-ups fall through",
          whyStronger: "A manual outcome test avoids migration and full CRM scope.",
          estimatedScore: 69,
          keyDifference: "Prove follow-up value before storing the complete customer record."
        }
      ];
    }
    const audience = idea.targetCustomer === "A narrowly defined early-adopter segment"
      ? "Independent operators in one high-frequency vertical"
      : idea.targetCustomer;
    return [
      {
        concept: `${idea.name} Concierge`,
        targetAudience: audience,
        whyStronger: "A manual-first service tests urgency before platform investment.",
        estimatedScore: 73,
        keyDifference: "Sell the outcome first; automate only the repeated steps."
      },
      {
        concept: `${idea.name} for teams with an existing paid workflow`,
        targetAudience: `Small teams already paying to solve ${idea.problem.toLowerCase()}`,
        whyStronger: "Existing spend creates a clearer switching and pricing benchmark.",
        estimatedScore: 68,
        keyDifference: "Replace a proven budget line instead of creating a new category."
      }
    ];
  }

  async generateMVP(idea: StructuredIdea, signals: MarketSignal[]): Promise<MvpRecommendation> {
    if (signals.length === 0) {
      return {
        scope: "Evidence collection only",
        include: ["10 problem interviews", "A falsifiable problem statement"],
        exclude: ["Application code", "Automations", "Integrations"],
        hypothesis: "Not enough evidence to define a paid-product hypothesis.",
        successCriteria: ["At least 5 people describe the problem unprompted", "At least 2 already pay or use a costly workaround"],
        estimatedHours: "3–5 hours"
      };
    }
    return {
      scope: "Concierge validation MVP",
      include: ["Focused landing page", "Paid pilot checkout", "Short onboarding form", "Manual outcome delivery"],
      exclude: ["Multi-role dashboard", "Automated integrations", "Native app", "Advanced AI orchestration"],
      hypothesis: `${idea.targetCustomer} will pay for a faster way to ${idea.problem.toLowerCase()}.`,
      successCriteria: ["100 qualified visits", "10 intent signups", "3 paid pilots", "2 repeat-use requests"],
      estimatedHours: "4–6 hours"
    };
  }

  async roastIdea(idea: StructuredIdea, signals: MarketSignal[]) {
    if (signals.length === 0) {
      return {
        risks: ["There is no evidence dataset to challenge this idea yet."],
        changeOurMind: ["Collect direct problem interviews and proof of an existing workaround."],
        betterAngle: "Start with one audience, one painful job, and one measurable outcome.",
        estimatedScore: 0
      };
    }
    const isCrm = /crm/i.test(`${idea.name} ${idea.description}`);
    return {
      risks: [
        "The target user may tolerate the current workaround because switching is harder than the pain.",
        "A broad promise will compete with flexible general-purpose AI tools.",
        "Acquisition could cost more than the first year of gross margin.",
        "The problem may be urgent only a few times per year.",
        "Incumbents can copy surface-level AI features quickly."
      ],
      changeOurMind: [
        "Three prospects prepay for a narrow outcome.",
        "Weekly usage is observed in a manual pilot.",
        "One concentrated channel produces qualified conversations repeatedly.",
        "Users share data or workflow context that improves the product over time."
      ],
      betterAngle: isCrm
        ? "CRM for independent property photographers — hypothetical until separately validated."
        : `${idea.name} for ${idea.targetCustomer.toLowerCase()}, delivered as a measurable outcome rather than another dashboard.`,
      estimatedScore: isCrm ? 76 : 71
    };
  }
}
