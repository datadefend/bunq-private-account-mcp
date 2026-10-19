# bunq-mcp, read-only patch

Local, read-only build of the community bunq MCP server
([WilcoKruijer/bunq-mcp](https://github.com/WilcoKruijer/bunq-mcp), commit `500be7d`, unmaintained
since May 2025). OAuth mode only, for one personal bunq account on one machine. The first commit in
this repo is upstream unchanged, so `git diff HEAD~1` shows the whole patch.

## Tools

`bunqAccounts`, `getTransactions`, `getRequestInquiries`, `getPaymentAutoAllocates`,
`getTopCounterparties`. Nothing that creates, drafts or requests a payment.

## Setup

1. **Node.js** (tested with 24), then `npm ci` in this folder.
2. **Create a bunq OAuth client** in the bunq app (developer settings, OAuth). Set the redirect URL to
   exactly `http://127.0.0.1:8788/callback`. Note the client ID and client secret. When you approve
   access later, grant the narrowest access bunq offers.
3. **Start the server** (first run generates the keys, see below):

   ```bash
   node bin/run.js --mcp --bunq-client-id <id> --bunq-client-secret <secret>
   ```

   `BUNQ_CLIENT_ID` and `BUNQ_CLIENT_SECRET` environment variables work too. Prefer them over flags
   if you do not want the secret in your shell history.
4. **Connect your MCP client** through `mcp-remote`, always with `127.0.0.1`, not `localhost`:

   ```json
   { "mcpServers": { "bunq": { "command": "npx", "args": ["mcp-remote", "http://127.0.0.1:8788/sse"] } } }
   ```

   The first connection opens the browser for the bunq OAuth approval.

**Keys.** On first run the server creates an RSA key pair (for signing bunq API requests) and a
cookie secret in `%APPDATA%\bunq-mcp-readonly` (Linux and macOS: `~/.config/bunq-mcp-readonly`).
It refuses to start if they are missing or incomplete. To rotate, delete the folder and start again.
`node bin/run.js --generate-keys` creates them without starting.

**Token lifetime.** The bunq OAuth token is held in memory only. After every restart the MCP client
has to authorize again.

**Do not** run `npm run deploy`, and do not keep or share `dist/` after `npm run build`: the build
embeds the client secret and keys.

## Changes against upstream

1. Write tools removed: `createPayment`, `createDraftPayment`, `createPaymentRequest`, plus the
   underlying API methods; the bunq request helper now rejects anything but GET after session setup.
2. API-key mode removed: no `--bunq-api-key`, no `BUNQ_API_KEY`, no Docker setup (it was API-key
   only); the server refuses to start without an OAuth client ID and secret.
3. No local state: `persistState: false` in the Cloudflare Vite plugin, so the OAuth token and KV
   data never reach `.wrangler/state` (finding N1).
4. Bundled keys removed: `src/keys` is gone; key pair and cookie secret are generated per user
   outside the repo, and startup fails without them (finding H1). Upstream at this commit had no
   `_.dev.vars` file, so there was nothing to delete there.
5. Info page removed: `/` returns 404 instead of printing the client ID, cookie secret and account
   name (finding M3).
6. Body logging removed: no more `POSTING` or `RESPONSE` dumps, and a failed token exchange logs only
   the HTTP status (finding L2).
7. Loopback only: Vite and `wrangler dev` bind to `127.0.0.1`, `--host` is gone, and the Vite config
   refuses any other host.

`README.OLD.md` is upstream's earlier readme and partly describes removed features.
