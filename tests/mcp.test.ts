import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "../src/mcpServer.js";

async function connect() {
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const server = buildServer();
  await server.connect(serverT);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientT);
  return client;
}
const text = (r: any) => (r.content as { type: string; text: string }[])[0]!.text;

describe("MCP tools", () => {
  it("exposes both tools", async () => {
    const c = await connect();
    const names = (await c.listTools()).tools.map((t) => t.name).sort();
    expect(names).toEqual(["get_price_quote", "list_services"]);
  });

  it("returns a quote through the tool", async () => {
    const c = await connect();
    const r = await c.callTool({ name: "get_price_quote", arguments: { kind: "car", size: "medium", extras: [{ id: "dog_hair_removal" }] } });
    expect(r.isError).toBeFalsy();
    expect(JSON.parse(text(r)).estimateFromPence).toBe(10000);
  });

  it("returns a structured error, not a crash, for a bad request", async () => {
    const c = await connect();
    const r = await c.callTool({ name: "get_price_quote", arguments: { kind: "van" } });
    expect(r.isError).toBe(true);
    expect(JSON.parse(text(r)).error).toBe("size_required");
  });

  it("rejects an unknown extra at the schema level", async () => {
    const c = await connect();
    const r = await c.callTool({ name: "get_price_quote", arguments: { kind: "car", size: "small", extras: [{ id: "gold_plating" }] } }).catch((e) => ({ isError: true, thrown: String(e) }));
    expect((r as any).isError).toBe(true);
  });
});
