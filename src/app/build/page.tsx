import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BuildForm } from "@/components/build-form";
import { getSourceCatalog } from "@/lib/db";

export const metadata = { title: "Build an artifact" };

export default function BuildPage() {
  const sources = getSourceCatalog();
  return <div className="page-wrap page-wrap-narrow"><Link className="text-button" href="/"><ArrowLeft size={14} /> Back to the lab</Link><div className="section-heading" style={{ marginTop: 35 }}><div><span className="micro-label">Composer / 01</span><h1>Write a brief.<br />Get a runnable thing.</h1></div><p>The compiler turns your prompt into one of four safe browser artifacts. No vendor key, no hidden model call, no decorative canvas.</p></div><BuildForm sources={sources} /><div className="method-grid" style={{ marginTop: 36 }}><div className="method-card"><span className="micro-label">01 / Compile</span><h2>One source of truth.</h2><p>The prompt, artifact code, score, and seal are created together through the same service used by REST and MCP.</p></div><div className="method-card"><span className="micro-label">02 / Render</span><h2>Safe by default.</h2><p>Generated HTML runs inside a script-only iframe. It can animate and play without reaching the host application.</p></div><div className="method-card"><span className="micro-label">03 / Inspect</span><h2>Explain the score.</h2><p>Five weighted factors make the brief more specific, interactive, visual, constrained, and grounded.</p></div><div className="method-card"><span className="micro-label">04 / Carry</span><h2>Leave a trail.</h2><p>Revisions append a SHA-384 seal so you can replay what changed and export the decision with its sources.</p></div></div></div>;
}
