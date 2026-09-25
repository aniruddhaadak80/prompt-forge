import { getFeed } from "@/lib/feed";
import { jsonError, jsonOk } from "@/lib/api";

export const revalidate = 900;

export async function GET() {
  try {
    return jsonOk(await getFeed());
  } catch (caught) {
    return jsonError(caught instanceof Error ? caught.message : "Unable to load feed", 503, "feed_unavailable");
  }
}
