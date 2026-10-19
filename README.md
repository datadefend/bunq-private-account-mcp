# bunq-private-account-mcp

An MCP server for your personal bunq account. It lets an AI assistant read your accounts and transactions
and prepare draft payments. It cannot send money: every draft waits until you accept or reject it in the
bunq app.

> **Disclaimer.** This is unofficial software, provided free of charge and "as is", without warranty of any
> kind and without support. It is not affiliated with, endorsed by or supported by bunq B.V. You use it
> entirely at your own risk, including any draft payment you accept. To the fullest extent permitted by
> applicable law, datadefend GmbH, its managing directors and all contributors accept no liability for any
> damage or loss arising from its use. There is no support, no maintenance commitment and no guaranteed
> response to issues. See also the [LICENSE](LICENSE).

Published by [datadefend](https://github.com/datadefend). Based on the community
[bunq-mcp](https://github.com/WilcoKruijer/bunq-mcp) by Wilco Kruijer (commit `500be7d`), with security
changes on top. Commits up to `4e6a78a` are the original code; `git diff 4e6a78a` shows every change made
here.

## What it can do

| Tool | What it does |
| --- | --- |
| `bunqAccounts` | Lists your monetary accounts and balances |
| `getTransactions` | Returns recent payments on an account |
| `getRequestInquiries` | Returns payment requests you sent or received |
| `getPaymentAutoAllocates` | Returns automatic payment allocation rules |
| `getTopCounterparties` | Returns the people and companies you pay most |
| `createDraftPayment` | Prepares one draft payment in EUR to an IBAN, for you to accept in the bunq app |

The server can send exactly two kinds of request to bunq: reads, and the creation of a draft payment. It
has no tool and no code path that executes a payment, creates a payment request or changes your account.

## Draft payments

- **Nothing moves without you.** bunq holds every draft until you accept it in the app.
- **IBAN only, EUR only.** The IBAN checksum is verified before a draft is created. Email and phone
  recipients are not supported.
- **Your own accounts only.** The source account must be one of your bunq accounts.
- **One payment per draft.** No schedules and no recurring drafts.
- **Optional cap.** Set `BUNQ_DRAFT_MAX_AMOUNT`, for example `500`, to refuse drafts above that amount.
- **Check the IBAN in the app.** The app shows the recipient name the assistant entered, not a verified
  account holder name. Before you accept, compare the IBAN with what you expect.
- **Watch for instructions in your data.** Anyone can put text in a payment description by sending you a
  small amount. If the assistant proposes a draft you did not ask for, reject it.

## Setup

1. **Node.js 20 or later.**
2. **Create a bunq OAuth client** in the bunq app under developer settings. Set the redirect URL to exactly
   `http://127.0.0.1:8788/callback` and note the client ID and client secret.
3. **Start the server** from any folder other than a clone of this repository. The first run creates your
   signing keys (see below).

   ```bash
   npx @datadefend/bunq-private-account-mcp --mcp
   ```

   Pass the OAuth client through the `BUNQ_CLIENT_ID` and `BUNQ_CLIENT_SECRET` environment variables. The
   `--bunq-client-id` and `--bunq-client-secret` flags work too, but they end up in your shell history.
4. **Connect your MCP client** through `mcp-remote`, always with `127.0.0.1` rather than `localhost`:

   ```json
   { "mcpServers": { "bunq": { "command": "npx", "args": ["mcp-remote", "http://127.0.0.1:8788/sse"] } } }
   ```

   The first connection opens your browser for the bunq approval.

**Keys.** On first run the server creates an RSA key pair for signing bunq requests and a cookie secret in
`%APPDATA%\bunq-private-account-mcp` on Windows, or `~/.config/bunq-private-account-mcp` on Linux and
macOS. It refuses to start without them. To rotate them, delete the folder and start again, or run
`--generate-keys`.

**Token.** The bunq OAuth token is held in memory only and never written to disk. After every restart your
MCP client has to authorize again.

**Do not** deploy it to Cloudflare or keep a `dist/` folder from `npm run build`: a build embeds the client
secret and keys.

## Good to know

- Everything the tools return goes to your AI model provider. That includes names and IBANs of the people
  you pay.
- Keep your MCP client set to ask before each tool call.
- The server binds to `127.0.0.1` only and refuses any other host.
- When you stop using it, revoke the OAuth client in the bunq app and remove the old
  "Bunq MCP Integration" devices.

## Changes against the original

1. **No real payments.** `createPayment` and `createPaymentRequest` are removed with the API methods behind
   them. The request layer rejects every write except the draft-payment endpoint.
2. **Safer drafts.** `createDraftPayment` now accepts EUR and IBAN only, verifies the IBAN checksum and the
   source account, drops schedules and supports a maximum amount.
3. **API-key mode removed.** OAuth is the only way in, and the server refuses to start without an OAuth
   client ID and secret. The Docker setup, which was API-key only, is gone too.
4. **No local state.** Local persistence is off, so the OAuth token never reaches `.wrangler/state`.
5. **Per-user keys.** The bundled signing key and cookie secret are removed. Each user's keys are generated
   outside the package, so an update cannot replace them.
6. **No info page.** `/` returns 404 instead of showing the client ID, cookie secret and account name.
7. **Less logging.** Request and response bodies are no longer logged.
8. **Loopback only.** The server binds to `127.0.0.1`, and the `--host` option is gone.
9. **Smaller dependency tree.** Unused dependencies are removed.

## Security

If you find a vulnerability, you can report it privately as described in [SECURITY.md](SECURITY.md).

## License

MIT, provided "as is" without warranty. See [LICENSE](LICENSE).
