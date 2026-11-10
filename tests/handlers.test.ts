import { describe, expect, it } from "vitest";
import quote from "../api/quote.js";
import services from "../api/services.js";
import mcp from "../api/mcp.js";

// A minimal stand-in for Vercel's request and response objects.
function fakeRes() {
  const out: { status?: number; body?: unknown; headers: Record<string, string>; ended: boolean } = { headers: {}, ended: false };
  const res: any = {
    headersSent: false,
    setHeader: (k: string, v: string) => { out.headers[k.toLowerCase()] = v; },
    status: (c: number) => { out.status = c; return res; },
    json: (b: unknown) => { out.body = b; out.ended = true; return res; },
    end: () => { out.ended = true; return res; },
    on: () => res,
  };
  return { res, out };
}
// Vercel parses the body lazily on first access and throws if the JSON is malformed.
const badJsonReq = (method = "POST") => ({ method, get body(): unknown { throw new Error("Invalid JSON"); } }) as any;

describe("handlers on Vercel-style requests", () => {
  it("/api/quote answers malformed JSON with 400, not 500", () => {
    const { res, out } = fakeRes();
    quote(badJsonReq(), res);
    expect(out.status).toBe(400);
    expect((out.body as any).error).toBe("invalid_json");
  });

  it("/api/mcp answers malformed JSON with a 400 JSON-RPC parse error", async () => {
    const { res, out } = fakeRes();
    await mcp(badJsonReq(), res);
    expect(out.status).toBe(400);
    expect((out.body as any).error.code).toBe(-32700);
  });

  it("/api/quote answers a valid body with 200 and CORS", () => {
    const { res, out } = fakeRes();
    quote({ method: "POST", body: { vehicle: { kind: "car", size: "small" } } } as any, res);
    expect(out.status).toBe(200);
    expect(out.headers["access-control-allow-origin"]).toBe("*");
  });

  it("only allows the right methods", () => {
    for (const [handler, method] of [[quote, "GET"], [quote, "PUT"], [services, "POST"]] as const) {
      const { res, out } = fakeRes();
      (handler as any)({ method }, res);
      expect(out.status).toBe(405);
    }
    const { res, out } = fakeRes();
    mcp({ method: "GET" } as any, res);
    expect(out.status).toBe(405);
  });
});
