import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();
// OpenNext must call the Next-only build, because npm run build bundles the Worker.
config.buildCommand = "npm run build:next";

export default config;
