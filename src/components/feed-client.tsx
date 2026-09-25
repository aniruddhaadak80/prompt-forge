"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import type { FeedResponse } from "@/lib/types";

export function FeedClient() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/feed", { cache: "no-store" });
      const payload = await response.json() as { data?: FeedResponse; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "Feed unavailable");
      setFeed(payload.data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Feed unavailable"); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <div className="feed-module"><div className="feed-toolbar"><div><span className="micro-label">Public signal shelf</span><h2>Live research, normalized.</h2></div><button className="secondary-button" type="button" onClick={load} disabled={busy}>{busy ? <LoaderCircle size={15} className="spin" /> : <RefreshCw size={15} />} Refresh</button></div>{error ? <p className="form-error">{error}</p> : null}{feed ? <><div className="feed-meta"><span className={feed.source === "live" ? "source-live" : "source-fallback"}>{feed.source === "live" ? "LIVE" : "FALLBACK"}</span><span>{feed.notice}</span><time>{new Date(feed.fetchedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div><div className="feed-list">{feed.items.map((item) => <a className="feed-item" key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"><div className="feed-item-top"><span>{item.publisher}</span><span>{item.date}</span></div><h3>{item.title} <ExternalLink size={13} /></h3><p>{item.excerpt}</p><div className="tag-row">{item.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div></a>)}</div></> : <div className="feed-skeleton"><LoaderCircle size={18} className="spin" /> Loading public sources</div>}</div>;
}
