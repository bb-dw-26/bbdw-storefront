import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const photos = ["caneca", "caderno", "garrafa", "ecobag", "camiseta", "canetas"];

test("fotos locais carregam na vitrine e no carrinho; arquivo ausente tem fallback", async ({ page }) => {
  await page.route("https://sentry.invalid/**", (route) => route.fulfill({ json: {} }));
  await page.route("http://localhost:3002/**", (route) => route.fulfill({ json: { items: [
    ...photos.map((name, index) => ({ id: index === 0 ? "product-standard" : `photo-${name}`, name, priceCents: 4000, available: true, thumbnailUrl: `/demo-assets/${name}.png` })),
    { id: "broken-image", name: "Foto indisponível", priceCents: 1000, available: true, thumbnailUrl: "/demo-assets/not-found.png" },
  ] } }));
  await page.goto("/");
  for (const name of photos) {
    // Valida também que o arquivo de produção existe, não apenas um mock HTTP.
    expect(readFileSync(`public/demo-assets/${name}.png`).subarray(1, 4).toString()).toBe("PNG");
    const image = page.getByRole("img", { name, exact: true });
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  await page.getByRole("article", { name: "Foto indisponível" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("img", { name: "Foto indisponível: sem imagem" })).toBeVisible();
  await page.getByRole("button", { name: /^Carrinho/ }).click();
  const image = page.getByRole("dialog").getByRole("img", { name: "caneca", exact: true });
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
});
