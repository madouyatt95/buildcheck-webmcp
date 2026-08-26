import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/providers/mock-ai-provider";
import { MockDataSourceProvider } from "@/lib/providers/mock-data-source-provider";
import { estimateBuildComplexity } from "@/lib/scoring/complexity";
import { calculateBuildScore } from "@/lib/scoring/engine";

describe("calculateBuildScore", () => {
  it("is deterministic and its weights sum to 100", async () => {
    const ai = new MockAIProvider();
    const sources = new MockDataSourceProvider();
    const idea = await ai.structureIdea({ description: "Automated overdue invoice follow-up for independent consultants", targetCustomer: "Independent design consultants", marketType: "B2B" });
    const evidence = await sources.collect(idea, "test-project");
    const complexity = estimateBuildComplexity({ screens: 4, integrations: 1, roles: 1, entities: 4, hasAuth: true, hasPayments: true, hasRealtime: false, hasNativeApp: false, aiFeatures: 0 });
    const first = calculateBuildScore({ idea, ...evidence, complexity });
    const second = calculateBuildScore({ idea, ...evidence, complexity });
    expect(first).toEqual(second);
    expect(first.dimensions.reduce((sum, item) => sum + item.maxPoints, 0)).toBe(100);
    expect(first.score).toBe(Math.round(first.dimensions.reduce((sum, item) => sum + item.weightedPoints, 0)));
    expect(first.dimensions.every((item) => item.score >= 0 && item.score <= 10)).toBe(true);
  });

  it("never lets the mock AI invent a summary without evidence", async () => {
    const ai = new MockAIProvider();
    const idea = await ai.structureIdea({ description: "A brand new undefined product category for one audience" });
    await expect(ai.summarizeEvidence(idea, [])).resolves.toBe("Not enough evidence.");
  });
});
