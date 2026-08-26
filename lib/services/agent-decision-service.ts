import type { Analysis, Opportunity, Project, ScoreDimension } from "@/lib/domain/types";
import type {
  AgentDecision,
  BuildEstimateOutput,
  FullBuildEvaluation,
  ValidateIdeaOutput
} from "@/lib/agent/schemas";

function normalizedVerdict(verdict: Analysis["verdict"]): "BUILD" | "VALIDATE_FIRST" | "PIVOT" | "KILL" {
  return verdict === "VALIDATE FIRST" ? "VALIDATE_FIRST" : verdict;
}

function dimension(analysis: Analysis, key: ScoreDimension["key"]): ScoreDimension {
  const found = analysis.dimensions.find((item) => item.key === key);
  if (!found) throw new Error(`Missing score dimension: ${key}`);
  return found;
}

export function buildAgentDecision(analysis: Analysis): AgentDecision {
  const evidenceSignals = analysis.signals.filter((signal) => signal.provenance !== "generated");
  if (evidenceSignals.length === 0 || analysis.confidenceScore < 25) {
    return {
      decision: "INSUFFICIENT_EVIDENCE",
      confidence: analysis.confidenceScore / 100,
      reason: "The available evidence is too limited to support a build decision.",
      blocking_risks: ["No sufficiently reliable market evidence is available."],
      recommended_next_action: { type: "COLLECT_EVIDENCE", description: "Run problem interviews and collect observed willingness-to-pay signals." }
    };
  }

  const verdict = normalizedVerdict(analysis.verdict);
  const lowest = [...analysis.dimensions].sort((a, b) => a.score - b.score)[0];
  const blockingRisks = analysis.roast.risks.slice(0, verdict === "BUILD" ? 1 : 3);
  const action = verdict === "BUILD"
    ? { type: "BUILD_VALIDATION_MVP" as const, description: "Start with the minimum validated scope before expanding." }
    : verdict === "VALIDATE_FIRST"
      ? { type: "BUILD_VALIDATION_MVP" as const, description: analysis.mvp.scope }
      : verdict === "PIVOT"
        ? { type: "NARROW_AND_RESEARCH" as const, description: analysis.pivots[0]?.keyDifference || "Narrow the audience and retest." }
        : { type: "STOP" as const, description: "Do not invest in the full product without materially different evidence." };
  return {
    decision: verdict,
    confidence: analysis.confidenceScore / 100,
    reason: lowest ? `${lowest.label} is the limiting dimension at ${lowest.score.toFixed(1)}/10. ${lowest.justification}` : analysis.summary,
    blocking_risks: blockingRisks,
    recommended_next_action: action
  };
}

export function buildEstimate(analysis: Analysis): BuildEstimateOutput {
  const [hourMin, hourMax] = analysis.complexity.estimatedHours;
  const likelyHours = Math.round((hourMin + hourMax) / 2);
  const likelyTokens = analysis.complexity.estimatedTokens;
  const complexity = analysis.complexity.level === "Very high" ? "VERY_HIGH" : analysis.complexity.level.toUpperCase().replace(" ", "_") as BuildEstimateOutput["complexity"];
  const integrationDriver = analysis.complexity.drivers.find((driver) => driver.includes("integration"));
  const integrations = integrationDriver ? Number.parseInt(integrationDriver, 10) || 1 : 0;
  return {
    complexity,
    estimated_hours: { min: hourMin, likely: likelyHours, max: hourMax },
    estimated_ai_tokens: { min: Math.round(likelyTokens * 0.65), likely: likelyTokens, max: Math.round(likelyTokens * 1.5) },
    screens: Math.max(2, Math.round(analysis.complexity.points / 6)),
    integrations,
    roles: analysis.complexity.drivers.some((driver) => driver.includes("role")) ? 2 : 1,
    backend_complexity: analysis.complexity.points >= 55 ? "HIGH" : analysis.complexity.points >= 28 ? "MEDIUM" : "LOW",
    external_dependencies: analysis.complexity.drivers.filter((driver) => driver.includes("integration") || driver.includes("payment") || driver.includes("AI")),
    risk_factors: analysis.complexity.drivers,
    estimation_note: "Directional range derived from product scope. It is not an exact time or token measurement."
  };
}

