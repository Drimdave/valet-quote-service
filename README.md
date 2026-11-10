# valet-quote-service

A small price-quote service for an **unofficial demo agent** built on Agentplace as part of a job application (Full-Stack Engineer test task). It is not affiliated with, or endorsed by, the business whose public price list it uses (JB Mobile Valeting, Cambridge). Nothing here sends data to that business.

## Live

Demo page and API: https://valet-quote-service.vercel.app (MCP endpoint: `/api/mcp`, no key needed).

## What it does

The agent talks to the customer; this service does the arithmetic. Prices never come from the language model.

- `POST /api/quote` takes a vehicle (car, van or 4x4, with a size for cars and vans) and optional extras, and returns line items and a "from" estimate.
- `GET /api/services` returns the whole price list.
- `POST /api/mcp` exposes the same two functions as MCP tools (`get_price_quote`, `list_services`) over stateless Streamable HTTP, which is how Agentplace calls it.

Prices are copied by hand from the business's public price page on 2026-11-10 (source and date are in every response). That page says all prices are guidelines, "starting from", and depend on the condition of the vehicle, so the service only ever returns "from" estimates and repeats that note. The owner confirms the final price.

## How the pieces fit

```
customer -> Agentplace agent (conversation, UI) -> MCP tool call -> /api/mcp -> getQuote() -> price list
```

- `src/priceList.ts`: the price list as data, in integer pence so totals have no floating-point error (39.95 is 3995).
- `src/quote.ts`: one pure function, `getQuote()`, plus a typed `QuoteError` with stable error codes. The REST handler and the MCP tool both call it.
- `src/mcpServer.ts`: MCP tool definitions with zod schemas (extras are an enum, so the model cannot invent a service).
- `api/*.ts`: thin Vercel handlers.

## Tested

A full QA pass and its findings are in [QA_REPORT.md](QA_REPORT.md): nine bugs found and fixed, and a list of what was not tested.

`npm test` runs 31 tests: every base price, extras, per-light pricing, flat-price vs "from" flags, error codes for each bad input, the guideline notes being present, and the MCP tools through an in-memory client (listing, a successful call, a structured error, schema rejection of an unknown extra). `npm run typecheck` is clean. CI runs both on every push. I also called the REST and MCP endpoints over real HTTP, locally and on the live deployment.

## Not tested, and what I would change for production

- **Availability.** There is no booking calendar in this service. The business books by appointment only and I have no access to its diary, so the agent can collect a customer's preferences but cannot confirm a slot. Real availability would need the owner's calendar (Google Calendar or Calendly) behind a tool like this one.
- **Prices go stale.** They are a snapshot. A real deployment would read from a source the owner edits (a sheet or a small admin page) and show the date.
- **Auth and rate limits.** The endpoints are public and unauthenticated because they only return public prices. A production service holding private data would need both.
- **Agentplace limits.** What the platform could and could not do is in the note I emailed with the application.
