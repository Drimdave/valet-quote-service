import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getQuote, QuoteError } from "../src/quote.js";

// POST /api/quote  {"vehicle":{"kind":"car","size":"small"},"extras":[{"id":"dog_hair_removal"}]}
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed", message: "Use POST with a JSON body." });
  // On Vercel, req.body is parsed lazily and throws when the JSON is malformed, so read it inside a guard.
  let body: unknown;
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "invalid_json", message: "The request body is not valid JSON." });
  }
  try {
    return res.status(200).json(getQuote(body as never));
  } catch (err) {
    if (err instanceof QuoteError) return res.status(400).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: "internal_error", message: "Something went wrong." });
  }
}
