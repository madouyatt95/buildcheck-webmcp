import { describe, expect, it } from "vitest";
import type { MarketSignal } from "@/lib/domain/types";
import { calculateConfidenceScore } from "@/lib/scoring/confidence";

function signal(provenance: MarketSignal["provenance"]): MarketSignal {
  return { id: provenance, projectId: "p", source: "Source", sourceUrl: "#", title: "Signal", excerpt: "Example", signalType: "demand", strength: "strong", sentiment: "positive", createdAt: "2026-08-01T00:00:00Z", collectedAt: "2026-08-01T00:00:00Z", provenance, reliability: 1, isDemo: true };
}

describe("evidence provenance", () => {
  it("never counts generated material as market confidence", () => {
    expect(calculateConfidenceScore([signal("generated")], "2026-08-10T00:00:00Z")).toBe(0);
  });

  it("favors observed evidence over inferred evidence", () => {
    expect(calculateConfidenceScore([signal("observed")], "2026-08-10T00:00:00Z")).toBeGreaterThan(calculateConfidenceScore([signal("inferred")], "2026-08-10T00:00:00Z"));
  });
});
