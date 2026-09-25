"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import type { BuildKind, SourceRecord } from "@/lib/types";

const samples: Array<{ label: string; title: string; prompt: string; kind: BuildKind; sources: string[] }> = [
  { label: "Playable arcade", title: "Neon Courier", prompt: "Create a playable browser arcade game where the player collects signal cells, dodges moving hazards, and can reset the run. Use keyboard and touch controls, show score and elapsed time, and keep the loop readable on mobile.", kind: "arcade", sources: ["linkedin-peter-yang-games"] },
  { label: "3D study", title: "Tidal Observatory", prompt: "Build a Three.js spatial study with a glowing core, orbiting moon, draggable camera, scroll zoom, a change-orbit control, and a visible phase readout. Make the artifact feel like a small instrument rather than a generic space scene.", kind: "orbit", sources: ["openai-astra-official", "github-worldbuild-bench"] },
  { label: "Simulation", title: "Earth Condition", prompt: "Create an interactive climate projection with temperature, forest, and clean-energy sliders. Show a changing Earth, a ten-year projection button, and a vitality readout without claiming scientific precision.", kind: "climate", sources: ["dev-space-simulator", "dev-elsewhere"] },
];

export function BuildForm({ sources }: { sources: SourceRecord[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState<BuildKind>("arcade");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  function loadSample(sample: typeof samples[number]) {
    setTitle(sample.title);
    setPrompt(sample.prompt);
    setKind(sample.kind);
    setSourceIds(sample.sources);
    setError("");
  }

  function toggleSource(id: string) {
    setSourceIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCreated(false);
    try {
      const response = await fetch("/api/builds", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, prompt, kind, sourceIds }) });
      const payload = await response.json() as { data?: { build?: { id: string } }; error?: { message?: string } };
      if (!response.ok || !payload.data?.build) throw new Error(payload.error?.message ?? "Unable to compile build");
      setCreated(true);
      window.setTimeout(() => router.push(`/build/${payload.data?.build?.id}`), 450);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to compile build");
    } finally {
      setBusy(false);
    }
  }

  return <form className="build-form" onSubmit={submit}>
    <div className="form-topline"><span className="micro-label">New artifact / 01</span><span className="form-hint">No API key required</span></div>
    <div className="sample-strip">{samples.map((sample) => <button type="button" key={sample.label} onClick={() => loadSample(sample)}><Sparkles size={14} /> {sample.label}</button>)}</div>
    <label className="field"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name the thing you want to run" maxLength={80} required /></label>
    <label className="field"><span>Prompt</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the subject, controls, visual system, and done condition..." rows={8} minLength={20} maxLength={4000} required /></label>
    <div className="form-row"><label className="field"><span>Artifact kind</span><select value={kind} onChange={(event) => setKind(event.target.value as BuildKind)}><option value="arcade">2D arcade game</option><option value="orbit">Three.js 3D study</option><option value="climate">Simulation</option><option value="svg">Interactive SVG</option></select></label><div className="field"><span>Attach evidence</span><div className="source-picker">{sources.slice(0, 8).map((source) => <button type="button" key={source.id} className={sourceIds.includes(source.id) ? "source-pill source-pill-active" : "source-pill"} onClick={() => toggleSource(source.id)}>{source.publisher} · {source.model}</button>)}</div></div></div>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {created ? <p className="form-success" role="status"><Check size={15} /> Compiled and saved. Opening the artifact…</p> : null}
    <button className="primary-button form-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle size={16} className="spin" /> Compiling…</> : <>Compile artifact <ArrowRight size={16} /></>}</button>
  </form>;
}
