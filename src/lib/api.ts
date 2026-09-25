import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export function getOwnerScope(request: Request): string {
  const headerScope = request.headers.get("x-prompt-forge-scope");
  if (headerScope && /^[a-zA-Z0-9_-]{8,120}$/.test(headerScope)) return headerScope;
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)pf_scope=([^;]+)/);
  return match && /^[a-zA-Z0-9_-]{8,120}$/.test(match[1]) ? match[1] : randomUUID();
}

function scopeCookie(ownerScope: string): string {
  return `pf_scope=${ownerScope}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function attachOwnerScope<T extends Response>(response: T, ownerScope: string): T {
  response.headers.append("Set-Cookie", scopeCookie(ownerScope));
  return response;
}

export function withOwnerScope<T>(response: NextResponse<T>, ownerScope: string): NextResponse<T> {
  response.cookies.set("pf_scope", ownerScope, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export function jsonError(message: string, status = 400, code = "bad_request") {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON");
  }
}
