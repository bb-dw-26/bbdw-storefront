import { test, expect, type Page } from "@playwright/test";

const products = [
  {
    id: "product-standard",
    name: "Caneca Demo",
    priceCents: 4000,
    available: true,
    thumbnailUrl: "/demo-assets/caneca.svg",
  },
  {
    id: "product-no-image",
    name: "Caderno Demo",
    priceCents: 2500,
    available: true,
    thumbnailUrl: null,
  },
];
const address = {
  street: "Rua de Exemplo, 123",
  city: "Brasília",
  postalCode: "70000-000",
};
const initialPayload = {
  customerId: "customer-pickup",
  fulfillment: "pickup",
  items: [{ productId: "product-standard", quantity: 2 }],
};
const pickupOrder = {
  id: "order-test",
  fulfillment: "pickup",
  deliveryAddress: null,
  totalCents: 8000,
};

async function openCheckout(page: Page) {
  await page.getByRole("button", { name: /^Carrinho/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  return page.getByRole("dialog");
}

test.use({ reducedMotion: "reduce" });
test.beforeEach(async ({ page }) => {
  await page.route("https://sentry.invalid/**", (route) =>
    route.fulfill({ status: 200, json: {} }),
  );
  await page.route("http://localhost:3002/**", (route) =>
    route.fulfill({ json: { items: products } }),
  );
  await page.route("http://localhost:3001/**", (route) => {
    const pickup = route.request().url().endsWith("customer-pickup");
    return route.fulfill({
      json: {
        id: pickup ? "customer-pickup" : "customer-delivery",
        name: pickup ? "Cliente Retirada" : "Cliente Entrega",
        address: pickup ? null : address,
      },
    });
  });
});

test("mantém carrinho após erro e confirma retirada na nova tentativa", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("http://localhost:3003/orders", async (route) => {
    attempts++;
    expect(route.request().postDataJSON()).toEqual(initialPayload);
    if (attempts === 1) {
      await route.fulfill({
        status: 500,
        json: {
          error: {
            code: "INTERNAL_ERROR",
            message: "Falha simulada no checkout.",
          },
          requestId: "demo-test",
        },
      });
    } else {
      await route.fulfill({ status: 201, json: pickupOrder });
    }
  });
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: "Caderno Demo: sem imagem" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const panel = await openCheckout(page);
  await expect(
    panel.getByRole("radio", { name: /Pix de demonstração/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Finalizar compra" }).click();
  await expect(page.getByRole("alert")).toContainText("Falha simulada");
  await expect(page.getByRole("alert")).toContainText("demo-test");
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(
    page.getByRole("spinbutton", { name: "Quantidade de Caneca Demo" }),
  ).toHaveValue("2");
  await expect(
    panel.getByText("Pedido confirmado!", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Finalizar compra" }).click();
  await expect(panel.getByRole("status")).toContainText("Pedido confirmado!");
  await expect(panel.getByRole("status")).toContainText("80,00");
  await expect(panel.getByRole("status")).toContainText("Retirada na loja");
  await expect(
    panel.getByText("Endereço de entrega", { exact: true }),
  ).toHaveCount(0);
  expect(attempts).toBe(2);
  await page.getByRole("button", { name: "Fechar checkout" }).click();
  await openCheckout(page);
  await expect(panel.getByRole("status")).toContainText("order-test");
  await panel.getByRole("button", { name: "Fechar checkout" }).click();
  const orderLink = page.getByRole("button", {
    name: "Ver pedido e continuar comprando",
  });
  await orderLink.click();
  await page.keyboard.press("Escape");
  await expect(orderLink).toBeFocused();
  await orderLink.click();
  await panel
    .getByRole("button", { name: "Continuar comprando", exact: true })
    .click();
  await expect(panel).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Carrinho 0" })).toBeFocused();
  await openCheckout(page);
  await expect(
    page.getByRole("button", { name: "Finalizar compra" }),
  ).toBeDisabled();
  await expect(panel.getByText("Seu carrinho está esperando.")).toBeVisible();
});

test("adiciona, agrega, limita quantidades e remove itens sem abrir o painel", async ({
  page,
}) => {
  await page.goto("/");
  const add = page.getByRole("button", {
    name: "Adicionar Caderno Demo ao carrinho",
  });
  await add.click();
  await add.click();
  await expect(page.getByRole("status")).toContainText(
    "Caderno Demo adicionado. 4 itens no carrinho.",
  );
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Carrinho 4" })).toBeVisible();
  const panel = await openCheckout(page);
  await expect(
    panel.getByRole("article", { name: "Caderno Demo" }),
  ).toHaveCount(1);
  await expect(
    panel.getByRole("article", { name: "Caderno Demo" }),
  ).toContainText("50,00");
  await expect(panel.locator(".order-total")).toContainText("130,00");
  const quantity = panel.getByRole("spinbutton", {
    name: "Quantidade de Caneca Demo",
  });
  await panel
    .getByRole("button", { name: "Aumentar quantidade de Caneca Demo" })
    .click();
  await expect(quantity).toHaveValue("3");
  await expect(panel.locator(".order-total")).toContainText("170,00");
  await panel
    .getByRole("button", { name: "Diminuir quantidade de Caneca Demo" })
    .click();
  await expect(quantity).toHaveValue("2");
  await quantity.fill("99");
  await expect(
    panel.getByRole("button", { name: "Aumentar quantidade de Caneca Demo" }),
  ).toBeDisabled();
  await quantity.fill("100");
  await expect(quantity).toHaveValue("99");
  await quantity.fill("1.5");
  await expect(quantity).toHaveValue("99");
  await quantity.fill("1");
  await quantity.fill("0");
  await expect(quantity).toHaveValue("1");
  await expect(
    panel.getByRole("button", { name: "Diminuir quantidade de Caneca Demo" }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Remover Caderno Demo" }).click();
  await expect(panel.locator(".order-total")).toContainText("40,00");
  await panel.getByRole("button", { name: "Remover Caneca Demo" }).click();
  await expect(panel.locator(".order-total")).toContainText("0,00");
  await expect(
    panel.getByRole("button", { name: "Finalizar compra" }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Explorar produtos" }).click();
  await expect(panel).not.toBeVisible();
  await add.click();
  await expect(page.getByRole("button", { name: "Carrinho 1" })).toBeVisible();
});

for (const payment of ["Pix de demonstração", "Cartão de teste"]) {
  test(`entrega com endereço e ${payment} preserva contrato e total do servidor`, async ({
    page,
  }) => {
    let attempts = 0;
    await page.route("http://localhost:3003/orders", async (route) => {
      attempts++;
      expect(route.request().postDataJSON()).toEqual({
        ...initialPayload,
        customerId: "customer-delivery",
        fulfillment: "delivery",
      });
      await route.fulfill({
        status: 201,
        json: {
          id: "order-delivery",
          fulfillment: "delivery",
          deliveryAddress: address,
          totalCents: 7900,
        },
      });
    });
    await page.goto("/");
    const panel = await openCheckout(page);
    await panel.getByRole("combobox").selectOption("customer-delivery");
    await panel.getByRole("radio", { name: /Receber em casa/ }).check();
    await expect(panel.getByText(address.street)).toBeVisible();
    await panel.getByRole("radio", { name: new RegExp(payment) }).check();
    await expect(panel.locator(".order-total")).toContainText("80,00");
    await panel.getByRole("button", { name: "Finalizar compra" }).click();
    await expect(panel.getByRole("status")).toContainText("Pedido confirmado!");
    await expect(panel.getByRole("status")).toContainText("79,00");
    await expect(panel.getByRole("status")).toContainText("Entrega em casa");
    await expect(panel.getByRole("status")).toContainText(address.street);
    await expect(panel.getByRole("status")).toContainText(payment);
    await expect(panel.getByRole("status")).toContainText(
      "Nenhum pagamento foi processado",
    );
    expect(attempts).toBe(1);
  });
}

test("entrega sem endereço é validada pelo servidor e mantém escolhas após 422", async ({
  page,
}) => {
  await page.route("http://localhost:3003/orders", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      ...initialPayload,
      fulfillment: "delivery",
    });
    await route.fulfill({
      status: 422,
      json: {
        error: {
          code: "ADDRESS_REQUIRED",
          message: "Cliente não possui endereço para entrega.",
        },
        requestId: "delivery-test",
      },
    });
  });
  await page.goto("/");
  const panel = await openCheckout(page);
  await panel.getByRole("radio", { name: /Receber em casa/ }).check();
  await expect(
    panel.getByText("Cliente sem endereço cadastrado"),
  ).toBeVisible();
  await panel.getByRole("radio", { name: /Cartão de teste/ }).check();
  await panel.getByRole("button", { name: "Finalizar compra" }).click();
  await expect(panel.getByRole("alert")).toContainText(
    "Cliente não possui endereço",
  );
  await page.keyboard.press("Escape");
  await openCheckout(page);
  await expect(
    panel.getByRole("radio", { name: /Receber em casa/ }),
  ).toBeChecked();
  await expect(
    panel.getByRole("radio", { name: /Cartão de teste/ }),
  ).toBeChecked();
  await expect(panel.getByRole("spinbutton")).toHaveValue("2");
  await expect(
    panel.getByRole("button", { name: "Finalizar compra" }),
  ).toBeEnabled();
});

for (const success of [true, false]) {
  test(`bloqueia envio duplicado e mantém ${success ? "sucesso" : "erro"} recebido com painel fechado`, async ({
    page,
  }) => {
    let release!: () => void;
    const responseReady = new Promise<void>((resolve) => {
      release = resolve;
    });
    let attempts = 0;
    await page.route("http://localhost:3003/orders", async (route) => {
      attempts++;
      expect(route.request().postDataJSON()).toEqual(initialPayload);
      await responseReady;
      await route.fulfill(
        success
          ? { status: 201, json: pickupOrder }
          : {
              status: 500,
              json: { error: { message: "Falha durante o envio." } },
            },
      );
    });
    try {
      await page.goto("/");
      const panel = await openCheckout(page);
      const submit = panel.getByRole("button", { name: "Finalizar compra" });
      await submit.evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
      });
      await expect.poll(() => attempts).toBe(1);
      await expect(
        panel.getByRole("button", { name: "Finalizando…" }),
      ).toBeDisabled();
      await expect(panel.getByRole("spinbutton")).toBeDisabled();
      await expect(panel.getByRole("combobox")).toBeDisabled();
      for (const radio of await panel.getByRole("radio").all())
        await expect(radio).toBeDisabled();
      await panel.getByRole("button", { name: "Fechar checkout" }).click();
      await expect(
        page.getByRole("button", { name: "Adicionar Caneca Demo ao carrinho" }),
      ).toBeDisabled();
      await openCheckout(page);
      await expect(
        panel.getByRole("button", { name: "Finalizando…" }),
      ).toBeDisabled();
      await panel.getByRole("button", { name: "Fechar checkout" }).click();
      const response = page.waitForResponse("http://localhost:3003/orders");
      release();
      await response;
      await openCheckout(page);
      if (success)
        await expect(panel.getByRole("status")).toContainText(
          "Pedido confirmado!",
        );
      else
        await expect(panel.getByRole("alert")).toContainText(
          "Falha durante o envio.",
        );
      expect(attempts).toBe(1);
    } finally {
      release();
    }
  });
}

test("diálogo mantém foco, aceita teclado e devolve foco ao acionador", async ({
  page,
}) => {
  await page.route("http://localhost:3003/orders", (route) =>
    route.fulfill({
      status: 500,
      json: { error: { message: "Falha de teste por teclado." } },
    }),
  );
  await page.goto("/");
  const panel = await openCheckout(page);
  const close = panel.getByRole("button", { name: "Fechar checkout" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    panel.getByRole("button", { name: "Finalizar compra" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await panel.getByRole("radio", { name: /Retirar na loja/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    panel.getByRole("radio", { name: /Receber em casa/ }),
  ).toBeChecked();
  await panel.getByRole("radio", { name: /Pix de demonstração/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    panel.getByRole("radio", { name: /Cartão de teste/ }),
  ).toBeChecked();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Carrinho 2" })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("radio", { name: /Cartão de teste/ }),
  ).toBeChecked();
  await page.mouse.click(15, 150);
  await expect(panel).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Carrinho 2" })).toBeFocused();
  await page.keyboard.press("Enter");
  await panel.getByRole("button", { name: "Finalizar compra" }).focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("alert")).toContainText(
    "Falha de teste por teclado.",
  );
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`layout sem overflow em ${viewport.width}px e rodapé acessível`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Carrinho 2" }),
    ).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const cards = await page.locator(".product").all();
    const first = (await cards[0].boundingBox())!;
    const second = (await cards[1].boundingBox())!;
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
    await page.screenshot({
      path: testInfo.outputPath("loja.png"),
      fullPage: true,
    });
    const panel = await openCheckout(page);
    const bounds = (await panel.boundingBox())!;
    expect(bounds.width).toBe(Math.min(480, viewport.width));
    expect(bounds.x + bounds.width).toBe(viewport.width);
    expect(
      await panel.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await expect(
      panel.getByRole("button", { name: "Finalizar compra" }),
    ).toBeInViewport();
    await panel.getByRole("radio", { name: /Cartão de teste/ }).check();
    await expect(panel.getByText("CLIENTE TESTE")).toBeVisible();
    const paymentNote = panel.locator(".payment-info > p");
    await paymentNote.scrollIntoViewIfNeeded();
    const visibility = await paymentNote.evaluate((element) => {
      const detail = element.getBoundingClientRect();
      const body = element.closest(".panel-body")!.getBoundingClientRect();
      return {
        top: detail.top - body.top,
        bottom: body.bottom - detail.bottom,
      };
    });
    // Chromium rounds scroll offsets to whole pixels; text bounds are fractional.
    expect(visibility.top).toBeGreaterThanOrEqual(-1);
    expect(visibility.bottom).toBeGreaterThanOrEqual(-1);
    await expect(
      panel.getByRole("button", { name: "Finalizar compra" }),
    ).toBeInViewport();
    expect(
      await panel
        .locator(".panel-body")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("checkout.png") });
    await panel.getByRole("button", { name: "Fechar checkout" }).click();
  });
}

test("falha de carregamento oferece recarregar e mantém carrinho indisponível", async ({
  page,
}) => {
  await page.route("http://localhost:3002/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível carregar a loja",
  );
  await expect(page.getByRole("button", { name: /^Carrinho/ })).toBeDisabled();
  await page.route("http://localhost:3002/**", (route) =>
    route.fulfill({ json: { items: products } }),
  );
  await page.getByRole("button", { name: "Recarregar página" }).click();
  await expect(page.getByRole("button", { name: "Carrinho 2" })).toBeEnabled();
});
