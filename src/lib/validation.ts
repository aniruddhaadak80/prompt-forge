import { z } from "zod";
import { BUILD_KINDS } from "./types";

export const buildKindSchema = z.enum(BUILD_KINDS);

export const createBuildSchema = z.object({
  title: z.string().trim().min(3).max(80),
  prompt: z.string().trim().min(20).max(4000),
  kind: buildKindSchema,
  sourceIds: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
});

export const updateBuildSchema = z
  .object({
    title: z.string().trim().min(3).max(80).optional(),
    prompt: z.string().trim().min(20).max(4000).optional(),
    kind: buildKindSchema.optional(),
    sourceIds: z.array(z.string().trim().min(1).max(120)).max(8).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const engineSchema = z.object({
  prompt: z.string().trim().min(20).max(4000),
  kind: buildKindSchema,
  sourceIds: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
});

export const mcpToolCallSchema = z.object({
  name: z.string().min(1).max(80),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

export function formatValidationError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("; ");
}
