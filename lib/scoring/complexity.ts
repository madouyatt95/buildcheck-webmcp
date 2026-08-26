import type {
  BuildComplexityEstimate,
  BuildComplexityInput
} from "@/lib/domain/types";

export function estimateBuildComplexity(
  input: BuildComplexityInput
): BuildComplexityEstimate {
  let points = input.screens * 1.4 + input.integrations * 4 + input.roles * 2;
  points += input.entities * 1.1 + input.aiFeatures * 3;
  if (input.hasAuth) points += 4;
  if (input.hasPayments) points += 7;
  if (input.hasRealtime) points += 8;
  if (input.hasNativeApp) points += 10;

  const roundedPoints = Math.round(points);
  const level =
    roundedPoints < 24
      ? "Low"
      : roundedPoints < 43
        ? "Medium"
        : roundedPoints < 65
          ? "High"
          : "Very high";
  const minimumHours = Math.max(8, Math.round(points * 1.25));
  const maximumHours = Math.round(minimumHours * 1.65);
  const estimatedTokens = Math.round(points * 72_000);

  const drivers: string[] = [];
  if (input.integrations > 1) drivers.push(`${input.integrations} external integrations`);
  if (input.hasPayments) drivers.push("payment lifecycle");
  if (input.hasRealtime) drivers.push("realtime state");
  if (input.hasNativeApp) drivers.push("native mobile delivery");
  if (input.aiFeatures > 0) drivers.push(`${input.aiFeatures} AI workflow${input.aiFeatures > 1 ? "s" : ""}`);
  if (drivers.length === 0) drivers.push("standard product workflow");

  return {
    level,
    points: roundedPoints,
    estimatedHours: [minimumHours, maximumHours],
    estimatedTokens,
    debuggingIterations: Math.max(3, Math.round(points / 2.5)),
    drivers
  };
}
