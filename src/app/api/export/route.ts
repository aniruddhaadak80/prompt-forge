import { getOwnerScope, jsonError } from "@/lib/api";
import { getBuild, RepositoryError } from "@/lib/db";
import { renderBuildMarkdown } from "@/lib/export";
import { getSourceCatalog } from "@/lib/db";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Query parameter id is required", 400, "missing_id");
  try {
    const build = await getBuild(id, getOwnerScope(request));
    if (!build) return jsonError("Build not found", 404, "not_found");
    const sources = getSourceCatalog().filter((source) => build.sourceIds.includes(source.id));
    return new Response(renderBuildMarkdown(build, sources), {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="${build.id}.md"`,
        "cache-control": "no-store",
      },
    });
  } catch (caught) {
    if (caught instanceof RepositoryError) return jsonError(caught.message, caught.status, caught.code);
    return jsonError(caught instanceof Error ? caught.message : "Unable to export build", 500, "export_failed");
  }
}
