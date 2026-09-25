import { analyzePrompt } from "./engine";
import { createBuild, getBuild, listBuilds, updateBuild, verifyBuild, getSourceCatalog, RepositoryError } from "./db";
import { renderBuildMarkdown } from "./export";
import { createBuildSchema, engineSchema, formatValidationError, mcpToolCallSchema, updateBuildSchema } from "./validation";
import type { Build } from "./types";

const protocolVersion = "2025-06-18";

function result(id: string | number | null, resultValue: unknown) {
  return { jsonrpc: "2.0", id, result: resultValue };
}

function error(id: string | number | null, code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } };
}

function toolDefinitions() {
  return [
    { name: "list_builds", description: "List public and current-scope builds.", inputSchema: { type: "object", properties: {} } },
    { name: "analyze_prompt", description: "Run the deterministic prompt quality engine without persistence.", inputSchema: { type: "object", required: ["prompt", "kind"], properties: { prompt: { type: "string", minLength: 20, maxLength: 4000 }, kind: { type: "string", enum: ["svg", "arcade", "orbit", "climate"] }, sourceIds: { type: "array", items: { type: "string" } } } } },
    { name: "create_build", description: "Compile and persist a runnable artifact.", inputSchema: { type: "object", required: ["title", "prompt", "kind"], properties: { title: { type: "string", minLength: 3, maxLength: 80 }, prompt: { type: "string", minLength: 20, maxLength: 4000 }, kind: { type: "string", enum: ["svg", "arcade", "orbit", "climate"] }, sourceIds: { type: "array", items: { type: "string" } } } } },
    { name: "update_build", description: "Recompile and persist a build revision.", inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" }, title: { type: "string" }, prompt: { type: "string" }, kind: { type: "string" }, sourceIds: { type: "array", items: { type: "string" } } } } },
    { name: "verify_chain", description: "Replay a build's SHA-384 audit chain.", inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } } },
    { name: "export_build", description: "Render a Markdown build report.", inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } } },
  ];
}

async function sourceRecordsFor(build: Build) {
  const catalog = getSourceCatalog();
  return catalog.filter((source) => build.sourceIds.includes(source.id));
}

export async function handleMcp(request: Request, ownerScope: string): Promise<Response> {
  let payload: { jsonrpc?: string; id?: string | number; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };
  try {
    payload = await request.json() as typeof payload;
  } catch {
    return Response.json(error(null, -32700, "Parse error"), { status: 400 });
  }
  const id = payload.id ?? null;
  if (payload.method === "initialize") return Response.json(result(id, { protocolVersion, serverInfo: { name: "prompt-forge", version: "1.0.0" }, capabilities: { tools: {} } }));
  if (payload.method === "tools/list") return Response.json(result(id, { tools: toolDefinitions() }));
  if (payload.method !== "tools/call") return Response.json(error(id, -32601, "Method not found"));
  const parsed = mcpToolCallSchema.safeParse({ name: payload.params?.name, arguments: payload.params?.arguments ?? {} });
  if (!parsed.success) return Response.json(error(id, -32602, "Invalid tool arguments", formatValidationError(parsed.error)));
  const { name, arguments: args } = parsed.data;
  try {
    if (name === "list_builds") return Response.json(result(id, { content: [{ type: "text", text: JSON.stringify(await listBuilds(ownerScope)) }], structuredContent: await listBuilds(ownerScope) }));
    if (name === "analyze_prompt") {
      const input = engineSchema.parse(args);
      return Response.json(result(id, { content: [{ type: "text", text: JSON.stringify(analyzePrompt(input.prompt, input.kind, input.sourceIds)) }], structuredContent: analyzePrompt(input.prompt, input.kind, input.sourceIds) }));
    }
    if (name === "create_build") {
      const input = createBuildSchema.parse(args);
      const created = await createBuild(input, ownerScope);
      return Response.json(result(id, { content: [{ type: "text", text: `Created ${created.build.id}` }], structuredContent: created }));
    }
    if (name === "update_build") {
      const idValue = typeof args.id === "string" ? args.id : "";
      const input = updateBuildSchema.parse(args);
      const updated = await updateBuild(idValue, input, ownerScope);
      return Response.json(result(id, { content: [{ type: "text", text: `Updated ${updated.build.id}` }], structuredContent: updated }));
    }
    if (name === "verify_chain") {
      const buildId = typeof args.id === "string" ? args.id : "";
      const verified = await verifyBuild(buildId);
      return Response.json(result(id, { content: [{ type: "text", text: verified.valid ? "Chain valid" : `Broken at ${verified.firstBrokenSequence}` }], structuredContent: verified }));
    }
    if (name === "export_build") {
      const buildId = typeof args.id === "string" ? args.id : "";
      const build = await getBuild(buildId, ownerScope);
      if (!build) throw new RepositoryError("Build not found", 404, "not_found");
      const markdown = renderBuildMarkdown(build, await sourceRecordsFor(build));
      return Response.json(result(id, { content: [{ type: "text", text: markdown }], structuredContent: { id: build.id, markdown } }));
    }
    return Response.json(error(id, -32601, `Unknown tool: ${name}`));
  } catch (caught) {
    if (caught instanceof RepositoryError) return Response.json(error(id, -32000, caught.message, { code: caught.code }));
    return Response.json(error(id, -32602, caught instanceof Error ? caught.message : "Tool failed"));
  }
}
