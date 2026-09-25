import { NextResponse } from "next/server";

const openApi = {
  openapi: "3.1.0",
  info: { title: "Prompt Forge API", version: "1.0.0", description: "Prompt-to-playable artifact workbench API." },
  servers: [{ url: "https://prompt-forge.vercel.app" }],
  paths: {
    "/api/health": { get: { responses: { "200": { description: "Persistence health" } } } },
    "/api/feed": { get: { responses: { "200": { description: "Live or fallback research feed" } } } },
    "/api/builds": { get: { responses: { "200": { description: "List builds" } } }, post: { requestBody: { required: true }, responses: { "201": { description: "Create build" } } } },
    "/api/builds/{id}": { get: { parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Read build" } } }, patch: { responses: { "200": { description: "Update build" } } }, delete: { responses: { "200": { description: "Retire build" } } } },
    "/api/engine": { post: { responses: { "200": { description: "Deterministic analysis" } } } },
    "/api/verify": { get: { parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "200": { description: "Replay audit chain" } } } },
    "/api/export": { get: { parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }], responses: { "200": { description: "Markdown export" } } } },
    "/api/mcp": { get: { responses: { "200": { description: "MCP discovery" } } }, post: { responses: { "200": { description: "JSON-RPC response" } } } },
  },
};

export async function GET() {
  return NextResponse.json(openApi);
}
