import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { EXTRAS } from "./priceList.js";
import { getQuote, listServices, QuoteError } from "./quote.js";

const extraIds = EXTRAS.map((e) => e.id) as [string, ...string[]];

export const quoteInputShape = {
  kind: z.enum(["car", "van", "4x4"]).describe("Vehicle type."),
  size: z.enum(["small", "medium", "large", "extra_large"]).optional().describe("Required for cars and vans, ignored for 4x4."),
  extras: z
    .array(z.object({ id: z.enum(extraIds), quantity: z.number().int().min(1).max(4).optional() }))
    .optional()
    .describe("Additional services. Only headlight_restoration can have a quantity above 1 (per light)."),
};

export function buildServer(): McpServer {
  const server = new McpServer({ name: "valet-quote-service", version: "0.1.0" });

  server.tool(
    "list_services",
    "List the standard valet starting prices and every additional service with its starting price, taken from the business's public price list.",
    async () => ({ content: [{ type: "text", text: JSON.stringify(listServices()) }] }),
  );

  server.tool(
    "get_price_quote",
    "Work out a 'starting from' price estimate for a valet. Prices are guidelines from the public price list; the owner confirms the final price. Returns line items, the estimate and notes to repeat to the customer.",
    quoteInputShape,
    async ({ kind, size, extras }) => {
      try {
        const quote = getQuote({ vehicle: { kind, size }, extras });
        return { content: [{ type: "text", text: JSON.stringify(quote) }] };
      } catch (err) {
        if (err instanceof QuoteError) {
          return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: err.code, message: err.message }) }] };
        }
        throw err;
      }
    },
  );

  return server;
}
