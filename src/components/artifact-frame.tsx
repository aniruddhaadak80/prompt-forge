"use client";

import { useState } from "react";
import { Check, Clipboard, Download, ExternalLink, LoaderCircle } from "lucide-react";
import type { Build } from "@/lib/types";

export function ArtifactFrame({ build, compact = false }: { build: Build; compact?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(build.prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadArtifact() {
    const blob = new Blob([build.artifactCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${build.id}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  }

  return (
    <div className={compact ? "artifact-frame artifact-frame-compact" : "artifact-frame"}>
      <div className="artifact-toolbar">
        <span className="artifact-status"><span className={loaded ? "status-dot status-dot-live" : "status-dot"} /> {loaded ? "runtime loaded" : "booting runtime"}</span>
        <div className="artifact-actions">
          <button type="button" onClick={copyPrompt} aria-label="Copy source prompt">{copied ? <Check size={14} /> : <Clipboard size={14} />} {copied ? "Copied" : "Copy prompt"}</button>
          <button type="button" onClick={downloadArtifact} aria-label="Download standalone artifact">{downloaded ? <Check size={14} /> : <Download size={14} />} {downloaded ? "Downloaded" : "Download HTML"}</button>
          <a href={`/build/${build.id}`} aria-label="Open build detail"><ExternalLink size={14} /> Open page</a>
        </div>
      </div>
      <div className="artifact-stage">
        {!loaded ? <div className="artifact-loading"><LoaderCircle size={20} className="spin" /> Loading sandboxed artifact</div> : null}
        <iframe title={`${build.title} executable artifact`} srcDoc={build.artifactCode} sandbox="allow-scripts" onLoad={() => setLoaded(true)} />
      </div>
    </div>
  );
}
