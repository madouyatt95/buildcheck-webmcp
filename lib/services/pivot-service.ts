import type { Analysis } from "@/lib/domain/types";

export function getHypotheticalPivots(analysis: Analysis) {
  return analysis.pivots.map((pivot) => ({ ...pivot, scoreStatus: "HYPOTHETICAL" as const }));
}
