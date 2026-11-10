import {
  CAR_EXAMPLES,
  CAR_FROM_PENCE,
  EXTRAS,
  FOUR_BY_FOUR_FROM_PENCE,
  NOTES,
  PRICE_LIST_DATE,
  PRICE_LIST_SOURCE,
  VAN_FROM_PENCE,
  type VehicleKind,
  type VehicleSize,
} from "./priceList.js";

export type QuoteInput = {
  vehicle: { kind: VehicleKind; size?: VehicleSize };
  extras?: { id: string; quantity?: number }[];
};

export type LineItem = {
  id: string;
  label: string;
  unitFromPence: number;
  quantity: number;
  totalFromPence: number;
  isFrom: boolean;
};

export type Quote = {
  currency: "GBP";
  priceListDate: string;
  source: string;
  lineItems: LineItem[];
  estimateFromPence: number;
  estimateFromFormatted: string;
  notes: string[];
};

export class QuoteError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "QuoteError";
  }
}

export function formatPence(pence: number): string {
  const pounds = Math.floor(pence / 100);
  const rest = pence % 100;
  return rest === 0 ? `£${pounds}` : `£${pounds}.${String(rest).padStart(2, "0")}`;
}

const SIZES: VehicleSize[] = ["small", "medium", "large", "extra_large"];
const MAX_QUANTITY = 4;

function baseLine(vehicle: QuoteInput["vehicle"]): LineItem {
  if (vehicle.kind === "4x4") {
    return { id: "standard_valet_4x4", label: "Standard valet, interior and exterior, 4x4", unitFromPence: FOUR_BY_FOUR_FROM_PENCE, quantity: 1, totalFromPence: FOUR_BY_FOUR_FROM_PENCE, isFrom: true };
  }
  if (!vehicle.size || !SIZES.includes(vehicle.size)) {
    throw new QuoteError(`A ${vehicle.kind} needs a size: one of ${SIZES.join(", ")}.`, "size_required");
  }
  if (vehicle.kind === "van") {
    const p = VAN_FROM_PENCE[vehicle.size];
    return { id: `standard_valet_van_${vehicle.size}`, label: `Standard valet, cabin and exterior, ${vehicle.size.replace("_", " ")} van`, unitFromPence: p, quantity: 1, totalFromPence: p, isFrom: true };
  }
  const p = CAR_FROM_PENCE[vehicle.size];
  return { id: `standard_valet_car_${vehicle.size}`, label: `Standard valet, interior and exterior, ${vehicle.size.replace("_", " ")} car (for example ${CAR_EXAMPLES[vehicle.size]})`, unitFromPence: p, quantity: 1, totalFromPence: p, isFrom: true };
}

export function getQuote(input: QuoteInput): Quote {
  if (!input || !input.vehicle || !["car", "van", "4x4"].includes(input.vehicle.kind)) {
    throw new QuoteError("vehicle.kind must be one of: car, van, 4x4.", "invalid_vehicle");
  }
  const lines: LineItem[] = [baseLine(input.vehicle)];
  const seen = new Set<string>();
  for (const e of input.extras ?? []) {
    const extra = EXTRAS.find((x) => x.id === e.id);
    if (!extra) {
      throw new QuoteError(`Unknown extra "${e.id}". Known extras: ${EXTRAS.map((x) => x.id).join(", ")}.`, "unknown_extra");
    }
    if (seen.has(extra.id)) throw new QuoteError(`Extra "${extra.id}" was listed twice.`, "duplicate_extra");
    seen.add(extra.id);
    const quantity = e.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY || (!extra.perUnit && quantity !== 1)) {
      throw new QuoteError(
        extra.perUnit ? `Quantity for "${extra.id}" must be a whole number from 1 to ${MAX_QUANTITY}.` : `"${extra.id}" is a single service; quantity must be 1.`,
        "invalid_quantity",
      );
    }
    lines.push({ id: extra.id, label: extra.label, unitFromPence: extra.pence, quantity, totalFromPence: extra.pence * quantity, isFrom: extra.isFrom });
  }
  const estimateFromPence = lines.reduce((sum, l) => sum + l.totalFromPence, 0);
  return {
    currency: "GBP",
    priceListDate: PRICE_LIST_DATE,
    source: PRICE_LIST_SOURCE,
    lineItems: lines,
    estimateFromPence,
    estimateFromFormatted: `from ${formatPence(estimateFromPence)}`,
    notes: NOTES,
  };
}

export function listServices() {
  return {
    currency: "GBP",
    priceListDate: PRICE_LIST_DATE,
    source: PRICE_LIST_SOURCE,
    standardValet: {
      cars: Object.fromEntries(SIZES.map((s) => [s, { fromPence: CAR_FROM_PENCE[s], examples: CAR_EXAMPLES[s] }])),
      vans: Object.fromEntries(SIZES.map((s) => [s, { fromPence: VAN_FROM_PENCE[s] }])),
      fourByFourFromPence: FOUR_BY_FOUR_FROM_PENCE,
    },
    extras: EXTRAS.map(({ id, label, pence, isFrom, perUnit, group, needs }) => ({ id, label, pence, isFrom, perUnit: !!perUnit, group, needs: needs ?? null })),
    notes: NOTES,
  };
}
