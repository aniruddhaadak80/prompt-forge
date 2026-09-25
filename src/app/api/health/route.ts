import { NextResponse } from "next/server";
import { getHealth } from "@/lib/db";
import { withOwnerScope } from "@/lib/api";

export async function GET(request: Request) {
  const health = await getHealth();
  const response = NextResponse.json({ data: health }, { status: health.ok ? 200 : 503 });
  return withOwnerScope(response, request.headers.get("x-prompt-forge-scope") ?? "health-check");
}
