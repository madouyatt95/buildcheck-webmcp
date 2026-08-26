import { z } from "zod";

export const agentDecisionValueSchema = z.enum([
  "BUILD",
  "VALIDATE_FIRST",
  "PIVOT",
  "KILL",
  "INSUFFICIENT_EVIDENCE"
]);

export const nextActionTypeSchema = z.enum([
  "BUILD_FULL_PRODUCT",
  "BUILD_VALIDATION_MVP",
  "COLLECT_EVIDENCE",
  "NARROW_AND_RESEARCH",
  "STOP"
]);

export const agentDecisionSchema = z.object({
  decision: agentDecisionValueSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  blocking_risks: z.array(z.string()),
  recommended_next_action: z.object({
    type: nextActionTypeSchema,
    description: z.string()
  })
});

export const validateIdeaInputSchema = z.object({
  idea: z.string().trim().min(20).max(3000),
  target_customer: z.string().trim().max(180).optional(),
  geography: z.string().trim().max(100).optional(),
  business_model: z.string().trim().max(180).optional(),
  allow_external_lookup: z.boolean().optional().describe("Explicit consent to send derived search keywords to the configured external data source.")
}).strict();

export const projectIdInputSchema = z.object({
  project_id: z.string().trim().min(1).max(120)
}).strict();

export const projectOrIdeaInputSchema = z.union([
  projectIdInputSchema,
  z.object({ idea: z.string().trim().min(20).max(3000) }).strict()
]);

export const findOpportunitiesInputSchema = z.object({
  category: z.string().trim().max(80).optional(),
  audience: z.string().trim().max(180).optional(),
  max_complexity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  min_score: z.number().int().min(0).max(100).optional()
}).strict();

export const evaluateBeforeBuildInputSchema = z.object({
  idea: z.string().trim().min(20).max(3000).optional(),
  project_id: z.string().trim().min(1).max(120).optional(),
  intended_build_scope: z.string().trim().max(1000).optional()
}).refine((value) => Boolean(value.idea) !== Boolean(value.project_id), {
  message: "Provide exactly one of idea or project_id."
});

const dimensionExplanationSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(10),
  weighted_points: z.number(),
  max_points: z.number(),
  confidence: z.number().min(0).max(1),
  evidence_count: z.number().int().nonnegative(),
  strong_signals: z.number().int().nonnegative(),
  reason: z.string()
});

const costRangeSchema = z.object({ min: z.number().nonnegative(), likely: z.number().nonnegative(), max: z.number().nonnegative() });

export const buildEstimateSchema = z.object({
  complexity: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  estimated_hours: costRangeSchema,
  estimated_ai_tokens: costRangeSchema,
  screens: z.number().int().nonnegative(),
  integrations: z.number().int().nonnegative(),
  roles: z.number().int().nonnegative(),
  backend_complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  external_dependencies: z.array(z.string()),
  risk_factors: z.array(z.string()),
  estimation_note: z.string()
});

export const validateIdeaOutputSchema = z.object({
  project: z.object({ id: z.string(), name: z.string(), status: z.string(), is_demo: z.boolean() }),
  build_score: z.number().int().min(0).max(100),
  confidence_score: z.number().int().min(0).max(100),
  verdict: z.enum(["BUILD", "VALIDATE_FIRST", "PIVOT", "KILL"]),
  decision: agentDecisionSchema,
  scores: z.record(z.string(), dimensionExplanationSchema),
  top_risks: z.array(z.string()),
  market_evidence_summary: z.object({
    provider: z.string(),
    mode: z.enum(["demo", "live", "fallback"]),
    warnings: z.array(z.string()),
    total_signals: z.number().int().nonnegative(),
    source_count: z.number().int().nonnegative(),
    strong_signals: z.number().int().nonnegative(),
    provenance: z.object({ observed: z.number().int(), inferred: z.number().int(), generated: z.number().int() }),
    demo_data: z.boolean(),
    top_signals: z.array(z.object({ id: z.string(), type: z.string(), strength: z.string(), provenance: z.string(), reliability: z.number(), summary: z.string() }))
  }),
  competition_summary: z.object({ level: z.enum(["LOW", "MEDIUM", "HIGH"]), competitor_count: z.number().int(), market_gap: z.string() }),
  distribution_summary: z.object({ level: z.enum(["WEAK", "MEDIUM", "STRONG"]), best_channel: z.string(), reachable_channels: z.array(z.string()) }),
  build_estimate: buildEstimateSchema,
  recommendation: z.object({ summary: z.string(), minimum_scope: z.string(), hypothesis: z.string() }),
  suggested_next_action: z.object({ type: nextActionTypeSchema, description: z.string() })
});

export const roastIdeaOutputSchema = z.object({
  project_id: z.string(),
  fatal_risks: z.array(z.string()),
  major_risks: z.array(z.string()),
  assumptions: z.array(z.string()),
  existing_alternatives: z.array(z.string()),
  distribution_risks: z.array(z.string()),
  willingness_to_pay_risks: z.array(z.string()),
  what_would_change_our_mind: z.array(z.string()),
  recommended_action: z.string(),
  suggested_pivots: z.array(z.object({ concept: z.string(), estimated_score: z.number(), score_status: z.literal("HYPOTHETICAL") }))
});

export const validationMvpOutputSchema = z.object({
  project_id: z.string(),
  core_hypothesis: z.string(),
  riskiest_assumption: z.string(),
  minimum_testable_product: z.object({ name: z.string(), outcome: z.string() }),
  include: z.array(z.string()),
  exclude: z.array(z.string()),
  estimated_build_time: z.string(),
  estimated_complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  success_metrics: z.array(z.string()),
  validation_plan: z.array(z.string())
});

export const opportunityOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  problem: z.string(),
  target_customer: z.string(),
  opportunity_score: z.number(),
  confidence_score: z.number(),
  evidence_count: z.number(),
  competition: z.enum(["LOW", "MEDIUM", "HIGH"]),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  potential_pricing: z.object({ min: z.number(), max: z.number(), currency: z.literal("USD"), cadence: z.literal("MONTH") }),
  why_now: z.string(),
  is_demo: z.boolean()
});

export const fullBuildEvaluationSchema = z.object({
  should_build_full_product: z.boolean(),
  decision: agentDecisionSchema,
  confidence: z.number().min(0).max(1),
  estimated_cost: buildEstimateSchema,
  risks: z.array(z.string()),
  recommended_scope: z.object({ name: z.string(), include: z.array(z.string()), exclude: z.array(z.string()) }),
  reason: z.string(),
  warning: z.object({
    code: z.literal("FULL_BUILD_NOT_RECOMMENDED"),
    reason: z.string(),
    estimated_waste: z.object({ development_hours: z.string(), ai_tokens: z.string() }),
    alternative: z.string()
  }).optional()
});

export type AgentDecision = z.infer<typeof agentDecisionSchema>;
export type ValidateIdeaOutput = z.infer<typeof validateIdeaOutputSchema>;
export type BuildEstimateOutput = z.infer<typeof buildEstimateSchema>;
export type FullBuildEvaluation = z.infer<typeof fullBuildEvaluationSchema>;
