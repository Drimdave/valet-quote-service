import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listServices } from "../src/quote.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed", message: "Use GET." });
  return res.status(200).json(listServices());
}
