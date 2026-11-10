import { describe, expect, it } from "vitest";
import { formatPence, getQuote, listServices, QuoteError } from "../src/quote.js";

describe("standard valet base prices (from the published list)", () => {
  it.each([
    ["small", 5000],
    ["medium", 6000],
    ["large", 8000],
    ["extra_large", 10000],
  ] as const)("car, %s = %i pence", (size, pence) => {
    const q = getQuote({ vehicle: { kind: "car", size } });
    expect(q.estimateFromPence).toBe(pence);
    expect(q.lineItems).toHaveLength(1);
  });

  it.each([
    ["small", 6000],
    ["medium", 8000],
    ["large", 10000],
    ["extra_large", 12000],
  ] as const)("van, %s = %i pence", (size, pence) => {
    expect(getQuote({ vehicle: { kind: "van", size } }).estimateFromPence).toBe(pence);
  });

  it("4x4 starts from 120 pounds and ignores size", () => {
    expect(getQuote({ vehicle: { kind: "4x4" } }).estimateFromPence).toBe(12000);
    expect(getQuote({ vehicle: { kind: "4x4", size: "small" } }).estimateFromPence).toBe(12000);
  });
});

describe("extras", () => {
  it("adds extras to the base price without floating-point drift (39.95 is 3995 pence)", () => {
    const q = getQuote({ vehicle: { kind: "car", size: "medium" }, extras: [{ id: "exterior_maintenance" }, { id: "dog_hair_removal" }] });
    expect(q.estimateFromPence).toBe(6000 + 3995 + 4000);
    expect(q.estimateFromFormatted).toBe("from £139.95");
  });

  it("prices headlight restoration per light", () => {
    const q = getQuote({ vehicle: { kind: "car", size: "small" }, extras: [{ id: "headlight_restoration", quantity: 2 }] });
    expect(q.lineItems[1]?.totalFromPence).toBe(8000);
    expect(q.estimateFromPence).toBe(13000);
  });

  it("marks flat-price extras as not 'from'", () => {
    const q = getQuote({ vehicle: { kind: "car", size: "small" }, extras: [{ id: "tar_removal" }, { id: "hand_wax" }] });
    expect(q.lineItems.find((l) => l.id === "tar_removal")?.isFrom).toBe(false);
    expect(q.lineItems.find((l) => l.id === "hand_wax")?.isFrom).toBe(true);
  });

  it("always carries the guideline notes so the agent can repeat them", () => {
    const q = getQuote({ vehicle: { kind: "car", size: "small" } });
    expect(q.notes.join(" ")).toMatch(/guidelines/);
    expect(q.notes.join(" ")).toMatch(/owner confirms the final price/);
    expect(q.source).toContain("jbmobilevaletingcambridge");
  });
});

describe("validation", () => {
  const code = (fn: () => unknown) => {
    try { fn(); } catch (e) { return e instanceof QuoteError ? e.code : "other"; }
    return "none";
  };
  it("needs a size for cars and vans", () => {
    expect(code(() => getQuote({ vehicle: { kind: "car" } }))).toBe("size_required");
    expect(code(() => getQuote({ vehicle: { kind: "van" } }))).toBe("size_required");
  });
  it("rejects an unknown vehicle kind", () => {
    expect(code(() => getQuote({ vehicle: { kind: "bike" as never } }))).toBe("invalid_vehicle");
    expect(code(() => getQuote(undefined as never))).toBe("invalid_vehicle");
  });
  it("rejects unknown and duplicate extras", () => {
    expect(code(() => getQuote({ vehicle: { kind: "4x4" }, extras: [{ id: "gold_plating" }] }))).toBe("unknown_extra");
    expect(code(() => getQuote({ vehicle: { kind: "4x4" }, extras: [{ id: "tar_removal" }, { id: "tar_removal" }] }))).toBe("duplicate_extra");
  });
  it("rejects bad quantities", () => {
    expect(code(() => getQuote({ vehicle: { kind: "4x4" }, extras: [{ id: "headlight_restoration", quantity: 0 }] }))).toBe("invalid_quantity");
    expect(code(() => getQuote({ vehicle: { kind: "4x4" }, extras: [{ id: "headlight_restoration", quantity: 5 }] }))).toBe("invalid_quantity");
    expect(code(() => getQuote({ vehicle: { kind: "4x4" }, extras: [{ id: "engine_detail", quantity: 2 }] }))).toBe("invalid_quantity");
    expect(code(() => getQuote({ vehicle: { kind: "4x4" }, extras: [{ id: "headlight_restoration", quantity: 1.5 }] }))).toBe("invalid_quantity");
  });
});

describe("formatting and listing", () => {
  it("formats pence as pounds", () => {
    expect(formatPence(5000)).toBe("£50");
    expect(formatPence(3995)).toBe("£39.95");
    expect(formatPence(5)).toBe("£0.05");
  });
  it("lists every extra with a stable id", () => {
    const s = listServices();
    expect(s.extras.map((e) => e.id)).toContain("ceramic_coating");
    expect(new Set(s.extras.map((e) => e.id)).size).toBe(s.extras.length);
  });
});
