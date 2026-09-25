import { createHash } from "node:crypto";

export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? JSON.stringify(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
  }
  return "null";
}

export function sha384(value: string): string {
  return createHash("sha384").update(value, "utf8").digest("hex");
}

export function sealEvent(previousSeal: string, payload: unknown): string {
  return sha384(`${previousSeal}${canonicalize(payload)}`);
}

export function stableId(prefix: string, value: string): string {
  return `${prefix}-${sha384(value).slice(0, 16)}`;
}
