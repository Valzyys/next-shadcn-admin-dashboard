import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function workerName(value, label) {
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(value)) throw new Error(`${label} bukan nama Worker yang valid`);
  return value;
}

export function configureDashboard(config, env = process.env) {
  const name = workerName(env.CLOUDFLARE_DASHBOARD_WORKER_NAME || config.name, "Dashboard");
  const api = workerName(
    env.CLOUDFLARE_API_WORKER_NAME ||
      config.services?.find((item) => item.binding === "API")?.service ||
      "jkt48connect-cf",
    "API",
  );
  if (name === api) throw new Error("Worker dashboard dan API harus memiliki nama berbeda");
  const base = new URL(env.API_BASE_URL || config.vars?.API_BASE_URL || "https://v5.jkt48connect.com");
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password)
    throw new Error("API_BASE_URL harus berupa origin HTTP/HTTPS tanpa kredensial");
  return {
    ...config,
    name,
    services: [...(config.services || []).filter((item) => item.binding !== "API"), { binding: "API", service: api }],
    vars: { ...config.vars, API_BASE_URL: base.origin },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const path = new URL("../wrangler.jsonc", import.meta.url);
    const source = readFileSync(path, "utf8");
    const config = JSON.parse(source);
    const resolved = configureDashboard(config);
    if (JSON.stringify(resolved) !== JSON.stringify(config)) {
      writeFileSync(path, `${JSON.stringify(resolved, null, 2)}\n`);
    }
    console.log("Wrangler dashboard siap: binding API diatur otomatis.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
