import { test, expect } from "@playwright/test";

test("mantém carrinho após erro e confirma retirada na nova tentativa", async ({
  page,
}) => {
  await page.route("http://localhost:3002/**", (route) =>
    route.fulfill({
      json: {
        items: [
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
        ],
      },
    }),
  );
  await page.route("http://localhost:3001/**", (route) =>
    route.fulfill({
      json: {
        id: route.request().url().split("/").at(-1),
        name: route.request().url().endsWith("customer-pickup")
          ? "Cliente Retirada"
          : "Cliente Entrega",
        address: null,
      },
    }),
  );
  let attempts = 0;
  await page.route("http://localhost:3003/orders", async (route) => {
    attempts++;
    expect(route.request().postDataJSON()).toEqual({
      customerId: "customer-pickup",
      fulfillment: "pickup",
      items: [{ productId: "product-standard", quantity: 2 }],
    });
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
      await route.fulfill({
        status: 201,
        json: {
          id: "order-test",
          fulfillment: "pickup",
          deliveryAddress: null,
          totalCents: 8000,
        },
      });
    }
  });
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: "Caderno Demo: sem imagem" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Finalizar compra" }).click();
  await expect(page.getByRole("alert")).toContainText("Falha simulada");
  await expect(
    page.getByRole("spinbutton", { name: "Quantidade de Caneca Demo" }),
  ).toHaveValue("2");
  await page.getByRole("button", { name: "Finalizar compra" }).click();
  await expect(page.getByRole("status")).toContainText("Pedido confirmado!");
  await expect(page.getByRole("status")).toContainText("80,00");
  await expect(page.getByRole("status")).toContainText("Retirada na loja");
  expect(attempts).toBe(2);
});
