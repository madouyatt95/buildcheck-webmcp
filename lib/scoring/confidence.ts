import type { MarketSignal } from "@/lib/domain/types";

const strengthValue = { weak: 0.35, moderate: 0.7, strong: 1 } as const;
const provenanceValue = { observed: 1, inferred: 0.82, generated: 0 } as const;

export function calculateConfidenceScore(signals: MarketSignal[], asOf = new Date().toISOString()): number {
  if (signals.length === 0) return 0;

  const eligible = signals.filter((signal) => signal.provenance !== "generated");
  if (eligible.length === 0) return 0;
  const sourceCount = new Set(eligible.map((signal) => signal.source)).size;
  const typeCount = new Set(eligible.map((signal) => signal.signalType)).size;
  const perSource = new Map<string, number>();
  const effectiveVolume = eligible.reduce((sum, signal) => {
    const sourceUses = perSource.get(signal.source) || 0;
    perSource.set(signal.source, sourceUses + 1);
    const sourceWeight = sourceUses >= 2 ? 0.3 : sourceUses === 1 ? 0.65 : 1;
    const ageDays = Math.max(0, (new Date(asOf).getTime() - new Date(signal.collectedAt).getTime()) / 86_400_000);
    const recency = ageDays <= 90 ? 1 : ageDays <= 365 ? 0.85 : ageDays <= 730 ? 0.65 : 0.45;
    return sum + strengthValue[signal.strength] * signal.reliability * provenanceValue[signal.provenance] * recency * sourceWeight;
  }, 0);
  const quality = eligible.reduce(
    (sum, signal) => sum + strengthValue[signal.strength] * signal.reliability * provenanceValue[signal.provenance],
    0
  ) / eligible.length;

  const volumeScore = Math.min(42, effectiveVolume * 6.2);
  const diversityScore = Math.min(22, sourceCount * 6);
  const coverageScore = Math.min(18, typeCount * 3);
  const qualityScore = quality * 18;

  return Math.min(96, Math.round(volumeScore + diversityScore + coverageScore + qualityScore));
}
