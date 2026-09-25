export const siteConfig = {
  name: "Prompt Forge",
  shortName: "PF",
  description: "A research-backed prompt-to-playable artifact workbench.",
  tagline: "Prompts in. Runnable things out.",
  repoUrl: "https://github.com/aniruddhaadak80/prompt-forge",
  liveUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://prompt-forge.vercel.app",
  nav: [
    { href: "/build", label: "Build" },
    { href: "/library", label: "Library" },
    { href: "/method", label: "Method" },
    { href: "/agent", label: "Agent" },
  ],
} as const;
