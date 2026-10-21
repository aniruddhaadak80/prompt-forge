import { getOwnerScope, jsonError, jsonOk } from "@/lib/api";
import { verifyBuild, RepositoryError } from "@/lib/db";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Query parameter id is required", 400, "missing_id");
  try {
    return jsonOk({ verification: await verifyBuild(id, getOwnerScope(request)) });
  } catch (caught) {
    if (caught instanceof RepositoryError) return jsonError(caught.message, caught.status, caught.code);
    return jsonError(caught instanceof Error ? caught.message : "Unable to verify chain", 500, "verify_failed");
  }
}
