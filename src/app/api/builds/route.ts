import { getOwnerScope, jsonError, jsonOk, readJson, withOwnerScope } from "@/lib/api";

import { createBuild, listBuilds, RepositoryError } from "@/lib/db";
import { createBuildSchema, formatValidationError } from "@/lib/validation";

export async function GET(request: Request) {
  const ownerScope = getOwnerScope(request);
  const url = new URL(request.url);
  const includeRetired = url.searchParams.get("includeRetired") === "true";
  try {
    const builds = await listBuilds(ownerScope, includeRetired);
    return withOwnerScope(jsonOk({ builds }), ownerScope);
  } catch (caught) {
    return jsonError(caught instanceof Error ? caught.message : "Unable to list builds", 500, "list_failed");
  }
}

export async function POST(request: Request) {
  const ownerScope = getOwnerScope(request);
  try {
    const parsed = createBuildSchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(formatValidationError(parsed.error), 422, "validation_error");
    const created = await createBuild(parsed.data, ownerScope);
    return withOwnerScope(jsonOk(created, 201), ownerScope);
  } catch (caught) {
    if (caught instanceof RepositoryError) return jsonError(caught.message, caught.status, caught.code);
    return jsonError(caught instanceof Error ? caught.message : "Unable to create build", 500, "create_failed");
  }
}
