import { describe, expect, it } from "vitest";
import type { MarketSignal } from "@/lib/domain/types";
import type { DataSourceProvider, EvidenceBundle } from "@/lib/providers/contracts";
import { MultiSourceDataSourceProvider } from "@/lib/providers/multi-source-data-source-provider";

const idea = {
  name: "Invoice assistant",
  tagline: "For freelancers",
  description: "Automate invoice follow-up.",
  problem: "Late invoices require manual work.",
  targetCustomer: "Freelancers",
  businessModel: "Subscription",
  geography: "Global",
  marketType: "B2B" as const,
  keywords: ["invoice", "overdue", "freelance"],
  explicitCompetitors: []
};

function signal(source: string, index: number): MarketSignal {
  return {
    id: `${source}-${index}`,
    projectId: "project",
    source,
    sourceUrl: `https://example.test/${source}/${index}`,
    title: `${source} signal ${index}`,
    excerpt: "Observed evidence",
    signalType: "demand",
    strength: "moderate",
    sentiment: "neutral",
    createdAt: "2026-08-20T08:00:00.000Z",
    collectedAt: "2026-08-26T10:00:00.000Z",
    provenance: "observed",
    reliability: 0.65,
    isDemo: false
  };
}

function liveProvider(name: string, count: number): DataSourceProvider {
  return {
    name,
    async collect(): Promise<EvidenceBundle> {
      return {
        signals: Array.from({ length: count }, (_, index) => signal(name, index + 1)),
        competitors: [],
        channels: [],
        meta: { providerId: name, providerName: name, mode: "live", warnings: [`${name} caveat`] }
      };
    }
  };
}

const failedProvider: DataSourceProvider = {
  name: "Failed source",
  async collect(): Promise<EvidenceBundle> {
    throw new Error("upstream detail that must not leak");
  }
};

describe("MultiSourceDataSourceProvider", () => {
  it("combines live evidence while enforcing a per-source cap", async () => {
    const provider = new MultiSourceDataSourceProvider([
      { id: "first", provider: liveProvider("First", 9), maxSignals: 6 },
      { id: "second", provider: liveProvider("Second", 8), maxSignals: 6 }
    ]);

    const result = await provider.collect(idea, "project");

    expect(result.meta).toMatchObject({ providerId: "first+second", mode: "live" });
    expect(result.signals).toHaveLength(12);
    expect(result.signals.filter((item) => item.source === "First")).toHaveLength(6);
    expect(result.signals.filter((item) => item.source === "Second")).toHaveLength(6);
  });

  it("keeps remaining live data on a partial source failure", async () => {
    const provider = new MultiSourceDataSourceProvider([
      { id: "working", provider: liveProvider("Working", 2) },
      { id: "failed", provider: failedProvider }
    ]);

    const result = await provider.collect(idea, "project");

    expect(result.meta.mode).toBe("live");
    expect(result.signals).toHaveLength(2);
    expect(result.signals.every((item) => !item.isDemo)).toBe(true);
    expect(result.meta.warnings.join(" ")).toContain("remaining live source");
    expect(result.meta.warnings.join(" ")).not.toContain("upstream detail");
  });

  it("uses one clearly labeled mock fallback only when every source fails", async () => {
    const provider = new MultiSourceDataSourceProvider([
      { id: "first", provider: failedProvider },
      { id: "second", provider: failedProvider }
    ]);

    const result = await provider.collect(idea, "project");

    expect(result.meta.mode).toBe("fallback");
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.signals.every((item) => item.isDemo)).toBe(true);
  });

  it("does not invent mock evidence when live queries succeed with zero matches", async () => {
    const provider = new MultiSourceDataSourceProvider([
      { id: "empty", provider: liveProvider("Empty", 0) }
    ]);

    const result = await provider.collect(idea, "project");

    expect(result.meta.mode).toBe("live");
    expect(result.signals).toEqual([]);
  });
});
