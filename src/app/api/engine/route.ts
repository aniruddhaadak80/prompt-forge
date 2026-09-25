import { jsonError, jsonOk, readJson } from "@/lib/api";
import { analyzePrompt } from "@/lib/engine";
import { engineSchema, formatValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = engineSchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(formatValidationError(parsed.error), 422, "validation_error");
    return jsonOk({ analysis: analyzePrompt(parsed.data.prompt, parsed.data.kind, parsed.data.sourceIds) });
  } catch (caught) {
    return jsonError(caught instanceof Error ? caught.message : "Unable to analyze prompt", 500, "analysis_failed");
  }
}
