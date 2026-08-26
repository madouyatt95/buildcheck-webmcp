import type { Analysis } from "@/lib/domain/types";

export function summarizeCompetition(analysis: Analysis) {
  const opportunity = analysis.dimensions.find((item) => item.key === "competitionOpportunity");
  return {
    level: analysis.competitors.length >= 3 ? "HIGH" as const : analysis.competitors.length >= 2 ? "MEDIUM" as const : "LOW" as const,
    competitorCount: analysis.competitors.length,
    marketGap: opportunity?.justification || "Not enough competitor evidence."
  };
}
