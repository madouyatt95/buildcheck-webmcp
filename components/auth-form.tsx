"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import { Brand } from "@/components/brand";
import { useLanguage } from "@/components/language-provider";

export function LoginForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get("email") || String(data.get("password") || "").length < 6) {
      setError(t("Enter an email and a password of at least 6 characters."));
      return;
    }
    window.localStorage.setItem("buildcheck-demo-auth", "true");
    router.push("/dashboard");
  }
  return <form className="auth-form" onSubmit={submit}><Link href="/"><Brand /></Link><span className="eyebrow">{t("Welcome back")}</span><h1>{t("Make the next idea earn its roadmap.")}</h1><p className="muted">{t("Any valid demo credentials work locally.")}</p><div className="stack" style={{ marginTop: 27 }}><div className="field"><label htmlFor="email">{t("Email")}</label><input id="email" name="email" type="email" defaultValue="alex@buildcheck.demo" autoComplete="email" /></div><div className="field"><div className="row between"><label htmlFor="password">{t("Password")}</label><Link className="tiny" href="/forgot-password">{t("Forgot password?")}</Link></div><input id="password" name="password" type="password" defaultValue="buildcheck" autoComplete="current-password" /></div></div>{error && <p role="alert" style={{ color: "var(--red)", fontSize: 12, marginTop: 12 }}>{error}</p>}<button className="button primary wide full" style={{ marginTop: 20 }}>{t("Sign in")} <ArrowRight /></button><p className="auth-form-footer">{t("New to BuildCheck?")} <Link href="/signup" style={{ color: "var(--green)" }}>{t("Create a demo account")}</Link></p></form>;
}

export function SignupForm() {
  const router = useRouter();
  const { t } = useLanguage();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/onboarding");
  }
  return <form className="auth-form" onSubmit={submit}><Link href="/"><Brand /></Link><span className="eyebrow">{t("Create workspace")}</span><h1>{t("Decide what deserves to exist.")}</h1><p className="muted">{t("Demo signup stays on this device. Supabase Auth is represented in the migration, but not connected.")}</p><div className="stack" style={{ marginTop: 27 }}><div className="field"><label htmlFor="name">{t("First name")}</label><input id="name" required placeholder="Alex" /></div><div className="field"><label htmlFor="signup-email">{t("Email")}</label><input id="signup-email" required type="email" placeholder="you@company.com" /></div><div className="field"><label htmlFor="signup-password">{t("Password")}</label><input id="signup-password" required minLength={8} type="password" placeholder={t("8 characters minimum")} /></div></div><button className="button primary wide full" style={{ marginTop: 20 }}>{t("Continue")} <ArrowRight /></button><p className="auth-form-footer">{t("Already have an account?")} <Link href="/login" style={{ color: "var(--green)" }}>{t("Sign in")}</Link></p></form>;
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { t } = useLanguage();
  function submit(event: FormEvent) { event.preventDefault(); setSent(true); }
  return <form className="auth-form" onSubmit={submit}><Link href="/"><Brand /></Link>{sent ? <><span className="feature-icon"><Check /></span><h1>{t("Check your inbox.")}</h1><p className="muted">{t("Demo mode does not send email. In production, Supabase Auth would issue a one-time recovery link.")}</p><Link className="button primary wide full" style={{ marginTop: 22 }} href="/login">{t("Back to sign in")}</Link></> : <><span className="eyebrow">{t("Account recovery")}</span><h1>{t("Reset your password.")}</h1><p className="muted">{t("Enter the email attached to your workspace.")}</p><div className="field" style={{ marginTop: 26 }}><label htmlFor="recovery-email">{t("Email")}</label><input id="recovery-email" required type="email" placeholder="you@company.com" /></div><button className="button primary wide full" style={{ marginTop: 20 }}><Mail /> {t("Send recovery link")}</button><p className="auth-form-footer"><Link href="/login">{t("Back to sign in")}</Link></p></>}</form>;
}
