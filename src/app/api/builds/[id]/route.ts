import { getOwnerScope, jsonError, jsonOk, readJson, withOwnerScope } from "@/lib/api";
import { getBuild, retireBuild, RepositoryError, updateBuild } from "@/lib/db";
import { formatValidationError, updateBuildSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const ownerScope = getOwnerScope(request);
  const { id } = await context.params;
  try {
    const build = await getBuild(id, ownerScope);
    if (!build) return jsonError("Build not found", 404, "not_found");
    return withOwnerScope(jsonOk({ build }), ownerScope);
  } catch (caught) {
    return jsonError(caught instanceof Error ? caught.message : "Unable to read build", 500, "read_failed");
  }
}

export async function PATCH(request: Request, context: Context) {
  const ownerScope = getOwnerScope(request);
  const { id } = await context.params;
  try {
    const parsed = updateBuildSchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(formatValidationError(parsed.error), 422, "validation_error");
    const updated = await updateBuild(id, parsed.data, ownerScope);
    return withOwnerScope(jsonOk(updated), ownerScope);
  } catch (caught) {
    if (caught instanceof RepositoryError) return jsonError(caught.message, caught.status, caught.code);
    return jsonError(caught instanceof Error ? caught.message : "Unable to update build", 500, "update_failed");
  }
}

export async function DELETE(request: Request, context: Context) {
  const ownerScope = getOwnerScope(request);
  const { id } = await context.params;
  try {
    const retired = await retireBuild(id, ownerScope);
    return withOwnerScope(jsonOk(retired), ownerScope);
  } catch (caught) {
    if (caught instanceof RepositoryError) return jsonError(caught.message, caught.status, caught.code);
    return jsonError(caught instanceof Error ? caught.message : "Unable to retire build", 500, "retire_failed");
  }
}
