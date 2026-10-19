import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { env } from "node:process";
// @ts-ignore: plain JS helper shared with bin/run.js
import { loadKeys } from "./bin/keys.js";

// Refuse to start without the OAuth client and the per-user key material.
if (!env["BUNQ_CLIENT_ID"] || !env["BUNQ_CLIENT_SECRET"]) {
  throw new Error(
    "BUNQ_CLIENT_ID and BUNQ_CLIENT_SECRET are required. This build only supports OAuth.",
  );
}
const keys = loadKeys();

export default defineConfig({
  // No local state on disk: the bunq OAuth token lives in memory only (finding N1).
  plugins: [
    cloudflare({ persistState: false }),
    {
      // Loopback only, even if --host is passed on the command line.
      name: "bind-loopback-only",
      configResolved(config) {
        if (config.server.host !== "127.0.0.1") {
          throw new Error(`Refusing to bind to '${config.server.host}': use 127.0.0.1 only.`);
        }
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 8788,
  },
  preview: {
    host: "127.0.0.1",
  },
  envPrefix: "BUNQ_",
  define: {
    "process.env": {
      BUNQ_CLIENT_ID: env["BUNQ_CLIENT_ID"],
      BUNQ_CLIENT_SECRET: env["BUNQ_CLIENT_SECRET"],
      BUNQ_PUBLIC_KEY: keys.publicKey,
      BUNQ_PRIVATE_KEY: keys.privateKey,
      BUNQ_COOKIE_SECRET: keys.cookieSecret,
      BUNQ_DRAFT_MAX_AMOUNT: env["BUNQ_DRAFT_MAX_AMOUNT"],
      IS_DEVELOPMENT: env["IS_DEVELOPMENT"],
    },
  },
});
