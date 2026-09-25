"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="page-wrap page-wrap-narrow"><span className="micro-label">Something went wrong</span><h1 style={{ margin: "18px 0", fontSize: "clamp(44px, 7vw, 80px)", lineHeight: .9, letterSpacing: "-.08em" }}>The forge<br /><span style={{ color: "var(--rose)" }}>paused.</span></h1><p style={{ color: "var(--muted)" }}>No data was silently discarded. Retry the request or return to the library.</p><button className="primary-button" type="button" onClick={() => reset()} style={{ marginTop: 20 }}>Try again</button></div>;
}
