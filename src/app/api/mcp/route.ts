import { attachOwnerScope, getOwnerScope, jsonError } from "@/lib/api";
import { handleMcp } from "@/lib/mcp";

export async function GET(request: Request) {
  const response = Response.json({
    transport: "json-rpc-2.0-over-http",
    endpoint: "/api/mcp",
    protocolVersion: "2025-06-18",
    tools: ["list_builds", "analyze_prompt", "create_build", "update_build", "verify_chain", "export_build"],
  });
  return attachOwnerScope(response, getOwnerScope(request));
}

export async function POST(request: Request) {
  try {
    const ownerScope = getOwnerScope(request);
    const response = await handleMcp(request, ownerScope);
    return attachOwnerScope(response, ownerScope);
  } catch (caught) {
    return jsonError(caught instanceof Error ? caught.message : "MCP request failed", 500, "mcp_failed");
  }
}
