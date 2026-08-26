"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Check, Flame, LockKeyhole, Sparkles } from "lucide-react";
import { z } from "zod";
import { useDemoStore } from "@/components/demo-store";
import type { IdeaInput } from "@/lib/domain/types";
import type { ServerDataSourceId } from "@/lib/providers/server-provider-factory";

const ideaSchema = z.object({
  description: z.string().trim().min(20, "Describe the idea in at least 20 characters.").max(3000),
  name: z.string().max(80).optional(),
  targetCustomer: z.string().max(180).optional(),
  problem: z.string().max(400).optional(),
  businessModel: z.string().max(180).optional(),
  competitors: z.string().max(500).optional(),
  geography: z.string().max(100).optional(),
  links: z.string().max(600).optional()
});

const steps = [
  "Understanding your idea",
  "Loading market signals",
  "Mapping competitors",
  "Analyzing user pain",
  "Evaluating distribution",
  "Estimating build complexity",
  "Calculating Build Score",
  "Preparing recommendations"
];

function liveSourceCopy(dataSource: ServerDataSourceId): { label: string; domains: string; provider: string } {
  if (dataSource === "hacker-news+github") return { label: "Hacker News + GitHub Issues", domains: "hn.algolia.com and api.github.com", provider: "Hacker News + GitHub Issues" };
  if (dataSource === "github") return { label: "GitHub Issues", domains: "api.github.com", provider: "GitHub Issues" };
  return { label: "Hacker News", domains: "hn.algolia.com", provider: "Hacker News" };
}

