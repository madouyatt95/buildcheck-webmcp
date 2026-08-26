import type { Analysis } from "@/lib/domain/types";

export function summarizeEvidence(analysis: Analysis) {
  const provenance = { observed: 0, inferred: 0, generated: 0 };
  analysis.signals.forEach((signal) => { provenance[signal.provenance] += 1; });
  return {
    totalSignals: analysis.signals.length,
    sourceCount: new Set(analysis.signals.map((signal) => signal.source)).size,
    strongSignals: analysis.signals.filter((signal) => signal.strength === "strong").length,
    provenance,
    topSignals: analysis.signals.slice(0, 5)
  };
}
