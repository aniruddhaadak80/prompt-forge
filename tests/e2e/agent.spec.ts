import { test, expect } from "@playwright/test";

test("agent console initializes and discovers real tools", async ({ page }) => {
  await page.goto("/agent");
  await page.getByRole("button", { name: "initialize" }).click();
  await expect(page.locator("pre").first()).toContainText("serverInfo");
  await page.getByRole("button", { name: "tools/list" }).click();
  await expect(page.locator("pre").last()).toContainText("create_build");
});
