"use client";

import type { CSSProperties } from "react";
import { useLanguage } from "@/components/language-provider";

export function ScoreRing({ score, label = "Build score" }: { score: number; label?: string }) {
  const { t } = useLanguage();
  const tone = score < 40 ? "red" : score < 80 ? "orange" : "";
  return (
    <div className={`score-ring ${tone}`} style={{ "--score": score } as CSSProperties} aria-label={`${t(label)} : ${score} ${t("out of 100")}`}>
      <div className="score-ring-content">
        <div className="score-ring-value">{score}<small>/100</small></div>
        <div className="score-ring-label">{t(label)}</div>
      </div>
    </div>
  );
}
