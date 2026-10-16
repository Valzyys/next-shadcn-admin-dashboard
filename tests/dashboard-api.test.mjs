import { fetchDashboardApi } from "../src/lib/dashboard-fetch.ts";
import { getSidebarItems } from "../src/navigation/sidebar/sidebar-items.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("admin navigation uses the backend role", () => {
  assert.equal(
    getSidebarItems(false).some((group) => group.label === "Admin"),
    false,
  );
  assert.equal(
    getSidebarItems(true).some((group) => group.label === "Admin"),
    true,
  );
});

test("API failures, malformed responses and network errors keep a usable JSON response", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ status: false, message: "Akses ditolak" }, { status: 403 });
    let response = await fetchDashboardApi("/api/gateway/admin/stats");
    assert.equal(response.status, 403);
    assert.equal((await response.json()).message, "Akses ditolak");
    globalThis.fetch = async () => new Response("<html>Unavailable</html>", { status: 503 });
    response = await fetchDashboardApi("/api/gateway/admin/stats");
    assert.equal(response.status, 502);
    assert.equal((await response.json()).status, false);
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    response = await fetchDashboardApi("/api/gateway/admin/stats");
    assert.equal(response.status, 502);
    assert.equal((await response.json()).status, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
