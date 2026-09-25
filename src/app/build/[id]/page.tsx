import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { BuildDetailClient } from "@/components/build-detail-client";
import { getBuild, getSourceCatalog } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Context) {
  const { id } = await params;
  const cookieStore = await cookies();
  const scope = cookieStore.get("pf_scope")?.value ?? "public-seed";
  const build = await getBuild(id, scope);
  return { title: build?.title ?? "Artifact detail", description: build?.prompt };
}

export default async function BuildDetailPage({ params }: Context) {
  const { id } = await params;
  const cookieStore = await cookies();
  const scope = cookieStore.get("pf_scope")?.value ?? "public-seed";
  const build = await getBuild(id, scope);
  if (!build) notFound();
  const sources = getSourceCatalog().filter((source) => build.sourceIds.includes(source.id));
  return <div className="page-wrap"><BuildDetailClient initialBuild={build} sources={sources} /></div>;
}
