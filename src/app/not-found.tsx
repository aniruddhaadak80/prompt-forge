import Link from "next/link";

export default function NotFound() {
  return <div className="page-wrap page-wrap-narrow"><span className="micro-label">404 / missing artifact</span><h1 style={{ margin: "18px 0", fontSize: "clamp(48px, 8vw, 92px)", lineHeight: .88, letterSpacing: "-.08em" }}>That build<br /><span style={{ color: "var(--orange)" }}>isn&apos;t here.</span></h1><p style={{ color: "var(--muted)", maxWidth: 480 }}>It may belong to another anonymous scope, or it may have been retired. The public seeded artifacts are still available.</p><Link className="primary-button" href="/library" style={{ marginTop: 20 }}>Browse the library</Link></div>;
}
