import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createOAuthHandler } from "./bunq/OAuthHandler";
import { getBunqClient } from "./bunq/BunqClient";
import type { BunqAuthProps } from "./bunq/BunqClient";
import { registerTools } from "./tools";
import { bunqClientId, bunqClientSecret } from "./config";

// OAuth mode only. config.ts throws at load if the client ID, client secret or per-user
// keys are missing, so the server refuses to start.
console.log("Using OAuth flow with client ID and secret (reads and draft payments only)");

// Add the bunq props that we'll store in the token
type ExtendedProps = BunqAuthProps;

export class MyMCP extends McpAgent<ExtendedProps, Env> {
  server = new McpServer({
    name: "Bunq MCP",
    version: "1.0.0",
  });

  async init() {
    const { accessToken } = this.props as ExtendedProps;

    const bunqClient = getBunqClient(accessToken);
    await bunqClient.initialize();

    const tools = registerTools(bunqClient);
    for (const tool of tools) {
      this.server.tool(
        tool.name,
        tool.description,
        tool.parameters,
        async (args: any, extra: any) => {
          // We need to properly handle the args and wrap handler for type safety
          return await tool.handler(args, extra);
        },
      );
    }
  }
}

// No "/" info page: unknown paths fall through to the handler's 404.
const bunqHandler = createOAuthHandler(bunqClientId, bunqClientSecret);

export default new OAuthProvider({
  apiRoute: "/sse",
  apiHandler: MyMCP.mount("/sse") as any,
  defaultHandler: bunqHandler as any,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
