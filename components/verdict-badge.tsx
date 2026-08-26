"use client";

import type { Verdict } from "@/lib/domain/types";
import { useLanguage } from "@/components/language-provider";

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { t } = useLanguage();
  const tone = { BUILD: "build", "VALIDATE FIRST": "validate", PIVOT: "pivot", KILL: "kill" }[verdict];
  return <span className={`badge verdict-${tone}`}>{t(verdict)}</span>;
}
