import { describe, expect, it } from "vitest";
import type { MarketSignal } from "@/lib/domain/types";
import { calculateConfidenceScore } from "@/lib/scoring/confidence";

function makeSignal(index: number, strength: MarketSignal["strength"], source = "Demo source"): MarketSignal {
  return { id: `s-${index}`, projectId: "p", source, sourceUrl: "/methodology", title: "Signal", excerpt: "Evidence", signalType: index % 2 ? "pain" : "demand", strength, sentiment: "neutral", createdAt: "2026-01-01T00:00:00Z", collectedAt: "2026-01-01T00:00:00Z", provenance: "observed", reliability: 0.9, isDemo: true };
}

describe("calculateConfidenceScore", () => {
  it("returns zero with no evidence", () => expect(calculateConfidenceScore([])).toBe(0));
  it("rewards stronger and more diverse evidence", () => {
    const weak = [makeSignal(1, "weak")];
    const diverse = [makeSignal(1, "strong", "A"), makeSignal(2, "strong", "B"), makeSignal(3, "moderate", "C")];
    expect(calculateConfidenceScore(diverse, "2026-02-01T00:00:00Z")).toBeGreaterThan(calculateConfidenceScore(weak, "2026-02-01T00:00:00Z"));
    expect(calculateConfidenceScore(diverse, "2026-02-01T00:00:00Z")).toBeLessThanOrEqual(96);
  });
});
