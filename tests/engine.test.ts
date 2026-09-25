import { describe, expect, it } from "vitest";
import { analyzePrompt } from "@/lib/engine";
import { sealEvent } from "@/lib/canonical";
import { compileArtifact } from "@/lib/artifact";

describe("forge engine", () => {
  it("scores a detailed playable brief above a vague brief", () => {
    const strong = analyzePrompt("Create a playable browser arcade game with keyboard controls, moving hazards, a score readout, reset button, responsive layout, and a complete win state.", "arcade", ["github-worldbuild-bench"]);
    const weak = analyzePrompt("Make something interesting", "svg");
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.factors).toHaveLength(5);
    expect(strong.seal).toHaveLength(96);
  });

  it("is deterministic for identical inputs", () => {
    const input = { prompt: "Build a Three.js study with drag controls, zoom, reset, and a phase readout.", kind: "orbit" as const, sourceIds: ["openai-astra-official"] };
    expect(analyzePrompt(input.prompt, input.kind, input.sourceIds)).toEqual(analyzePrompt(input.prompt, input.kind, input.sourceIds));
  });

  it("handles boundary-like empty source lists and long prompts", () => {
    const result = analyzePrompt("A".repeat(4000), "climate", []);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.metadata.sourceCount).toBe(0);
  });

  it("chains seals deterministically", () => {
    expect(sealEvent("", { b: 2, a: 1 })).toBe(sealEvent("", { a: 1, b: 2 }));
    expect(sealEvent("abc", { action: "create" })).not.toBe(sealEvent("abc", { action: "update" }));
  });

  it("emits a runnable artifact for every kind", () => {
    for (const kind of ["svg", "arcade", "orbit", "climate"] as const) {
      const artifact = compileArtifact(kind, "Create a responsive interactive artifact with controls, reset, and a visible readout.", "Test artifact");
      expect(artifact.code).toContain("<!doctype html>");
      expect(artifact.code).toContain("window.__forgeTelemetry");
    }
  });
});
