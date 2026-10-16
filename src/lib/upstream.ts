import { getCloudflareContext } from "@opennextjs/cloudflare";

// Bind API to the v5 Worker to avoid public-domain WAF and cross-origin cookies.
export async function fetchUpstream(path: string, init?: RequestInit): Promise<Response> {
  let env: { API?: { fetch: typeof fetch }; API_BASE_URL?: string } = {};
  try {
    env = (await getCloudflareContext({ async: true })).env as typeof env;
  } catch {
    // next build / standalone Next.js development may have no Worker context.
  }
  const base = env.API_BASE_URL ?? process.env.API_BASE_URL ?? "https://v5.jkt48connect.com";
  const url = new URL(path, base);
  return env.API ? env.API.fetch(url.toString(), init) : fetch(url, { ...init, cache: "no-store" });
}
