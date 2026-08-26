import { Brand } from "@/components/brand";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-layout"><section className="auth-art"><Brand /><div className="auth-quote"><span className="eyebrow">Build less. Learn faster.</span><h1 style={{ marginTop: 14 }}>The most valuable feature may be the one you never build.</h1><p className="muted">BuildCheck turns assumptions into evidence, scores and a minimum test.</p></div><span className="tiny">Demo workspace · External lookups require consent</span></section><section className="auth-panel">{children}</section></main>;
}
