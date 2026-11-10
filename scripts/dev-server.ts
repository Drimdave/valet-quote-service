// Local server that mounts the same handlers Vercel runs, for manual testing: npm run dev
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import quote from "../api/quote.js";
import services from "../api/services.js";
import mcp from "../api/mcp.js";

const routes: Record<string, (req: any, res: any) => unknown> = { "/api/quote": quote, "/api/services": services, "/api/mcp": mcp };

createServer(async (req, res) => {
  const path = (req.url ?? "").split("?")[0] ?? "";
  if (path === "/" || path === "/index.html") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(await readFile(new URL("../public/index.html", import.meta.url)));
    return;
  }
  const handler = routes[path];
  if (!handler) { res.statusCode = 404; res.end("not found"); return; }
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString();
  (res as any).status = (code: number) => { res.statusCode = code; return res; };
  (res as any).json = (obj: unknown) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); return res; };
  try {
    (req as any).body = raw ? JSON.parse(raw) : undefined;
  } catch {
    // Vercel answers malformed JSON with a 400 before the handler runs; do the same here instead of crashing.
    (res as any).status(400).json({ error: "invalid_json", message: "The request body is not valid JSON." });
    return;
  }
  try {
    await handler(req, res);
  } catch {
    if (!res.headersSent) (res as any).status(500).json({ error: "internal_error", message: "Something went wrong." });
  }
}).listen(3000, () => console.log("http://localhost:3000  (POST /api/quote, GET /api/services, POST /api/mcp)"));
