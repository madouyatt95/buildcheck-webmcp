"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Compass,
  FileBarChart,
  Flame,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Sparkles
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useDemoStore } from "@/components/demo-store";
import { WebMcpBridge } from "@/components/webmcp-bridge";
import { useLanguage } from "@/components/language-provider";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/validate", label: "Validate", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings }
];

const mobileNav = nav.filter((item) => item.href !== "/settings");

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useDemoStore();
  const { t } = useLanguage();
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  const title = t(nav.find((item) => active(item.href))?.label || "BuildCheck");

  return (
    <div className="app-layout">
      <WebMcpBridge />
      <aside className="sidebar">
        <Link href="/dashboard"><Brand /></Link>
        <div className="nav-label">{t("Workspace")}</div>
        <nav className="sidebar-nav" aria-label={t("Primary navigation")}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link ${active(item.href) ? "active" : ""}`}>
              <item.icon aria-hidden="true" />
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <div className="sidebar-actions">
          <Link href="/validate" className="button primary full"><Plus /> {t("Validate an idea")}</Link>
          <Link href="/validate?mode=roast" className="button ghost full"><Flame /> {t("Roast my idea")}</Link>
        </div>
        <div className="sidebar-footer">
          <span className="badge demo-badge">{t("Demo workspace")}</span>
          <div className="demo-profile">
            <span className="avatar">{profile.firstName.slice(0, 2).toUpperCase()}</span>
            <div><strong>{profile.firstName} Martin</strong><span>{t("Builder · demo account")}</span></div>
            <Link href="/login" aria-label={t("Log out")} style={{ marginLeft: "auto", color: "var(--text-faint)" }}><LogOut size={15} /></Link>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <Link className="mobile-brand" href="/dashboard"><Brand compact /></Link>
          <span className="topbar-title">{title}</span>
          <div className="topbar-actions">
            <span className="badge demo-badge desktop-only">{t("Signals are simulated")}</span>
            <Link href="/settings" className="button icon ghost mobile-settings" aria-label={t("Settings")}><Settings /></Link>
            <ThemeToggle />
            <Link href="/validate" className="button primary desktop-only"><Plus /> {t("Analyze")}</Link>
          </div>
        </header>
        {children}
      </main>

      <nav className="mobile-bottom-nav" aria-label={t("Mobile navigation")}>
        {mobileNav.map((item) => (
          <Link key={item.href} href={item.href} className={`mobile-nav-link ${active(item.href) ? "active" : ""}`}>
            <item.icon aria-hidden="true" />
            {t(item.label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
