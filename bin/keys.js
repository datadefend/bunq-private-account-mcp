// @ts-check

// Per-user key material, kept outside the repository.
// Windows: %APPDATA%\bunq-private-account-mcp, elsewhere: $XDG_CONFIG_HOME or ~/.config.
// BUNQ_MCP_HOME overrides the folder (used for testing with throwaway keys).

import { env } from "node:process";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generateKeyPairSync, randomBytes } from "node:crypto";

const FILES = {
  privateKey: "bunq-private-key.pem",
  publicKey: "bunq-public-key.pem",
  cookieSecret: "cookie-secret.txt",
};

export function getKeyDir() {
  if (env["BUNQ_MCP_HOME"]) {
    return env["BUNQ_MCP_HOME"];
  }
  const base = env["APPDATA"] || env["XDG_CONFIG_HOME"] || join(homedir(), ".config");
  return join(base, "bunq-private-account-mcp");
}

/**
 * Generates the RSA key pair and cookie secret if none exist yet.
 * Never overwrites: a partial set is an error the user has to resolve by hand.
 */
export function ensureKeys(dir = getKeyDir()) {
  const paths = Object.values(FILES).map((f) => join(dir, f));
  const present = paths.filter((p) => existsSync(p));
  if (present.length === paths.length) {
    return false;
  }
  if (present.length > 0) {
    throw new Error(
      `Incomplete key set in '${dir}'. Remove the remaining files there to regenerate all keys.`,
    );
  }

  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const write = (/** @type {string} */ name, /** @type {string} */ value) =>
    writeFileSync(join(dir, name), value, { flag: "wx", mode: 0o600 });
  write(FILES.privateKey, privateKey);
  write(FILES.publicKey, publicKey);
  write(FILES.cookieSecret, randomBytes(32).toString("hex"));
  return true;
}

/** Reads the key material, or throws if any of it is missing. */
export function loadKeys(dir = getKeyDir()) {
  const read = (/** @type {string} */ name) => {
    const path = join(dir, name);
    if (!existsSync(path)) {
      throw new Error(
        `Missing '${path}'. Run 'node bin/run.js --generate-keys' (or start with --mcp) first.`,
      );
    }
    return readFileSync(path, "utf-8").replace(/\r\n/g, "\n").trim();
  };
  return {
    privateKey: read(FILES.privateKey),
    publicKey: read(FILES.publicKey),
    cookieSecret: read(FILES.cookieSecret),
  };
}
