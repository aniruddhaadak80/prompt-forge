import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { listBuilds } from "@/lib/db";

export const metadata = { title: "Export" };

export default async function ExportPage() {
  const builds = await listBuilds("public-seed");
  return <div className="page-wrap page-wrap-narrow"><Link className="text-button" href="/"><ArrowLeft size={14} /> Back to the lab</Link><div className="section-heading" style={{ marginTop: 35 }}><div><span className="micro-label">Export / 05</span><h1>Take the brief<br />with you.</h1></div><p>Download a Markdown record with the prompt, artifact kind, score factors, provenance links, version, and current integrity seal.</p></div><div className="export-card"><div className="export-list">{builds.map((build) => <div className="export-row" key={build.id}><div><strong>{build.title}</strong><span style={{ display: "block", marginTop: 5 }}>{build.kind} · v{build.version} · {build.score}/100</span></div><a className="secondary-button" href={`/api/export?id=${encodeURIComponent(build.id)}`}><Download size={15} /> Markdown</a></div>)}</div>{builds.length === 0 ? <p className="form-error">No builds are available yet.</p> : null}</div><div className="feed-module" style={{ marginTop: 28 }}><div className="feed-toolbar"><div><span className="micro-label">Takeaway artifact</span><h2>One file, enough context.</h2></div><FileText size={22} /></div><div style={{ padding: 22, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>The export is deliberately plain text. It can go into a PR, a research note, a teammate&apos;s inbox, or an agent context without asking anyone to trust a black box.</div></div></div>;
}
