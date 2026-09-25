import { test, expect } from "@playwright/test";

test("mobile navigation, focus, and seeded artifact remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub source" })).toHaveAttribute("href", "https://github.com/aniruddhaadak80/prompt-forge");
  await page.goto("/build/seed-astra-orbit");
  await expect(page.getByRole("heading", { name: "Astra Orbit Lab" })).toBeVisible();
  await expect(page.getByTitle("Astra Orbit Lab executable artifact")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
