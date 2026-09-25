import Link from "next/link";
import { ArrowUpRight, Box, Gamepad2, Orbit, Radio, Sprout } from "lucide-react";
import type { Build } from "@/lib/types";

const kindMeta = {
  svg: { label: "SVG instrument", icon: Radio },
  arcade: { label: "2D arcade", icon: Gamepad2 },
  orbit: { label: "3D study", icon: Orbit },
  climate: { label: "Simulation", icon: Sprout },
} as const;

export function BuildCard({ build, featured = false }: { build: Build; featured?: boolean }) {
  const meta = kindMeta[build.kind];
  const Icon = meta.icon;
  return <Link className={featured ? "build-card build-card-featured" : "build-card"} href={`/build/${build.id}`}>
    <div className="build-card-top"><span className="artifact-kind"><Icon size={14} /> {meta.label}</span><span className="score-chip">{build.score}/100</span></div>
    <h3>{build.title}</h3>
    <p>{build.prompt}</p>
    <div className="build-card-foot"><span>Updated {new Date(build.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span><span className="card-arrow"><ArrowUpRight size={16} /></span></div>
  </Link>;
}

export function BuildMini({ build }: { build: Build }) {
  const meta = kindMeta[build.kind];
  const Icon = meta.icon;
  return <Link className="build-mini" href={`/build/${build.id}`}><span className="mini-icon"><Icon size={16} /></span><span><strong>{build.title}</strong><small>{meta.label} · {build.score}/100</small></span><ArrowUpRight size={15} /></Link>;
}

export function KindIcon({ kind }: { kind: Build["kind"] }) {
  const Icon = kindMeta[kind].icon;
  return <Icon size={16} aria-hidden="true" />;
}

export function SourceBadge({ label }: { label: string }) {
  return <span className="source-badge"><Box size={12} /> {label}</span>;
}