function scoreExplanation(analysis: Analysis, item: ScoreDimension) {
  const signals = analysis.signals.filter((signal) => item.evidenceIds.includes(signal.id) && signal.provenance !== "generated");
  return {
    dimension: item.key,
    score: item.score,
    weighted_points: item.weightedPoints,
    max_points: item.maxPoints,
    confidence: item.key === "buildSimplicity" ? 0.9 : analysis.confidenceScore / 100,
    evidence_count: signals.length,
    strong_signals: signals.filter((signal) => signal.strength === "strong").length,
    reason: item.justification
  };
}

export function buildValidateIdeaOutput(project: Project): ValidateIdeaOutput {
  const analysis = project.analyses[0];
  if (!analysis) throw new Error("Project has no analysis.");
  const decision = buildAgentDecision(analysis);
  const distribution = dimension(analysis, "distribution");
  const competition = dimension(analysis, "competitionOpportunity");
  const competitionLevel = analysis.competitors.length >= 3 ? "HIGH" : analysis.competitors.length >= 2 ? "MEDIUM" : "LOW";
  const distributionLevel = distribution.score >= 7 ? "STRONG" : distribution.score >= 4.5 ? "MEDIUM" : "WEAK";
  const scores = Object.fromEntries(analysis.dimensions.map((item) => [item.key, scoreExplanation(analysis, item)]));
  const provenance = { observed: 0, inferred: 0, generated: 0 };
  analysis.signals.forEach((signal) => { provenance[signal.provenance] += 1; });

  return {
    project: { id: project.id, name: project.name, status: project.status, is_demo: analysis.isDemo },
    build_score: analysis.buildScore,
    confidence_score: analysis.confidenceScore,
    verdict: normalizedVerdict(analysis.verdict),
    decision,
    scores,
    top_risks: analysis.roast.risks.slice(0, 4),
    market_evidence_summary: {
      provider: analysis.evidenceMeta.providerName,
      mode: analysis.evidenceMeta.mode,
      warnings: analysis.evidenceMeta.warnings,
      total_signals: analysis.signals.length,
      source_count: new Set(analysis.signals.map((signal) => signal.source)).size,
      strong_signals: analysis.signals.filter((signal) => signal.strength === "strong").length,
      provenance,
      demo_data: analysis.isDemo,
      top_signals: analysis.signals.slice(0, 5).map((signal) => ({ id: signal.id, type: signal.signalType, strength: signal.strength, provenance: signal.provenance, reliability: signal.reliability, summary: signal.excerpt }))
    },
    competition_summary: { level: competitionLevel, competitor_count: analysis.competitors.length, market_gap: competition.justification },
    distribution_summary: { level: distributionLevel, best_channel: analysis.channels[0]?.name || "NOT_ESTABLISHED", reachable_channels: analysis.channels.filter((channel) => channel.potential !== "Low").map((channel) => channel.name) },
    build_estimate: buildEstimate(analysis),
    recommendation: { summary: analysis.summary, minimum_scope: analysis.mvp.scope, hypothesis: analysis.mvp.hypothesis },
    suggested_next_action: decision.recommended_next_action
  };
}

export function evaluateBeforeBuild(analysis: Analysis, intendedBuildScope?: string): FullBuildEvaluation {
  const decision = buildAgentDecision(analysis);
  const distribution = dimension(analysis, "distribution");
  const willingness = dimension(analysis, "willingnessToPay");
  const estimatedCost = buildEstimate(analysis);
  const risks: string[] = [];
  if (analysis.buildScore < 80) risks.push(`Build Score is ${analysis.buildScore}/100, below the full-build threshold.`);
  if (analysis.confidenceScore < 60) risks.push(`Confidence is only ${analysis.confidenceScore}%.`);
  if (distribution.score < 5) risks.push("Distribution is not strong enough for an efficient launch.");
  if (willingness.score < 6) risks.push("Willingness to pay has not been validated strongly enough.");
  const shouldBuild = risks.length === 0 && decision.decision !== "INSUFFICIENT_EVIDENCE";
  const [hoursMin, hoursMax] = analysis.complexity.estimatedHours;
  const tokenMin = Math.round(analysis.complexity.estimatedTokens * 0.65 / 100_000) / 10;
  const tokenMax = Math.round(analysis.complexity.estimatedTokens * 1.5 / 100_000) / 10;

  return {
    should_build_full_product: shouldBuild,
    decision,
    confidence: analysis.confidenceScore / 100,
    estimated_cost: estimatedCost,
    risks,
    recommended_scope: { name: analysis.mvp.scope, include: analysis.mvp.include, exclude: analysis.mvp.exclude },
    reason: shouldBuild
      ? `Evidence clears the current pre-build guard${intendedBuildScope ? ` for the intended scope: ${intendedBuildScope}` : ""}, but staged delivery is still recommended.`
      : risks[0] || decision.reason,
    ...(shouldBuild ? {} : {
      warning: {
        code: "FULL_BUILD_NOT_RECOMMENDED" as const,
        reason: risks[0] || "The evidence is insufficient for a full build.",
        estimated_waste: { development_hours: `${hoursMin}-${hoursMax}`, ai_tokens: `${tokenMin}M-${tokenMax}M` },
        alternative: "Build the validation MVP first."
      }
    })
  };
}

