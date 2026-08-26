import type { ProjectStatus, Verdict } from "@/lib/domain/types";

export function getVerdict(score: number): Verdict {
  if (score >= 80) return "BUILD";
  if (score >= 60) return "VALIDATE FIRST";
  if (score >= 40) return "PIVOT";
  return "KILL";
}

export function verdictToStatus(verdict: Verdict): ProjectStatus {
  return {
    BUILD: "build",
    "VALIDATE FIRST": "validate",
    PIVOT: "pivot",
    KILL: "kill"
  }[verdict] as ProjectStatus;
}
