import { jsonError, jsonOk } from "@/lib/api";
import { verifyBuild } from "@/lib/db";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Query parameter id is required", 400, "missing_id");
  try {
    return jsonOk({ verification: await verifyBuild(id) });
  } catch (caught) {
    return jsonError(caught instanceof Error ? caught.message : "Unable to verify chain", 500, "verify_failed");
  }
}
