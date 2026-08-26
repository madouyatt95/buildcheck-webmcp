import type { Analysis } from "@/lib/domain/types";

export function summarizeDistribution(analysis: Analysis) {
  const score = analysis.dimensions.find((item) => item.key === "distribution")?.score || 0;
  return {
    level: score >= 7 ? "STRONG" as const : score >= 4.5 ? "MEDIUM" as const : "WEAK" as const,
    bestChannel: analysis.channels[0]?.name || "NOT_ESTABLISHED",
    reachableChannels: analysis.channels.filter((channel) => channel.potential !== "Low").map((channel) => channel.name)
  };
}
