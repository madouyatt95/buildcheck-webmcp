import type {
  BuildComplexityEstimate,
  Competitor,
  DistributionChannel,
  MarketSignal,
  ScoreDimension,
  StructuredIdea
} from "@/lib/domain/types";
import { getVerdict } from "@/lib/scoring/verdict";

const strength = { weak: 0.45, moderate: 0.75, strong: 1 } as const;

interface ScoringInput {
  idea: StructuredIdea;
  signals: MarketSignal[];
  competitors: Competitor[];
  channels: DistributionChannel[];
  complexity: BuildComplexityEstimate;
  asOf?: string;
}

const dimensionConfig = {
  demand: { label: "Demand", maxPoints: 25 },
  pain: { label: "Pain", maxPoints: 20 },
  willingnessToPay: { label: "Willingness to pay", maxPoints: 15 },
  distribution: { label: "Distribution", maxPoints: 15 },
  competitionOpportunity: { label: "Competition gap", maxPoints: 10 },
  buildSimplicity: { label: "Build simplicity", maxPoints: 10 },
  defensibility: { label: "Defensibility", maxPoints: 5 }
} as const;

function recencyWeight(signal: MarketSignal, asOf: string): number {
  const ageDays = Math.max(0, (new Date(asOf).getTime() - new Date(signal.collectedAt).getTime()) / 86_400_000);
  if (ageDays <= 90) return 1;
  if (ageDays <= 365) return 0.85;
  if (ageDays <= 730) return 0.65;
  return 0.45;
}

function evidenceScore(signals: MarketSignal[], types: MarketSignal["signalType"][], asOf: string): number {
  const matches = signals.filter((signal) => types.includes(signal.signalType));
  const perSource = new Map<string, number>();
  return matches.reduce((total, signal) => {
    if (signal.provenance === "generated") return total;
    const existingSourceWeight = perSource.get(signal.source) || 0;
    const diminishingReturn = existingSourceWeight >= 2 ? 0.35 : existingSourceWeight >= 1 ? 0.65 : 1;
    perSource.set(signal.source, existingSourceWeight + 1);
    const provenanceWeight = signal.provenance === "observed" ? 1 : 0.82;
    return total + strength[signal.strength] * signal.reliability * provenanceWeight * recencyWeight(signal, asOf) * diminishingReturn;
  }, 0);
}

function idsFor(signals: MarketSignal[], types: MarketSignal["signalType"][]): string[] {
  return signals.filter((signal) => types.includes(signal.signalType) && signal.provenance !== "generated").map((signal) => signal.id);
}

function clamp(value: number, minimum = 0, maximum = 10): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function rounded(value: number): number {
  return Math.round(value * 10) / 10;
}

function makeDimension(
  key: keyof typeof dimensionConfig,
  score: number,
  justification: string,
  evidenceIds: string[]
): ScoreDimension {
  const config = dimensionConfig[key];
  const safeScore = rounded(clamp(score));
  return {
    key,
    label: config.label,
    score: safeScore,
    maxPoints: config.maxPoints,
    weightedPoints: rounded((safeScore / 10) * config.maxPoints),
    justification,
    evidenceIds
  };
}