export function ValidationForm({ initialRoast = false, initialIdea, dataSource = "mock" }: { initialRoast?: boolean; initialIdea?: Partial<IdeaInput>; dataSource?: ServerDataSourceId }) {
  const router = useRouter();
  const { addIdea } = useDemoStore();
  const [mode, setMode] = useState<"simple" | "detailed">("simple");
  const [roast, setRoast] = useState(initialRoast);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [allowExternalLookup, setAllowExternalLookup] = useState(false);
  const [form, setForm] = useState<IdeaInput>({ description: "", marketType: "B2B", ...initialIdea });
  const usesLiveSource = dataSource !== "mock";
  const sourceCopy = liveSourceCopy(dataSource);

  function update<K extends keyof IdeaInput>(key: K, value: IdeaInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = ideaSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Check the form and try again.");
      return;
    }
    setError("");
    setProcessing(true);
    setStep(0);
    const analysisPromise = addIdea({ ...form, allowExternalLookup });
    for (let index = 0; index < steps.length; index += 1) {
      setStep(index);
      await new Promise((resolve) => window.setTimeout(resolve, 165));
    }
    const project = await analysisPromise;
    router.push(`/projects/${project.id}${roast ? "?tab=roast" : ""}`);
  }

  if (processing) {
    return (
      <div className="card analysis-progress" aria-live="polite">
        <div className="progress-hero">
          <span className="pulse-orb">{roast ? <Flame /> : <BrainCircuit />}</span>
          <span className="eyebrow">Deterministic demo analysis</span>
          <h2 style={{ marginTop: 9 }}>{steps[step]}</h2>
          <p className="muted" style={{ maxWidth: 530 }}>{usesLiveSource && allowExternalLookup ? `Live ${sourceCopy.label} queries are running with strict timeouts. Partial results stay live; total failure falls back to clearly labeled demo evidence.` : "The mock providers return immediately; this short sequence exposes the worker-ready pipeline without pretending to contact live sources."}</p>
        </div>
        <div className="progress-list">
          {steps.map((label, index) => (
            <div key={label} className={`progress-step ${index < step ? "done" : ""} ${index === step ? "current" : ""}`}>
              <span className="step-icon">{index < step ? <Check size={12} /> : index + 1}</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form className="card form-card" onSubmit={submit} noValidate>
      <div className="row between" style={{ marginBottom: 21, alignItems: "flex-start" }}>
        <div>
          <span className="eyebrow">{roast ? "Adversarial mode" : "New analysis"}</span>
          <h2 style={{ marginTop: 7 }}>{roast ? "Let’s try to kill this idea." : "What are you thinking of building?"}</h2>
        </div>
        <div className="segmented" aria-label="Form detail mode">
          <button type="button" className={`segment ${mode === "simple" ? "active" : ""}`} onClick={() => setMode("simple")}>Simple</button>
          <button type="button" className={`segment ${mode === "detailed" ? "active" : ""}`} onClick={() => setMode("detailed")}>Detailed</button>
        </div>
      </div>

      {mode === "simple" ? (
        <div className="field">
          <label htmlFor="idea">Describe your idea in plain English</label>
          <textarea id="idea" className="hero-input" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Example: A lightweight tool that automatically follows up unpaid invoices for freelance designers, without replacing their accounting software…" autoFocus />
          <span className="tiny">Include who it is for, the painful job and how you might charge.</span>
        </div>
      ) : (
        <div className="form-grid">
          <div className="field"><label htmlFor="name">Project name <span className="tiny">optional</span></label><input id="name" value={form.name || ""} onChange={(event) => update("name", event.target.value)} placeholder="InvoiceFlow" /></div>
          <div className="field"><label htmlFor="customer">Target customer</label><input id="customer" value={form.targetCustomer || ""} onChange={(event) => update("targetCustomer", event.target.value)} placeholder="Freelance design studios" /></div>
          <div className="field full"><label htmlFor="description">Describe your idea</label><textarea id="description" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="What will the product do?" /></div>
          <div className="field full"><label htmlFor="problem">Problem being solved</label><input id="problem" value={form.problem || ""} onChange={(event) => update("problem", event.target.value)} placeholder="Late payments require awkward, repeated manual follow-up" /></div>
          <div className="field"><label htmlFor="business">How will it make money?</label><input id="business" value={form.businessModel || ""} onChange={(event) => update("businessModel", event.target.value)} placeholder="€19/month subscription" /></div>
          <div className="field"><label htmlFor="competitors">Existing competitors <span className="tiny">optional</span></label><input id="competitors" value={form.competitors || ""} onChange={(event) => update("competitors", event.target.value)} placeholder="Product A, Product B" /></div>
          <div className="field"><label htmlFor="geography">Target geography</label><input id="geography" value={form.geography || ""} onChange={(event) => update("geography", event.target.value)} placeholder="France, Europe, Global…" /></div>
          <div className="field"><label htmlFor="market">Business model</label><select id="market" value={form.marketType} onChange={(event) => update("marketType", event.target.value as IdeaInput["marketType"])}><option>B2B</option><option>B2C</option><option>B2B2C</option></select></div>
          <div className="field full"><label htmlFor="links">Website or competitor links <span className="tiny">optional</span></label><input id="links" value={form.links || ""} onChange={(event) => update("links", event.target.value)} placeholder="https://…" /></div>
        </div>
      )}

      {error && <p role="alert" style={{ color: "var(--red)", margin: "14px 0 0", fontSize: 12 }}>{error}</p>}
      {usesLiveSource && <label className="external-consent"><input type="checkbox" checked={allowExternalLookup} onChange={(event) => setAllowExternalLookup(event.target.checked)} /><span><strong>Use live {sourceCopy.label} evidence</strong><small>Send up to three derived search keywords — not the full analysis — to {sourceCopy.domains}. Public discussions will be linked and marked observed.</small></span></label>}
      <div className="form-footer">
        <div className="stack" style={{ gap: 7 }}>
          <span className="validation-note"><LockKeyhole /> Providers: Mock AI + {usesLiveSource ? allowExternalLookup ? `live ${sourceCopy.provider}` : "mock until consent" : "curated demo signals"}</span>
          <button type="button" className={`button ghost ${roast ? "danger" : ""}`} onClick={() => setRoast((current) => !current)}><Flame /> {roast ? "Roast mode on" : "Roast my idea"}</button>
        </div>
        <button type="submit" className="button primary wide">{roast ? <Flame /> : <Sparkles />} {roast ? "Roast this idea" : "Analyze this idea"}</button>
      </div>
    </form>
  );
}
