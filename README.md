# bunq-mcp-readonly

A read-only MCP server for your personal bunq account. It lets an AI assistant look at your accounts and
transactions, and it cannot create, draft or request any payment.

Maintained by [datadefend](https://github.com/datadefend). Based on the community
[bunq-mcp](https://github.com/WilcoKruijer/bunq-mcp) by Wilco Kruijer (commit `500be7d`), with a security
patch on top. Commits up to `4e6a78a` are the original code; `git diff 4e6a78a` shows every change made here.

## What it can do

| Tool | Returns |
| --- | --- |
| `bunqAccounts` | Your monetary accounts and balances |
| `getTransactions` | Recent payments on an account |
| `getRequestInquiries` | Payment requests you sent or received |
| `getPaymentAutoAllocates` | Automatic payment allocation rules |
| `getTopCounterparties` | The people and companies you pay most |

There are no write tools, and after session setup the server only sends GET requests to bunq.

## Setup

1. **Node.js 20 or later.**
2. **Create a bunq OAuth client** in the bunq app under developer settings. Set the redirect URL to exactly
   `http://127.0.0.1:8788/callback` and note the client ID and client secret.
3. **Start the server.** The first run creates your signing keys (see below).

   ```bash
   npx @datadefend/bunq-mcp-readonly --mcp
   ```

   Pass the OAuth client through the `BUNQ_CLIENT_ID` and `BUNQ_CLIENT_SECRET` environment variables. The
   `--bunq-client-id` and `--bunq-client-secret` flags work too, but they end up in your shell history.
4. **Connect your MCP client** through `mcp-remote`, always with `127.0.0.1` rather than `localhost`:

   ```json
   { "mcpServers": { "bunq": { "command": "npx", "args": ["mcp-remote", "http://127.0.0.1:8788/sse"] } } }
   ```

   The first connection opens your browser for the bunq approval.

**Keys.** On first run the server creates an RSA key pair for signing bunq requests and a cookie secret in
`%APPDATA%\bunq-mcp-readonly` on Windows, or `~/.config/bunq-mcp-readonly` on Linux and macOS. It refuses
to start without them. To rotate them, delete the folder and start again, or run `--generate-keys`.

**Token.** The bunq OAuth token is held in memory only and never written to disk. After every restart your
MCP client has to authorize again.

**Do not** deploy it to Cloudflare or keep a `dist/` folder from `npm run build`: a build embeds the client
secret and keys.

## Good to know

- Everything the tools return goes to your AI model provider. That includes names and IBANs of the people
  you pay.
- The server binds to `127.0.0.1` only and refuses any other host.
- When you stop using it, revoke the OAuth client in the bunq app and remove the old
  "Bunq MCP Integration" devices.

## Changes against the original

1. **Write tools removed.** `createPayment`, `createDraftPayment` and `createPaymentRequest` are gone, with
   the API methods behind them.
2. **API-key mode removed.** OAuth is the only way in, and the server refuses to start without an OAuth
   client ID and secret. The Docker setup, which was API-key only, is gone too.
3. **No local state.** Local persistence is off, so the OAuth token never reaches `.wrangler/state`.
4. **Per-user keys.** The bundled signing key and cookie secret are removed. Each user's keys are generated
   outside the package, so an update cannot replace them.
5. **No info page.** `/` returns 404 instead of showing the client ID, cookie secret and account name.
6. **Less logging.** Request and response bodies are no longer logged.
7. **Loopback only.** The server binds to `127.0.0.1`, and the `--host` option is gone.
8. **Smaller dependency tree.** Unused dependencies are removed.

## Security

Please report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
