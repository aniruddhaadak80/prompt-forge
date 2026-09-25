import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  reporter: "list",
  use: { baseURL: externalBaseUrl ?? "http://localhost:3100", trace: "retain-on-failure" },
  webServer: externalBaseUrl ? undefined : { command: "npm run dev -- -p 3100", url: "http://localhost:3100", reuseExistingServer: false },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
