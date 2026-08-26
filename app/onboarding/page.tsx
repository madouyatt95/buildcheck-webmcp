"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Brand } from "@/components/brand";
import { useDemoStore } from "@/components/demo-store";
import { useLanguage } from "@/components/language-provider";

const buildOptions = ["SaaS", "Mobile apps", "AI tools", "Chrome extensions", "Developer tools", "Marketplaces", "Other"];
const goals = ["Find ideas", "Validate my ideas", "Avoid wasting time", "Find better niches", "Build faster"];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateProfile } = useDemoStore();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [builds, setBuilds] = useState("SaaS");
  const [goal, setGoal] = useState("Avoid wasting time");
  function finish() { updateProfile({ builds, goal, onboardingComplete: true }); router.push("/dashboard"); }
  return <AuthLayout><div className="auth-form"><Brand /><span className="eyebrow">{t("Onboarding")} · {step} {t("of")} 2</span><h1>{t(step === 1 ? "What do you usually build?" : "What’s your main goal?")}</h1><p className="muted">{t("This tunes the opportunity feed and recommendations.")}</p><div className="choice-grid">{(step === 1 ? buildOptions : goals).map((item) => <button key={item} className={`choice ${(step === 1 ? builds : goal) === item ? "active" : ""}`} onClick={() => step === 1 ? setBuilds(item) : setGoal(item)}>{t(item)}</button>)}</div><button className="button primary wide full" style={{ marginTop: 22 }} onClick={() => step === 1 ? setStep(2) : finish()}>{t(step === 1 ? "Continue" : "Open workspace")} <ArrowRight /></button></div></AuthLayout>;
}
