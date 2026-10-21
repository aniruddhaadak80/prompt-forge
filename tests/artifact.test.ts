import { describe, expect, it } from "vitest";
import { compileArtifact } from "@/lib/artifact";

const KINDS = ["svg", "arcade", "orbit", "climate"] as const;

function idsOf(code: string): string[] {
  return [...code.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
}

function buttonIdsOf(code: string): string[] {
  return [...code.matchAll(/<button[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
}

function lookedUpIdsOf(code: string): Set<string> {
  return new Set([...code.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]));
}

describe("compiled artifacts", () => {
  for (const kind of KINDS) {
    it(`${kind}: never emits a duplicate element id`, () => {
      const code = compileArtifact(kind, "Create a responsive interactive artifact with controls, reset and a readout.", "Duplicate id probe").code;
      const ids = idsOf(code);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`${kind}: wires every button it renders`, () => {
      const code = compileArtifact(kind, "Create a responsive interactive artifact with controls, reset and a readout.", "Dead button probe").code;
      const looked = lookedUpIdsOf(code);
      for (const id of buttonIdsOf(code)) {
        expect(looked.has(id)).toBe(true);
      }
    });
  }
});
