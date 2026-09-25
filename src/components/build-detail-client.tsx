"use client";

import { useState } from "react";
import { Check, Download, LoaderCircle, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import type { Build, BuildKind, SourceRecord } from "@/lib/types";
import { ArtifactFrame } from "./artifact-frame";

export function BuildDetailClient({ initialBuild, sources }: { initialBuild: Build; sources: SourceRecord[] }) {
  const [build, setBuild] = useState(initialBuild);
  const [title, setTitle] = useState(initialBuild.title);
  const [prompt, setPrompt] = useState(initialBuild.prompt);
  const [kind, setKind] = useState<BuildKind>(initialBuild.kind);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [verification, setVerification] = useState<{ valid: boolean; checked: number; firstBrokenSequence: number | null } | null>(null);

  async function save() {
    setBusy("save");
    setMessage("");
    try {
      const response = await fetch(`/api/builds/${build.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, prompt, kind }) });
      const payload = await response.json() as { data?: { build: Build }; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "Update failed");
      setBuild(payload.data.build);
      setMessage("Revision saved and sealed.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Update failed"); }
    finally { setBusy(""); }
  }

  async function retire() {
    setBusy("retire");
    setMessage("");
    try {
      const response = await fetch(`/api/builds/${build.id}`, { method: "DELETE" });
      const payload = await response.json() as { data?: { build: Build }; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "Retire failed");
      setBuild(payload.data.build);
      setMessage("Build retired. Its audit chain remains replayable.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Retire failed"); }
    finally { setBusy(""); }
  }

  async function verify() {
    setBusy("verify");
    setMessage("");
    try {
      const response = await fetch(`/api/verify?id=${encodeURIComponent(build.id)}`);
      const payload = await response.json() as { data?: { verification: { valid: boolean; checked: number; firstBrokenSequence: number | null } } };
      if (!response.ok || !payload.data) throw new Error("Verification failed");
      setVerification(payload.data.verification);
      setMessage(payload.data.verification.valid ? "Integrity chain verified." : `Broken link at sequence ${payload.data.verification.firstBrokenSequence}.`);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Verification failed"); }
    finally { setBusy(""); }
  }

  return <div className="detail-stack">
    <div className="detail-header"><div><span className="micro-label">Artifact / {build.id}</span><h1>{build.title}</h1><p>{build.recommendation}</p></div><div className="detail-actions"><a className="secondary-button" href={`/api/export?id=${encodeURIComponent(build.id)}`}><Download size={15} /> Export Markdown</a><button className="secondary-button" type="button" onClick={verify} disabled={busy === "verify"}>{busy === "verify" ? <LoaderCircle size={15} className="spin" /> : <ShieldCheck size={15} />} Verify chain</button></div></div>
    <div className="detail-score"><div><span className="micro-label">Forge score</span><strong>{build.score}<small>/100</small></strong></div><div className="factor-bars">{build.factors.map((factor) => <div className="factor-row" key={factor.key}><span>{factor.label}</span><div><i style={{ width: `${factor.value}%` }} /></div><b>{factor.value}</b></div>)}</div></div>
    <ArtifactFrame build={build} />
    <section className="edit-panel"><div className="panel-heading"><div><span className="micro-label">Revision surface</span><h2>Change the brief, recompile the artifact.</h2></div><span className="version-label">v{build.version} · {build.status}</span></div><div className="edit-grid"><label className="field"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="field"><span>Kind</span><select value={kind} onChange={(event) => setKind(event.target.value as BuildKind)}><option value="svg">Interactive SVG</option><option value="arcade">2D arcade</option><option value="orbit">Three.js 3D</option><option value="climate">Simulation</option></select></label><label className="field field-wide"><span>Prompt</span><textarea rows={6} value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label></div><div className="edit-footer"><div className="source-list">{sources.filter((source) => build.sourceIds.includes(source.id)).map((source) => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher} ↗</a>)}</div><div className="edit-buttons"><button className="primary-button" type="button" onClick={save} disabled={busy === "save" || build.status === "retired"}>{busy === "save" ? <LoaderCircle size={15} className="spin" /> : <Save size={15} />} Save revision</button><button className="danger-button" type="button" onClick={retire} disabled={busy === "retire" || build.status === "retired"}>{busy === "retire" ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />} Retire</button></div></div>{message ? <p className="form-message" role="status">{verification?.valid ? <Check size={14} /> : null}{message}{verification ? ` · ${verification.checked} events checked` : ""}</p> : null}</section>
    <section className="provenance-panel"><div><span className="micro-label">Provenance</span><h2>Why this build exists.</h2></div><p>{build.prompt}</p><div className="seal-line"><span>Current seal</span><code>{build.seal}</code></div><button className="text-button" type="button" onClick={() => { setTitle(build.title); setPrompt(build.prompt); setKind(build.kind); setMessage("Editor reset to the last saved revision."); }}><RotateCcw size={14} /> Reset editor</button></section>
  </div>;
}
