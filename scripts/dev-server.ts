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
  (req as any).body = raw ? JSON.parse(raw) : undefined;
  (res as any).status = (code: number) => { res.statusCode = code; return res; };
  (res as any).json = (obj: unknown) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); return res; };
  await handler(req, res);
}).listen(3000, () => console.log("http://localhost:3000  (POST /api/quote, GET /api/services, POST /api/mcp)"));
