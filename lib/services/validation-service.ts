import type {
  Analysis,
  BuildComplexityInput,
  IdeaInput,
  Project,
  StructuredIdea,
  ValidationResult
} from "@/lib/domain/types";
import type { AIProvider, DataSourceProvider } from "@/lib/providers/contracts";
import { MockAIProvider } from "@/lib/providers/mock-ai-provider";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import { calculateConfidenceScore } from "@/lib/scoring/confidence";
import { estimateBuildComplexity } from "@/lib/scoring/complexity";
import { calculateBuildScore } from "@/lib/scoring/engine";
import { verdictToStatus } from "@/lib/scoring/verdict";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function inferComplexity(idea: StructuredIdea): BuildComplexityInput {
  const text = `${idea.description} ${idea.problem}`.toLowerCase();
  const countMatches = (pattern: RegExp) => (text.match(pattern) || []).length;
  const integrations = Math.min(5, countMatches(/integrat|api|sync|connect|stripe|shopify|slack/g));
  const aiFeatures = Math.min(4, countMatches(/\bai\b|artificial intelligence|gpt|llm|automat/g));
  return {
    screens: /dashboard|platform|app/.test(text) ? 7 : 4,
    integrations,
    roles: /admin|team|manager|client|customer/.test(text) ? 2 : 1,
    entities: /marketplace/.test(text) ? 8 : 5,
    hasAuth: !/landing page|newsletter/.test(text),
    hasPayments: /pay|pricing|subscription|invoice|refund|commerce|shopify/.test(text),
    hasRealtime: /realtime|real-time|live tracking|chat/.test(text),
    hasNativeApp: /native|ios|android/.test(text),
    aiFeatures
  };
}

function buildFrustrations(analysis: Pick<Analysis, "signals">) {
  const painSignals = analysis.signals.filter((signal) =>
    ["pain", "competitor_complaint", "workaround", "churn_risk"].includes(signal.signalType)
  );
  return painSignals.slice(0, 4).map((signal, index) => ({
    label: signal.title,
    mentions: Math.max(7, 42 - index * 8 + (signal.strength === "strong" ? 4 : 0)),
    intensity: signal.strength === "weak" ? "Medium" as const : "High" as const
  }));
}

function firstHundredUsers(channels: Analysis["channels"]): string[] {
  const first = channels[0];
  const second = channels[1];
  return [
    `Interview 10 prospects through ${first?.name || "one focused community"}; record current workflow, frequency and cost.`,
    "Offer 5 paid concierge pilots with a narrow, measurable outcome.",
    `Turn the strongest proof into a before/after case study${second ? ` and distribute it through ${second.name}` : ""}.`,
    "Ask every successful pilot for two peer introductions; keep the first cohort intentionally small.",
    "Automate only the step that appears in at least 4 of the 5 paid pilots."
  ];
}

interface ValidationOptions {
  projectId?: string;
  analysisId?: string;
  createdAt?: string;
  version?: number;
  userId?: string;
}

export class ValidationService {
  constructor(
    private readonly ai: AIProvider,
    private readonly dataSource: DataSourceProvider
  ) {}

  async validate(input: IdeaInput, options: ValidationOptions = {}): Promise<ValidationResult> {
    const idea = await this.ai.structureIdea(input);
    const stableSuffix = slugify(idea.name) || "idea";
    const projectId = options.projectId || `project-${stableSuffix}-${Date.now()}`;
    const createdAt = options.createdAt || new Date().toISOString();
    const evidence = await this.dataSource.collect(idea, projectId);
    const complexity = estimateBuildComplexity(inferComplexity(idea));
    const score = calculateBuildScore({ idea, ...evidence, complexity, asOf: createdAt });
    const confidenceScore = calculateConfidenceScore(evidence.signals, createdAt);
    const [summary, pivots, mvp, roast] = await Promise.all([
      this.ai.summarizeEvidence(idea, evidence.signals),
      this.ai.generatePivots(idea, evidence.signals),
      this.ai.generateMVP(idea, evidence.signals),
      this.ai.roastIdea(idea, evidence.signals)
    ]);

    const analysis: Analysis = {
      id: options.analysisId || `analysis-${projectId}-v${options.version || 1}`,
      projectId,
      version: options.version || 1,
      buildScore: score.score,
      verdict: score.verdict,
      confidenceScore,
      summary,
      dimensions: score.dimensions,
      signals: evidence.signals,
      competitors: evidence.competitors,
      channels: evidence.channels,
      frustrations: [],
      firstHundredUsers: firstHundredUsers(evidence.channels),
      complexity,
      mvp,
      pivots,
      roast,
      evidenceMeta: evidence.meta,
      createdAt,
      isDemo: evidence.meta.mode !== "live"
    };
    analysis.frustrations = buildFrustrations(analysis);

    const project: Project = {
      id: projectId,
      userId: options.userId || "demo-user",
      slug: slugify(idea.name),
      name: idea.name,
      tagline: idea.tagline,
      description: idea.description,
      problem: idea.problem,
      targetCustomer: idea.targetCustomer,
      businessModel: idea.businessModel,
      geography: idea.geography,
      marketType: idea.marketType,
      externalLookupAllowed: input.allowExternalLookup === true,
      status: verdictToStatus(score.verdict),
      updatedAt: createdAt,
      analyses: [analysis]
    };

    return { project, analysis };
  }
}

export const validationService = new ValidationService(
  new MockAIProvider(),
  new MockDataSourceProvider()
);
