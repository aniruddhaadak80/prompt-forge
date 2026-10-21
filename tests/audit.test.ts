import { describe, expect, it } from "vitest";
import { createBuild, RepositoryError, verifyBuild } from "@/lib/db";

const PROMPT = "Create a playable browser arcade where the player collects bright cells, avoids hazards and can reset the run.";

describe("audit chain authorisation", () => {
  it("replays the chain for the owning scope", async () => {
    const { build } = await createBuild({ title: "Owned build", prompt: PROMPT, kind: "arcade", sourceIds: [] }, "scope-owner-0001");
    const verification = await verifyBuild(build.id, "scope-owner-0001");
    expect(verification.valid).toBe(true);
    expect(verification.events.length).toBeGreaterThan(0);
  });

  it("refuses to replay the chain for a different scope", async () => {
    const { build } = await createBuild({ title: "Private build", prompt: PROMPT, kind: "arcade", sourceIds: [] }, "scope-owner-0002");
    await expect(verifyBuild(build.id, "scope-other-0003")).rejects.toBeInstanceOf(RepositoryError);
    await expect(verifyBuild(build.id, "scope-other-0003")).rejects.toMatchObject({ status: 404 });
  });

  it("never returns another scope's prompt in the replayed events", async () => {
    const { build } = await createBuild({ title: "Leaky build", prompt: PROMPT, kind: "svg", sourceIds: [] }, "scope-owner-0004");
    let leaked = false;
    try {
      await verifyBuild(build.id, "scope-other-0005");
    } catch (caught) {
      leaked = caught instanceof RepositoryError;
    }
    expect(leaked).toBe(true);
  });
});
