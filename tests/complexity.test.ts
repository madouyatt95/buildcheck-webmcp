import { describe, expect, it } from "vitest";
import { estimateBuildComplexity } from "@/lib/scoring/complexity";

describe("estimateBuildComplexity", () => {
  it("keeps a small manual test in the low band", () => {
    const result = estimateBuildComplexity({ screens: 2, integrations: 0, roles: 1, entities: 2, hasAuth: false, hasPayments: false, hasRealtime: false, hasNativeApp: false, aiFeatures: 0 });
    expect(result.level).toBe("Low");
    expect(result.estimatedHours[0]).toBeLessThan(result.estimatedHours[1]);
  });

  it("penalizes integrations, payments, realtime and native delivery", () => {
    const simple = estimateBuildComplexity({ screens: 4, integrations: 0, roles: 1, entities: 3, hasAuth: true, hasPayments: false, hasRealtime: false, hasNativeApp: false, aiFeatures: 0 });
    const complex = estimateBuildComplexity({ screens: 10, integrations: 4, roles: 3, entities: 9, hasAuth: true, hasPayments: true, hasRealtime: true, hasNativeApp: true, aiFeatures: 3 });
    expect(complex.points).toBeGreaterThan(simple.points);
    expect(complex.estimatedTokens).toBeGreaterThan(simple.estimatedTokens);
    expect(complex.level).toBe("Very high");
  });
});
