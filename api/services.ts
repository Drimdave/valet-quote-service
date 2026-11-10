import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listServices } from "../src/quote.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json(listServices());
}
