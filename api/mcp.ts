import type { VercelRequest, VercelResponse } from "@vercel/node";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "../src/mcpServer.js";

// Stateless MCP over Streamable HTTP: a new server and transport per request, nothing kept between calls.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed. Use POST." }, id: null });
    return;
  }
  // On Vercel, req.body is parsed lazily and throws when the JSON is malformed, so read it inside a guard.
  let body: unknown;
  try {
    body = req.body;
  } catch {
    res.status(400).json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error: the body is not valid JSON." }, id: null });
    return;
  }
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch {
    if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
  }
}
