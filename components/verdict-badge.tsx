import type { Verdict } from "@/lib/domain/types";

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const tone = { BUILD: "build", "VALIDATE FIRST": "validate", PIVOT: "pivot", KILL: "kill" }[verdict];
  return <span className={`badge verdict-${tone}`}>{verdict}</span>;
}
