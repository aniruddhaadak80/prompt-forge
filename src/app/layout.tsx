import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.liveUrl),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s — ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["AI prompts", "playable artifacts", "Three.js", "SVG simulations", "browser games", "MCP"],
  authors: [{ name: "Aniruddha Adak" }],
  creator: "Aniruddha Adak",
  openGraph: { title: `${siteConfig.name} — ${siteConfig.tagline}`, description: siteConfig.description, url: siteConfig.liveUrl, siteName: siteConfig.name, type: "website" },
  twitter: { card: "summary_large_image", title: `${siteConfig.name} — ${siteConfig.tagline}`, description: siteConfig.description },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, colorScheme: "light", themeColor: "#f4f0e8" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><SiteNav /><main>{children}</main><SiteFooter /></body></html>;
}
