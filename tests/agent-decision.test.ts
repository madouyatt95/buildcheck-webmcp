import { describe, expect, it } from "vitest";
import { z } from "zod";
import { agentDecisionSchema, fullBuildEvaluationSchema, validateIdeaInputSchema, validateIdeaOutputSchema } from "@/lib/agent/schemas";
import { createDemoProjects } from "@/lib/demo/seed";
import { buildAgentDecision, buildValidateIdeaOutput, evaluateBeforeBuild } from "@/lib/services/agent-decision-service";

describe("agent decision contract", () => {
  it("publishes a JSON Schema-compatible narrow input", () => {
    const schema = z.toJSONSchema(validateIdeaInputSchema);
    expect(schema.type).toBe("object");
    expect(schema.required).toContain("idea");
    expect(validateIdeaInputSchema.parse({ idea: "Invoice reminders for independent design consultants" })).toBeTruthy();
  });

  it("returns a machine-readable validate_idea result", async () => {
    const projects = await createDemoProjects();
    const project = projects.find((item) => item.id === "invoiceflow");
    expect(project).toBeTruthy();
    const output = buildValidateIdeaOutput(project!);
    expect(() => validateIdeaOutputSchema.parse(output)).not.toThrow();
    expect(output.scores.demand?.reason).toBeTruthy();
    expect(output.market_evidence_summary.provenance.inferred).toBeGreaterThan(0);
  });

  it("returns INSUFFICIENT_EVIDENCE instead of treating missing data as positive", async () => {
    const [project] = await createDemoProjects();
    const analysis = project!.analyses[0]!;
    const decision = buildAgentDecision({ ...analysis, signals: [], confidenceScore: 0 });
    expect(() => agentDecisionSchema.parse(decision)).not.toThrow();
    expect(decision.decision).toBe("INSUFFICIENT_EVIDENCE");
    expect(decision.recommended_next_action.type).toBe("COLLECT_EVIDENCE");
  });

  it("warns instead of blocking when a full build is not justified", async () => {
    const projects = await createDemoProjects();
    const crm = projects.find((item) => item.id === "generic-ai-crm")!;
    const evaluation = evaluateBeforeBuild(crm.analyses[0]!, "full multi-platform SaaS");
    expect(() => fullBuildEvaluationSchema.parse(evaluation)).not.toThrow();
    expect(evaluation.should_build_full_product).toBe(false);
    expect(evaluation.warning?.code).toBe("FULL_BUILD_NOT_RECOMMENDED");
    expect(evaluation.warning?.alternative).toContain("validation MVP");
  });
});
