import { configureDashboard } from "../scripts/cloudflare-setup.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";

const config = {
  name: "studio-admin",
  assets: { binding: "ASSETS" },
  services: [{ binding: "OTHER", service: "other" }],
  vars: { EXISTING: "kept" },
};

test("dashboard setup creates API service binding and preserves other config", () => {
  const result = configureDashboard(config, {});
  assert.deepEqual(result.services, [
    { binding: "OTHER", service: "other" },
    { binding: "API", service: "jkt48connect-cf" },
  ]);
  assert.deepEqual(result.assets, config.assets);
  assert.equal(result.vars.EXISTING, "kept");
  assert.deepEqual(configureDashboard(result, {}), result);
});

test("dashboard setup supports Worker names from the deployment environment", () => {
  const result = configureDashboard(config, {
    CLOUDFLARE_DASHBOARD_WORKER_NAME: "my-dashboard",
    CLOUDFLARE_API_WORKER_NAME: "my-api",
    API_BASE_URL: "https://api.example.com",
  });
  assert.equal(result.name, "my-dashboard");
  assert.equal(result.services[1].service, "my-api");
  assert.equal(result.vars.API_BASE_URL, "https://api.example.com");
});

test("dashboard setup rejects self-binding and invalid upstream URLs", () => {
  assert.throws(() => configureDashboard(config, { CLOUDFLARE_API_WORKER_NAME: "studio-admin" }), /berbeda/);
  assert.throws(() => configureDashboard(config, { API_BASE_URL: "file:///tmp/test" }), /HTTP/);
});
