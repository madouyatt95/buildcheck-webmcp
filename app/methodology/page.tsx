"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Database, Scale, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { useLanguage } from "@/components/language-provider";

export default function MethodologyPage() {
  const { t } = useLanguage();
  return <main className="marketing"><nav className="marketing-nav"><Link href="/"><Brand /></Link><Link href="/" className="button ghost"><ArrowLeft /> {t("Back")}</Link></nav><article className="page narrow" style={{ paddingTop: 70 }}><span className="eyebrow">{t("Methodology")}</span><h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", marginTop: 12 }}>{t("A score you can disagree with — and inspect.")}</h1><p className="subtitle" style={{ fontSize: 18 }}>{t("BuildCheck separates evidence collection, interpretation and scoring so an AI provider can never manufacture market proof or choose the final number.")}</p><section className="section score-grid">{[
    [Database, "1. Collect", "A DataSourceProvider returns explicit market signals, competitors and channels. In V1, every record comes from a curated demo scenario and is marked isDemo=true."],
    [ShieldCheck, "2. Interpret", "An AIProvider may structure the idea, classify supplied signals and draft recommendations. With no signals, it must return Not enough evidence."],
    [Scale, "3. Score", "Pure TypeScript functions score seven dimensions: Demand 25, Pain 20, Willingness to pay 15, Distribution 15, Competition gap 10, Build simplicity 10 and Defensibility 5."],
    [CheckCircle2, "4. Decide", "Code maps 80–100 to BUILD, 60–79 to VALIDATE FIRST, 40–59 to PIVOT and 0–39 to KILL. Confidence is calculated separately from evidence coverage and quality."]
  ].map(([Icon, title, text]) => { const C = Icon as typeof Database; return <section className="card card-pad" key={String(title)}><span className="feature-icon"><C /></span><h2>{t(String(title))}</h2><p className="muted" style={{ marginBottom: 0 }}>{t(String(text))}</p></section>; })}</section><section className="card card-pad section" id="demo-data"><span className="eyebrow">{t("Demo data policy")}</span><h2 style={{ marginTop: 10 }}>{t("No live-source claims.")}</h2><p className="muted">{t("Names such as “Demo interview”, “Demo app review” and “Demo pricing study” describe scenario categories, not completed research. Quotes in the UI are product-writing examples. They must be replaced record by record as compliant providers are connected.")}</p><Link href="/validate" className="button primary">{t("Run a demo analysis")}</Link></section></article></main>;
}
