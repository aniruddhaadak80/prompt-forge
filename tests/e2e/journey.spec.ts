import { test, expect } from "@playwright/test";

test("primary journey compiles, previews, edits, verifies, exports, and deletes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /compile a prompt/i }).click();
  await page.getByLabel("Title").fill("Browser Smoke Artifact");
  await page.getByRole("textbox", { name: "Prompt" }).fill("Create a playable browser arcade where the player collects bright cells, avoids hazards, uses keyboard controls, and can reset the run.");
  await page.getByRole("button", { name: /compile artifact/i }).click();
  await expect(page).toHaveURL(/\/build\/build-/);
  await expect(page.getByText(/runtime loaded/i)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /save revision/i }).click();
  await expect(page.getByText(/revision saved and sealed/i)).toBeVisible();
  await page.getByRole("button", { name: /verify chain/i }).click();
  await expect(page.getByText(/integrity chain verified/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /export markdown/i })).toHaveAttribute("href", /api\/export\?id=/);
  await page.getByRole("button", { name: /retire/i }).click();
  await expect(page.getByText(/build retired/i)).toBeVisible();
});
