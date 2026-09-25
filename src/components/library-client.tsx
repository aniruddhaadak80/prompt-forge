"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Build, SourceRecord } from "@/lib/types";
import { BuildCard } from "./build-card";

const filters = ["all", "svg", "arcade", "orbit", "climate"] as const;

export function LibraryClient({ builds, sources }: { builds: Build[]; sources: SourceRecord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const visible = useMemo(() => builds.filter((build) => {
    const text = `${build.title} ${build.prompt}`.toLowerCase();
    return (filter === "all" || build.kind === filter) && text.includes(query.toLowerCase());
  }), [builds, filter, query]);
  return <><div className="library-controls"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, prompts, mechanics" aria-label="Search builds" /></div><div className="filter-row"><SlidersHorizontal size={14} />{filters.map((value) => <button type="button" key={value} className={filter === value ? "filter-button filter-button-active" : "filter-button"} onClick={() => setFilter(value)}>{value}</button>)}</div><div className="library-count">{visible.length} of {builds.length} artifacts · {sources.length} source records</div></div><BuildGrid builds={visible} /></>;
}

export function BuildGrid({ builds }: { builds: Build[] }) {
  return <div className="build-grid">{builds.map((build, index) => <BuildCard key={build.id} build={build} featured={index === 0} />)}</div>;
}
