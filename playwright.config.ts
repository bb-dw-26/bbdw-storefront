import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://127.0.0.1:3100", browserName: "chromium" },
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 3100 --strictPort",
    url: "http://127.0.0.1:3100",
    env: {
      VITE_SENTRY_DSN: "https://public@sentry.invalid/1",
      VITE_SENTRY_ENVIRONMENT: "test",
      VITE_SENTRY_RELEASE: "test-release",
      VITE_DEMO_SCENARIO: "SDK-SMOKE",
      VITE_DEMO_RUN_ID: "local-test",
      VITE_USERS_URL: "http://localhost:3001",
      VITE_CATALOG_URL: "http://localhost:3002",
      VITE_CHECKOUT_URL: "http://localhost:3003",
    },
    reuseExistingServer: false,
    timeout: 30000,
  },
});
