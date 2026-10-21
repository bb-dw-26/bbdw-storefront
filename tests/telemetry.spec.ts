import { test, expect } from "@playwright/test";

test("erro de renderização gera um evento e fallback sem dados HTTP", async ({ page }) => {
  const events: Record<string, unknown>[] = [];
  await page.route("https://sentry.invalid/**", async (route) => {
    for (const line of (route.request().postData() ?? "").split("\n")) {
      if (!line) continue;
      const item = JSON.parse(line);
      if (item.exception) events.push(item);
    }
    await route.fulfill({ status: 200, json: {} });
  });
  await page.route("http://localhost:3001/**", (route) => route.fulfill({ json: { id: "test", name: "never-publish", address: null } }));
  // Resposta inválida força um erro real no render de App, sem endpoint de debug.
  await page.route("http://localhost:3002/**", (route) => route.fulfill({ json: { items: {} } }));
  await page.goto("/?secret=never-publish");
  await expect(page.getByRole("heading", { name: "Não foi possível exibir a loja." })).toBeVisible();
  await expect.poll(() => events.length).toBe(1);
  const event = events[0];
  expect(event.tags).toMatchObject({ service: "bbw-storefront", demo_run: "local-test" });
  expect(event.release).toBe("test-release");
  expect(event.request).toBeUndefined();
  expect(event.user).toBeUndefined();
  expect(event.breadcrumbs).toBeUndefined();
  expect(JSON.stringify(event)).not.toContain("never-publish");
  await page.getByRole("button", { name: "Recarregar" }).click();
  await expect.poll(() => events.length).toBe(2);
});
