#!/usr/bin/env node

// @ts-check

import { env } from "node:process";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { ensureKeys, getKeyDir } from "./keys.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const {
  values: {
    help,
    "generate-keys": generateKeys,
    mcp,
    port,
    "bunq-client-id": bunqClientId,
    "bunq-client-secret": bunqClientSecret,
    version,
  },
} = parseArgs({
  options: {
    help: { type: "boolean" },
    "generate-keys": { type: "boolean" },
    mcp: { type: "boolean" },
    port: { type: "string", short: "p" },
    "bunq-client-id": { type: "string" },
    "bunq-client-secret": { type: "string" },
    version: { type: "boolean", short: "v" },
  },
});

let hasArgs = false;

async function printHelp() {
  await printVersion();
  console.log("\nUsage: bunq-mcp [options]\n");
  console.log("Options:");
  console.log("  --help              Show help");
  console.log("  --version           Show version");
  console.log("  --generate-keys     Generate key pair and cookie secret in the per-user folder");
  console.log("  --mcp               Start MCP server");
  console.log("  --port <port>       Port (for MCP server)");
  console.log(
    "  --bunq-client-id <id>         Bunq client ID (alternative to BUNQ_CLIENT_ID env var)",
  );
  console.log(
    "  --bunq-client-secret <secret> Bunq client secret (alternative to BUNQ_CLIENT_SECRET env var)",
  );

  console.log("");
  console.log("Hint:");
  console.log("  - A bunq OAuth client id AND secret are required. API keys are not supported.");
  console.log("  - The server binds to 127.0.0.1 only.");
  console.log(`  - Keys are kept in '${getKeyDir()}'.`);
}

async function printVersion() {
  const packageJson = await readFile(join(__dirname, "../package.json"), "utf-8");
  const { version } = JSON.parse(packageJson);
  console.log(`\nBunq MCP v${version}\n`);
}

if (help) {
  hasArgs = true;
  await printHelp();
  process.exit(0);
}

if (version) {
  hasArgs = true;
  await printVersion();
  process.exit(0);
}

if (generateKeys) {
  hasArgs = true;
  const created = ensureKeys();
  console.log(
    created ? `Keys generated in '${getKeyDir()}'` : `Keys already present in '${getKeyDir()}'`,
  );
}

if (mcp) {
  hasArgs = true;

  const clientId = bunqClientId || env["BUNQ_CLIENT_ID"];
  const clientSecret = bunqClientSecret || env["BUNQ_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    console.error("A bunq OAuth client id and secret are required. See --help.");
    process.exit(1);
  }

  if (ensureKeys()) {
    console.log(`First run: keys generated in '${getKeyDir()}'`);
  }

  console.log("Starting MCP server");
  const viteArgs = ["vite", "--config", join(__dirname, "../vite.config.ts")];
  if (port) {
    viteArgs.push("--port", port);
  }
  const vite = spawn("npx", viteArgs, {
    stdio: "inherit",
    shell: true,
    cwd: join(__dirname, "../"),
    env: {
      ...env,
      BUNQ_CLIENT_ID: clientId,
      BUNQ_CLIENT_SECRET: clientSecret,
    },
  });

  // Handle Ctrl+C (SIGINT) to stop vite
  process.on("SIGINT", () => {
    if (vite) {
      vite.kill("SIGINT");
    }
    process.exit(0);
  });

  vite.on("exit", (code) => {
    process.exit(code);
  });
}

if (!hasArgs) {
  await printHelp();
  process.exit(1);
}
