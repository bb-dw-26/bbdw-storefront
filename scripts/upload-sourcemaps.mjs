import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
for (const key of ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT", "VITE_SENTRY_RELEASE"]) {
  if (!process.env[key]) throw new Error(`Configure ${key} antes do upload.`);
}
if (process.env.SENTRY_PROJECT !== "bbdw-storefront") throw new Error("Use o projeto dedicado bbdw-storefront.");
const cli = require("@sentry/cli").SentryCli.getPath();
// Injetar Debug IDs e publicar o mesmo dist que será servido ao navegador.
execFileSync(cli, ["sourcemaps", "inject", "dist"], { stdio: "inherit" });
execFileSync(cli, ["sourcemaps", "upload", "dist", "--release", process.env.VITE_SENTRY_RELEASE, "--validate", "--strict"], { stdio: "inherit" });
