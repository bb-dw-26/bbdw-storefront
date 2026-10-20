import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const storefront = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = resolve(storefront, "..");
const processes = [];
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
  for (const port of [3000, 3001, 3002, 3003]) await assertFree(port);
  start(
    process.execPath,
    ["dist/src/main.js"],
    resolve(workspace, "bbw-users"),
    { PORT: "3001", CORS_ORIGIN: "http://localhost:3000" },
  );
  start(
    resolve(
      workspace,
      "bbw-catalog",
      "bin",
      process.platform === "win32" ? "catalog.exe" : "catalog",
    ),
    [],
    resolve(workspace, "bbw-catalog"),
    { PORT: "3002", CORS_ORIGIN: "http://localhost:3000" },
  );
  start(
    process.execPath,
    ["dist/src/main.js"],
    resolve(workspace, "bbw-checkout"),
    {
      PORT: "3003",
      CORS_ORIGIN: "http://localhost:3000",
      USERS_URL: "http://127.0.0.1:3001",
      CATALOG_URL: "http://127.0.0.1:3002",
      DEPENDENCY_TIMEOUT_MS: "2000",
    },
  );
  start(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      "3000",
      "--strictPort",
    ],
    storefront,
    {
      VITE_USERS_URL: "http://localhost:3001",
      VITE_CATALOG_URL: "http://localhost:3002",
      VITE_CHECKOUT_URL: "http://localhost:3003",
    },
  );
  await Promise.all(
    [3001, 3002, 3003].map((port) => ready(`http://127.0.0.1:${port}/health`)),
  );
  await ready("http://127.0.0.1:3000");
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://localhost:3000");
  const submit = page.getByRole("button", { name: "Finalizar compra" });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("status")).toContainText("Pedido confirmado!");
  await expect(page.getByRole("status")).toContainText("80,00");
  await page.getByLabel("Como deseja receber?").selectOption("delivery");
  await submit.click();
  await expect(page.getByRole("alert")).toContainText("endereço");
  await expect(
    page.getByRole("spinbutton", { name: "Quantidade de Caneca Demo" }),
  ).toHaveValue("2");
  await page
    .getByLabel("Cliente", { exact: true })
    .selectOption("customer-delivery");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("Pedido confirmado!");
  await expect(page.getByRole("status")).toContainText("Rua Fictícia");
  expect(errors).toEqual([]);
  await mkdir(resolve(storefront, "test-results"), { recursive: true });
  await page.screenshot({
    path: resolve(storefront, "test-results/integrated.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(submit).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  console.log(
    "Compra real validada: retirada, erro de endereço, entrega e layout mobile.",
  );
} finally {
  await browser?.close();
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
        delay(3000),
      ]);
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGKILL");
    }
  }
  console.log("Processos iniciados pelo smoke test foram encerrados.");
}
