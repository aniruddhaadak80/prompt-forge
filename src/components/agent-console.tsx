"use client";

import { useState } from "react";
import { Check, Code2, LoaderCircle, Play, Send, Terminal } from "lucide-react";

type LogEntry = { label: string; value: string; ok: boolean };

export function AgentConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState("");
  const [prompt, setPrompt] = useState("Create a playable browser arcade where the player collects bright signal cells, avoids moving hazards, and can reset the run.");
  const [kind, setKind] = useState("arcade");

  async function call(label: string, method: string, params?: Record<string, unknown>) {
    setBusy(label);
    setLogs((current) => [...current, { label, value: "requesting…", ok: false }]);
    try {
      const response = await fetch("/api/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }) });
      const payload = await response.json() as { result?: unknown; error?: { message?: string } };
      const value = payload.error ? `ERROR · ${payload.error.message}` : JSON.stringify(payload.result, null, 2);
      setLogs((current) => current.map((entry, index) => index === current.length - 1 ? { ...entry, value, ok: !payload.error } : entry));
    } catch (caught) {
      setLogs((current) => current.map((entry, index) => index === current.length - 1 ? { ...entry, value: `ERROR · ${caught instanceof Error ? caught.message : "request failed"}`, ok: false } : entry));
    } finally { setBusy(""); }
  }

  return <div className="agent-console"><div className="agent-toolbar"><div><span className="micro-label">MCP-style console</span><h2>Call the same service the UI uses.</h2></div><span className="agent-protocol"><Terminal size={14} /> JSON-RPC 2.0</span></div><div className="agent-actions"><button className="primary-button" type="button" onClick={() => call("initialize", "initialize")} disabled={Boolean(busy)}>{busy === "initialize" ? <LoaderCircle size={15} className="spin" /> : <Code2 size={15} />} initialize</button><button className="secondary-button" type="button" onClick={() => call("tools/list", "tools/list")} disabled={Boolean(busy)}>{busy === "tools/list" ? <LoaderCircle size={15} className="spin" /> : <Play size={15} />} tools/list</button><button className="secondary-button" type="button" onClick={() => call("list_builds", "tools/call", { name: "list_builds", arguments: {} })} disabled={Boolean(busy)}>list_builds</button></div><div className="agent-create"><div className="agent-create-heading"><span className="micro-label">Mutating tool</span><h3>create_build</h3></div><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} /><div className="agent-create-row"><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="arcade">arcade</option><option value="orbit">orbit</option><option value="climate">climate</option><option value="svg">svg</option></select><button className="primary-button" type="button" onClick={() => call("create_build", "tools/call", { name: "create_build", arguments: { title: `Agent ${new Date().toLocaleTimeString()}`, prompt, kind, sourceIds: ["openai-astra-official"] } })} disabled={Boolean(busy)}>{busy === "create_build" ? <LoaderCircle size={15} className="spin" /> : <Send size={15} />} create_build</button></div></div><div className="agent-log">{logs.length === 0 ? <div className="agent-empty"><Terminal size={20} /><span>Initialize the endpoint to see real responses here.</span></div> : logs.map((entry, index) => <div className="agent-log-entry" key={`${entry.label}-${index}`}><div><span className={entry.ok ? "log-status log-status-ok" : "log-status"}>{entry.ok ? <Check size={12} /> : <LoaderCircle size={12} />}</span><strong>{entry.label}</strong></div><pre>{entry.value}</pre></div>)}</div></div>;
}
