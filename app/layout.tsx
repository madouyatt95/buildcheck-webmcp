import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoStoreProvider } from "@/components/demo-store";
import { PwaRegister } from "@/components/pwa-register";
import { LanguageProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: { default: "BuildCheck — Stop building SaaS nobody wants", template: "%s · BuildCheck" },
  description: "Validate demand, competition, distribution and build cost before you spend weeks coding the wrong thing.",
  applicationName: "BuildCheck",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "BuildCheck" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080b0a" },
    { media: "(prefers-color-scheme: light)", color: "#f3f5f4" }
  ]
};

const themeScript = `
  try {
    const stored = localStorage.getItem('buildcheck-theme');
    const theme = stored || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
  } catch { document.documentElement.dataset.theme = 'dark'; }
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <LanguageProvider><DemoStoreProvider>{children}</DemoStoreProvider></LanguageProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
