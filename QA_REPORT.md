# QA report: valet-quote-service (10 Nov 2026)

Scope: the REST and MCP endpoints and the demo page, first run locally (Node 22, Chromium), then against the live deployment at https://valet-quote-service.vercel.app.

## Method
1. Verified every coded price against the live source page.
2. Black-box abuse of the REST endpoint (20+ malformed inputs, wrong methods, wrong content type, 2 MB body, 200 parallel requests).
3. MCP protocol checks (initialize, wrong method, bad JSON, missing Accept header, unknown method and tool, bad arguments, 100 parallel calls).
4. Exploratory testing of the page: desktop, 375 px phone, keyboard only, light and dark, bad quantities.
5. axe-core (WCAG 2.0/2.1 A and AA plus best-practice) in light and dark, and contrast ratios calculated by hand for both themes.

## Bugs found and fixed
| # | Severity | Found by | Bug | Fix |
|---|---|---|---|---|
| 1 | High (local server) | Abuse test | Malformed JSON killed the dev server process (exit code 1); every later request failed. | 400 `invalid_json`; handler wrapped so an exception returns 500 instead of crashing. Vercel rejects bad JSON before the handler, so production was never affected, but that path is untested until deployed. |
| 2 | Medium | Exploratory | "Get quote (REST)" on the page threw "Response body is already used" (the body was read twice). The MCP button worked, which hid it. | Parse once. |
| 3 | Medium | Mobile test | On a phone the result rendered 1,568 px below the button on an 812 px screen, so pressing the button looked like nothing happened. | Result scrolls into view (respects reduced motion). |
| 4 | Low | Abuse test | A wrong size ("huge", "SMALL") said the vehicle "needs a size". | New `invalid_size` error, separate from `size_required`. |
| 5 | Low | Abuse test | `extras` sent as a string, or as a list of strings, gave 'Unknown extra "undefined"'. | New `invalid_extras` error with an example of the right shape. |
| 6 | Low | Abuse test | `/api/services` answered POST with 200. | 405 for anything but GET. |
| 7 | Low | axe/tree read | Checkboxes had no accessible name (read as "on"). | `aria-label` from the service name. |
| 8 | Low | Dark-mode screenshot | Source link used the default browser blue, hard to read on dark. | Link colour from the theme. |
| 9 | Hardening | Abuse test | No cap on the number of extras. | `too_many_extras` above the number of real services. |

| 10 | Medium | Live deployment | On Vercel, malformed JSON returned **500** on `/api/quote` and `/api/mcp`. Vercel parses `req.body` lazily and throws inside the handler, so my 'Vercel rejects it first' assumption (bug 1) was wrong. | The body is read inside a guard: 400 `invalid_json` on REST and a JSON-RPC -32700 parse error on MCP. Two handler tests simulate Vercel's throwing getter and fail without the fix. |

Each fix in the service code has a regression test (31 tests now).

## Live deployment checks (after publishing)
Same abuse and protocol tests as above, run against the live URL: every response matches the local run except bug 10. CORS header present, wrong methods return 405, MCP `initialize`, `tools/list` and `tools/call` work over the public internet, 60 parallel REST and 30 parallel MCP requests returned correct totals.

Latency: about 0.6 s per request from the test machine (Lagos). Roughly 1 in 20 requests took about 30 s, but in every slow case the TCP connect took 30 s (DNS 4 ms, first byte 0.35 s after connecting), on one of Vercel's IP addresses from this network. The service's own time was normal, so I read it as a network-path problem on the test machine, not a cold start or slow code. I did not confirm that from a second network.

## Checked and fine
- All 25 prices, the flat-versus-"from" labels and the per-light headlight price match the live page.
- 200 parallel REST requests and 100 parallel MCP calls: all correct totals, no errors, server stayed up.
- MCP: unknown method returns -32601; unknown tool and bad arguments return structured errors; GET returns 405; a missing Accept header returns 406; bad JSON returns 400.
- Prototype names (`__proto__`, `constructor`) are rejected as unknown extras.
- Phone width: single column, no horizontal scroll. Keyboard: sensible tab order, visible focus ring, Space ticks a box, Enter runs a quote.
- axe-core: 0 violations in light and dark. Every text and background pair I use is at least 5.5:1.

## Decisions, not bugs
- `quantity: null` is treated as 1. A string quantity ("2") is rejected.
- The dev server accepts a 2 MB body; Vercel's own limit (4.5 MB) applies in production.

## Not tested
- A second network path to the deployment (to confirm the 30 s connect stalls are local to the test machine).
- A connection from a real MCP client (Agentplace) to this endpoint.
- Firefox, Safari, real phones, a screen reader (only the accessibility tree and axe).
- Load beyond what one laptop can send; any security testing beyond input abuse.
- The agent's conversations. The agent is not built yet.
- Price drift: the list is a snapshot of 10 Nov 2026 and will go stale.
