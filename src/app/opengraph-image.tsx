import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Prompt Forge — Prompts in. Runnable things out.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f4f0e8", color: "#17232d", fontFamily: "Arial" }}><div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 800 }}><div style={{ display: "flex", width: 54, height: 54, alignItems: "center", justifyContent: "center", background: "#17232d", color: "#f4f0e8", fontSize: 18 }}>PF</div> PROMPT FORGE</div><div style={{ display: "flex", flexDirection: "column", fontSize: 86, lineHeight: .92, letterSpacing: -5, fontWeight: 800 }}><div>Prompts in.</div><div style={{ color: "#ff6b35" }}>Runnable things</div><div>out.</div></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#63717a" }}><span>SVG · ARCADE · 3D · SIMULATION</span><span>prompt-forge-neon-one.vercel.app</span></div></div>, { ...size });
}