export function calculateBuildScore(input: ScoringInput) {
  const { signals, competitors, channels, idea, complexity } = input;
  const asOf = input.asOf || new Date().toISOString();
  const demandTypes: MarketSignal["signalType"][] = [
    "demand",
    "market_growth",
    "feature_request",
    "workaround"
  ];
  const painTypes: MarketSignal["signalType"][] = [
    "pain",
    "competitor_complaint",
    "workaround",
    "churn_risk"
  ];
  const paymentTypes: MarketSignal["signalType"][] = ["willingness_to_pay"];
  const distributionTypes: MarketSignal["signalType"][] = ["distribution"];

  const demandEvidence = evidenceScore(signals, demandTypes, asOf);
  const painEvidence = evidenceScore(signals, painTypes, asOf);
  const paymentEvidence = evidenceScore(signals, paymentTypes, asOf);
  const distributionEvidence = evidenceScore(signals, distributionTypes, asOf);

  const broadAudiencePenalty = idea.targetCustomer.split(/\s+/).filter(Boolean).length <= 2 ? 1.25 : 0;
  const demand = clamp(1 + demandEvidence * 3.55 - broadAudiencePenalty);
  const pain = clamp(1.5 + painEvidence * 3.3);
  const paidCompetitors = competitors.filter((competitor) => competitor.pricing !== "Free").length;
  const freeAlternatives = competitors.filter((competitor) => competitor.pricing === "Free").length;
  const willingnessToPay = clamp(
    1.2 + paymentEvidence * 5.2 + paidCompetitors * 0.65 - freeAlternatives * 1.3
  );
  const strongChannels = channels.filter((channel) => channel.potential === "Strong").length;
  const distribution = clamp(1.5 + distributionEvidence * 4.6 + strongChannels * 1.5 - broadAudiencePenalty);
  const weaknesses = competitors.reduce((sum, competitor) => sum + competitor.weaknesses.length, 0);
  const nicheSpecificity = idea.targetCustomer.split(/\s+/).filter(Boolean).length >= 4 ? 2.2 : 0;
  const competitionOpportunity = clamp(
    2 + weaknesses * 0.55 + painEvidence * 0.25 + nicheSpecificity + strongChannels * 0.4 - broadAudiencePenalty - freeAlternatives * 2 - Math.max(0, competitors.length - 3) * 0.6
  );
  const buildSimplicity = clamp(10 - complexity.points / 8);
  const defensibility = clamp(1.8 + nicheSpecificity - broadAudiencePenalty + Math.min(3, painEvidence * 0.7));

  const dimensions = [
    makeDimension(
      "demand",
      demand,
      demandEvidence >= 3
        ? "Several independent signals point to repeated demand or active workarounds."
        : "Demand is plausible, but the current evidence base is still thin.",
      idsFor(signals, demandTypes)
    ),
    makeDimension(
      "pain",
      pain,
      painEvidence >= 3
        ? "Users describe a recurring, costly frustration in concrete terms."
        : "The problem is visible, but urgency and frequency need direct validation.",
      idsFor(signals, painTypes)
    ),
    makeDimension(
      "willingnessToPay",
      willingnessToPay,
      paymentEvidence >= 1.5
        ? "Payment language and existing paid alternatives support monetization."
        : "Paid competitors help, but explicit willingness-to-pay evidence is limited.",
      idsFor(signals, paymentTypes)
    ),
    makeDimension(
      "distribution",
      distribution,
      strongChannels > 0
        ? `${strongChannels} channel${strongChannels > 1 ? "s" : ""} offers concentrated access to the target audience.`
        : "No clearly concentrated acquisition channel has been proven yet.",
      idsFor(signals, distributionTypes)
    ),
    makeDimension(
      "competitionOpportunity",
      competitionOpportunity,
      competitors.length === 0
        ? "No competitor dataset is available, so the apparent gap is low confidence."
        : `${competitors.length} alternatives validate the category; recurring weaknesses create a possible wedge.`,
      idsFor(signals, ["competitor_complaint", "churn_risk"])
    ),
    makeDimension(
      "buildSimplicity",
      buildSimplicity,
      `${complexity.level} implementation complexity, driven by ${complexity.drivers.join(", ")}.`,
      []
    ),
    makeDimension(
      "defensibility",
      defensibility,
      nicheSpecificity > 0
        ? "A specific audience creates room for proprietary workflow data and positioning."
        : "The idea needs a narrower wedge or compounding advantage to resist imitation.",
      idsFor(signals, ["workaround", "pain"])
    )
  ];

  const score = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.weightedPoints, 0));

  return { score, verdict: getVerdict(score), dimensions };
}
