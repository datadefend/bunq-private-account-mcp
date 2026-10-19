// All secrets are injected by vite.config.ts at dev-server start: the bunq OAuth client
// from the environment, the RSA key pair and cookie secret from the per-user key folder
// (see bin/keys.js). Nothing is read from the repository.

const injected = process.env as Record<string, string | undefined>;

function required(name: string, hint: string): string {
  const value = injected[name];
  if (!value) {
    throw new Error(`${name} is not set. ${hint}`);
  }
  return value;
}

const oauthHint =
  "This read-only build only supports OAuth: pass --bunq-client-id and --bunq-client-secret, " +
  "or set BUNQ_CLIENT_ID and BUNQ_CLIENT_SECRET.";
const keysHint = "Start through 'node bin/run.js --mcp' so the per-user keys are generated.";

export const bunqClientId = required("BUNQ_CLIENT_ID", oauthHint);
export const bunqClientSecret = required("BUNQ_CLIENT_SECRET", oauthHint);
export const bunqPublicKey = required("BUNQ_PUBLIC_KEY", keysHint);
export const bunqPrivateKey = required("BUNQ_PRIVATE_KEY", keysHint);
export const cookieSecret = required("BUNQ_COOKIE_SECRET", keysHint);