export function buildRoastOutput(project: Project) {
  const analysis = project.analyses[0];
  if (!analysis) throw new Error("Project has no analysis.");
  const fatalCount = analysis.buildScore < 40 ? 2 : 0;
  return {
    project_id: project.id,
    fatal_risks: analysis.roast.risks.slice(0, fatalCount),
    major_risks: analysis.roast.risks.slice(fatalCount),
    assumptions: [analysis.mvp.hypothesis, "The problem occurs frequently enough to sustain repeat usage."],
    existing_alternatives: analysis.competitors.map((item) => item.name),
    distribution_risks: analysis.channels.filter((item) => item.potential === "Low").map((item) => `${item.name}: ${item.rationale}`),
    willingness_to_pay_risks: [dimension(analysis, "willingnessToPay").justification],
    what_would_change_our_mind: analysis.roast.changeOurMind,
    recommended_action: buildAgentDecision(analysis).recommended_next_action.description,
    suggested_pivots: analysis.pivots.map((pivot) => ({ concept: pivot.concept, estimated_score: pivot.estimatedScore, score_status: "HYPOTHETICAL" as const }))
  };
}

export function buildValidationMvpOutput(project: Project) {
  const analysis = project.analyses[0];
  if (!analysis) throw new Error("Project has no analysis.");
  const weakest = [...analysis.dimensions].sort((a, b) => a.score - b.score)[0];
  return {
    project_id: project.id,
    core_hypothesis: analysis.mvp.hypothesis,
    riskiest_assumption: weakest?.justification || "Evidence coverage is insufficient.",
    minimum_testable_product: { name: analysis.mvp.scope, outcome: "Measure paid intent before platform investment." },
    include: analysis.mvp.include,
    exclude: analysis.mvp.exclude,
    estimated_build_time: analysis.mvp.estimatedHours,
    estimated_complexity: "LOW" as const,
    success_metrics: analysis.mvp.successCriteria,
    validation_plan: analysis.firstHundredUsers.slice(0, 4)
  };
}

export function filterOpportunities(opportunities: Opportunity[], input: { category?: string; audience?: string; max_complexity?: "LOW" | "MEDIUM" | "HIGH"; min_score?: number }) {
  const rank = { LOW: 1, MEDIUM: 2, HIGH: 3 } as const;
  return opportunities.filter((item) => {
    const complexity = item.complexity.toUpperCase() as keyof typeof rank;
    return (!input.category || item.category.toLowerCase() === input.category.toLowerCase()) &&
      (!input.audience || `${item.audience} ${item.problem}`.toLowerCase().includes(input.audience.toLowerCase())) &&
      (!input.max_complexity || rank[complexity] <= rank[input.max_complexity]) &&
      item.opportunityScore >= (input.min_score || 0);
  }).map((item) => ({
    id: item.id,
    title: item.title,
    problem: item.problem,
    target_customer: item.audience,
    opportunity_score: item.opportunityScore,
    confidence_score: Math.min(92, Math.round(42 + item.evidenceCount * 0.34)),
    evidence_count: item.evidenceCount,
    competition: item.competition.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
    complexity: item.complexity.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
    potential_pricing: { min: item.pricingMin, max: item.pricingMax, currency: "USD" as const, cadence: "MONTH" as const },
    why_now: item.description,
    is_demo: item.isDemo
  }));
}
