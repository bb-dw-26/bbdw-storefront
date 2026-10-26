import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const storefront = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = resolve(storefront, "..");
const processes = [];
if (process.argv.length > 2) throw new Error("Uso: npm run smoke (sem argumentos).");
const envelopes = [];
let collector;
let provider;
let lookups = 0;
let browser;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function assertFree(port) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => server.close(resolve));
}

function start(command, args, cwd, env = {}) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const entry = { child, output: "", error: null };
  processes.push(entry);
  child.on("error", (error) => {
    entry.error = error;
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (data) => {
      entry.output = (entry.output + data.toString()).slice(-4000);
    });
  }
}

async function ready(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const failed = processes.find(
      (entry) => entry.error || entry.child.exitCode !== null,
    );
    if (failed) throw new Error(failed.error?.message ?? failed.output);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch {
      /* Aguardar somente os processos iniciados por este script. */
    }
    await delay(200);
  }
  throw new Error(`Serviço não iniciou: ${url}`);
}

try {
  for (const port of [3200, 3202, 3203]) await assertFree(port);
  // Transporte HTTP real do SDK, mas só para um coletor local sem conta Sentry.
  collector = createHttpServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    envelopes.push(Buffer.concat(chunks).toString());
    response.writeHead(200, { "Content-Type": "application/json" }).end("{}");
  });
  await new Promise((resolve) => collector.listen(0, "127.0.0.1", resolve));
  provider = createHttpServer((request, response) => {
    lookups++;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ cep: "01001-000", logradouro: "Rua Fictícia", bairro: "Centro", localidade: "Cidade Demo", uf: "SP" }));
  });
  await new Promise((resolve) => provider.listen(0, "127.0.0.1", resolve));
  start(
    resolve(
      workspace,
      "bbdw-catalog",
      "bin",
      process.platform === "win32" ? "catalog.exe" : "catalog",
    ),
    [],
    resolve(workspace, "bbdw-catalog"),
    { PORT: "3202", CORS_ORIGIN: "http://localhost:3200", SENTRY_DSN: "" },
  );
  start(
    process.execPath,
    ["dist/src/main.js"],
    resolve(workspace, "bbdw-checkout"),
    {
      PORT: "3203",
      CORS_ORIGIN: "http://localhost:3200",
      CATALOG_URL: "http://127.0.0.1:3202",
      DEPENDENCY_TIMEOUT_MS: "2000",
      CHECKOUT_DEMO_DELAY_MS: "0",
      VIACEP_BASE_URL: `http://127.0.0.1:${provider.address().port}`,
      SENTRY_DSN: `http://public@127.0.0.1:${collector.address().port}/1`,
      SENTRY_RELEASE: "smoke-local",
      SENTRY_ENVIRONMENT: "test",
      DEMO_SCENARIO: "none",
      DEMO_RUN_ID: "smoke-local",
    },
  );
  start(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      "3200",
      "--strictPort",
    ],
    storefront,
    {
      VITE_SENTRY_DSN: "",
      VITE_CATALOG_URL: "http://localhost:3202",
      VITE_CHECKOUT_URL: "http://localhost:3203",
    },
  );
  await Promise.all(
    [3202, 3203].map((port) => ready(`http://127.0.0.1:${port}/health`)),
  );
  await ready("http://127.0.0.1:3200");
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://localhost:3200");
  const panel = page.getByRole("dialog");
  await page.getByRole("button", { name: /^Carrinho/ }).click();
  await expect(panel).toBeVisible();
  const submit = panel.getByRole("button", { name: "Finalizar compra" });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(panel.getByRole("status")).toContainText("Pedido confirmado!");
  await expect(panel.getByRole("status")).toContainText("80,00");
  expect(lookups).toBe(0);
  await panel.getByRole("button", { name: "Continuar comprando", exact: true }).click();
  await expect(panel).not.toBeVisible();
  await page.getByRole("button", { name: "Adicionar Caneca Demo ao carrinho" }).click();
  await page.getByRole("button", { name: /^Carrinho/ }).click();
  await panel.getByRole("spinbutton", { name: "Quantidade de Caneca Demo" }).fill("2");
  await panel.getByRole("radio", { name: /Receber em casa/ }).check();
  await expect(submit).toBeDisabled();
  await panel.getByLabel("CEP", { exact: true }).fill("01001-000");
  await panel.getByRole("button", { name: "Buscar endereço" }).click();
  await expect(panel.getByLabel("Rua", { exact: true })).toHaveValue("Rua Fictícia");
  await panel.getByLabel("Número", { exact: true }).fill("s/n");
  await submit.click();
  await expect(panel.getByRole("status")).toContainText("Pedido confirmado!");
  await expect(panel.getByRole("status")).toContainText("Rua Fictícia");
  expect(lookups).toBe(1);
  expect(envelopes).toHaveLength(0);
  expect(errors).toEqual([]);
  await mkdir(resolve(storefront, "test-results"), { recursive: true });
  await page.screenshot({
    path: resolve(storefront, "test-results/integrated.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel.getByRole("button", { name: "Continuar comprando", exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  console.log(
    "Compra real validada: retirada sem consulta de CEP, entrega com endereço e layout mobile.",
  );
} finally {
  try { await browser?.close(); } finally {
  for (const { child } of processes.reverse()) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else {
      child.kill("SIGTERM");
      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        delay(3200),
      ]);
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGKILL");
    }
  }
  if (provider?.listening) {
    provider.closeAllConnections();
    await new Promise((resolve) => provider.close(resolve));
  }
  if (collector?.listening) {
    collector.closeAllConnections();
    await new Promise((resolve) => collector.close(resolve));
  }
  }
  console.log("Processos iniciados pelo smoke test foram encerrados.");
}
