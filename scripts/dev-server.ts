// Local server that mounts the same handlers Vercel runs, for manual testing: npm run dev
import { createServer } from "node:http";
import quote from "../api/quote.js";
import services from "../api/services.js";
import mcp from "../api/mcp.js";

const routes: Record<string, (req: any, res: any) => unknown> = { "/api/quote": quote, "/api/services": services, "/api/mcp": mcp };

createServer(async (req, res) => {
  const handler = routes[(req.url ?? "").split("?")[0] ?? ""];
  if (!handler) { res.statusCode = 404; res.end("not found"); return; }
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString();
  (req as any).body = raw ? JSON.parse(raw) : undefined;
  (res as any).status = (code: number) => { res.statusCode = code; return res; };
  (res as any).json = (obj: unknown) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); return res; };
  await handler(req, res);
}).listen(3000, () => console.log("http://localhost:3000  (POST /api/quote, GET /api/services, POST /api/mcp)"));
