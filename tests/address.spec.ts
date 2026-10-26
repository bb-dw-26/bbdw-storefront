import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://sentry.invalid/**", (route) => route.fulfill({ json: {} }));
  await page.route("http://localhost:3002/**", (route) => route.fulfill({ json: { items: [{ id: "product-standard", name: "Caneca Demo", priceCents: 4000, available: true, thumbnailUrl: null }] } }));
});
test("retirada não consulta CEP; entrega preenche, permite edição e preserva rascunho", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let lookups = 0;
  await page.route("http://localhost:3003/addresses/**", (route) => {
    lookups++;
    expect(route.request().url()).toMatch(/\/01001000$/);
    return route.fulfill({ json: { postalCode: "01001000", street: "Praça Teste", neighborhood: "Centro", city: "São Paulo", state: "SP" } });
  });
  await page.goto("/"); await page.getByRole("button", { name: /^Carrinho/ }).click();
  await expect(page.getByRole("radio", { name: /Retirar na loja/ })).toBeChecked();
  await expect(page.getByLabel("CEP", { exact: true })).toHaveCount(0); expect(lookups).toBe(0);
  await page.getByRole("radio", { name: /Receber em casa/ }).check();
  await page.getByLabel("CEP", { exact: true }).fill("01001-000");
  await page.getByRole("button", { name: "Buscar endereço" }).click();
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Praça Teste");
  await page.getByLabel("Número", { exact: true }).fill("s/n");
  await page.getByLabel("Rua", { exact: true }).fill("Rua editada");
  await page.getByLabel("Complemento (opcional)").fill("Bloco B");
  expect(await page.locator(".panel-body").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: "test-results/address-form-mobile.png" });
  await page.keyboard.press("Escape"); await page.getByRole("button", { name: /^Carrinho/ }).click();
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua editada");
  await page.getByRole("radio", { name: /Retirar na loja/ }).check();
  await page.getByRole("radio", { name: /Receber em casa/ }).check();
  await expect(page.getByLabel("Número", { exact: true })).toHaveValue("s/n");
  await page.route("http://localhost:3003/orders", (route) => {
    const body = route.request().postDataJSON();
    expect(body).not.toHaveProperty("customerId");
    expect(body.deliveryAddress).toEqual({ postalCode: "01001000", street: "Rua editada", number: "s/n", neighborhood: "Centro", city: "São Paulo", state: "SP", complement: "Bloco B" });
    return route.fulfill({ status: 201, json: { ...body, id: "delivery-test", totalCents: 8000 } });
  });
  await page.getByRole("button", { name: "Finalizar compra" }).click();
  await expect(page.getByText("Pedido confirmado!", { exact: true })).toBeVisible(); expect(lookups).toBe(1);
});
test("resposta antiga não sobrescreve CEP mais recente, nem deixa erro antigo", async ({ page }) => {
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => { release = resolve; });
  let started = false;
  await page.route("http://localhost:3003/addresses/**", async (route) => {
    const old = route.request().url().endsWith("01001000");
    if (old) { started = true; await delayed; }
    await route.fulfill({ json: { postalCode: old ? "01001000" : "70000000", street: old ? "Rua antiga" : "Rua nova", neighborhood: "", city: "Cidade", state: "DF" } }).catch(() => {});
  });
  try {
    await page.goto("/"); await page.getByRole("button", { name: /^Carrinho/ }).click();
    await page.getByRole("radio", { name: /Receber em casa/ }).check();
    await page.getByLabel("CEP", { exact: true }).fill("01001000");
    await page.getByRole("button", { name: "Buscar endereço" }).click();
    await expect.poll(() => started).toBe(true);
    await expect(page.getByText("Consultando CEP…")).toBeVisible();
    await page.getByLabel("CEP", { exact: true }).fill("70000000");
    await page.getByRole("button", { name: "Buscar endereço" }).click();
    await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua nova");
    release();
    await page.getByLabel("Número", { exact: true }).fill("42");
    await expect(page.getByLabel("CEP", { exact: true })).toHaveValue("70000000");
    await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua nova");
  } finally { release(); }
});
test("erro de consulta aparece junto ao formulário sem apagar o endereço manual", async ({ page }) => {
  await page.route("http://localhost:3003/addresses/**", (route) => route.fulfill({ status: 500, json: { error: { code: "INTERNAL_ERROR", message: "Não foi possível consultar o endereço." } } }));
  await page.goto("/"); await page.getByRole("button", { name: /^Carrinho/ }).click();
  await page.getByRole("radio", { name: /Receber em casa/ }).check();
  await page.getByLabel("CEP", { exact: true }).fill("99999999");
  await page.getByLabel("Rua", { exact: true }).fill("Rua manual");
  await page.getByRole("button", { name: "Buscar endereço" }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível consultar");
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua manual");
});
