import { AgentConsole } from "@/components/agent-console";

export const metadata = { title: "Agent console" };

export default function AgentPage() {
  return <div className="page-wrap page-wrap-narrow"><div className="eyebrow-row"><span className="micro-label">Agent surface / 04</span><span className="form-hint">Same service, different hands</span></div><div className="section-heading" style={{ marginTop: 35 }}><div><h1 style={{ margin: 0, fontSize: "clamp(48px, 7vw, 90px)", lineHeight: .88, letterSpacing: "-.08em" }}>Let an agent<br /><span style={{ color: "var(--teal)" }}>touch the forge.</span></h1></div><p>Initialize, inspect tools, analyze a brief, and create a real persisted artifact through the public JSON-RPC endpoint.</p></div><AgentConsole /></div>;
}
