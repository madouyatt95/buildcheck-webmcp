"use client";

import { Brand } from "@/components/brand";
import { useLanguage } from "@/components/language-provider";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return <main className="auth-layout"><section className="auth-art"><Brand /><div className="auth-quote"><span className="eyebrow">{t("Build less. Learn faster.")}</span><h1 style={{ marginTop: 14 }}>{t("The most valuable feature may be the one you never build.")}</h1><p className="muted">{t("BuildCheck turns assumptions into evidence, scores and a minimum test.")}</p></div><span className="tiny">{t("Demo workspace · External lookups require consent")}</span></section><section className="auth-panel">{children}</section></main>;
}
