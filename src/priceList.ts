// Price list copied by hand from the business's public "Price's" page on 2026-11-10.
// Source: https://sites.google.com/view/jbmobilevaletingcambridge/prices
// All amounts are in pence (integers) so totals never pick up floating-point error.
// The page says all prices are guidelines, "starting from" and subject to the condition of the vehicle.

export const PRICE_LIST_SOURCE = "https://sites.google.com/view/jbmobilevaletingcambridge/prices";
export const PRICE_LIST_DATE = "2026-11-10";

export type VehicleKind = "car" | "van" | "4x4";
export type VehicleSize = "small" | "medium" | "large" | "extra_large";

export const CAR_FROM_PENCE: Record<VehicleSize, number> = {
  small: 5000,
  medium: 6000,
  large: 8000,
  extra_large: 10000,
};

export const CAR_EXAMPLES: Record<VehicleSize, string> = {
  small: "Audi A1 3-door, Volkswagen Polo",
  medium: "Volkswagen Golf, Audi A3, BMW 1 Series, Audi TT",
  large: "Mercedes C/E/S class, Range Rover Evoque",
  extra_large: "Range Rover Sport, Audi Q4/Q5/Q7, Porsche Macan",
};

// "Van's - cabin & exterior starting from; Small £60 / Medium £80 / Large £100 / Extra large £120."
export const VAN_FROM_PENCE: Record<VehicleSize, number> = {
  small: 6000,
  medium: 8000,
  large: 10000,
  extra_large: 12000,
};

// "4x4's starting from £120."
export const FOUR_BY_FOUR_FROM_PENCE = 12000;

export type Extra = {
  id: string;
  label: string;
  pence: number;
  /** true when the page says "from"; false when it gives a flat price. */
  isFrom: boolean;
  /** true when priced per unit (headlight restoration is "per light"). */
  perUnit?: boolean;
  group: "exterior" | "interior" | "protection";
  /** The page says last-stage protection needs a full valet first. */
  needs?: string;
};

export const EXTRAS: Extra[] = [
  { id: "exterior_maintenance", label: "Exterior maintenance valet (1 to 5 week options available)", pence: 3995, isFrom: true, group: "exterior" },
  { id: "machine_polish", label: "Machine polishing and full paint decontamination", pence: 10000, isFrom: true, group: "exterior" },
  { id: "sign_writing_removal", label: "Sign writing removal", pence: 10000, isFrom: true, group: "exterior" },
  { id: "soft_top_clean", label: "Soft top deep clean and protect", pence: 8000, isFrom: true, group: "exterior" },
  { id: "brake_dust_iron_removal", label: "Heavy brake dust and iron fallout removal", pence: 2000, isFrom: true, group: "exterior" },
  { id: "headlight_restoration", label: "Headlight restoration plus ceramic coating protection (per light)", pence: 4000, isFrom: true, perUnit: true, group: "exterior" },
  { id: "engine_detail", label: "Engine detail", pence: 4000, isFrom: true, group: "exterior" },
  { id: "tar_removal", label: "Tar removal", pence: 1000, isFrom: false, group: "exterior" },
  { id: "dog_hair_removal", label: "Dog hair removal", pence: 4000, isFrom: true, group: "interior" },
  { id: "odour_aircon_refresh", label: "Odour eliminator and air-con refresh aerosol", pence: 1000, isFrom: false, group: "interior" },
  { id: "carpet_shampoo_extraction", label: "Shampoo and extraction of carpet and mats", pence: 4000, isFrom: false, group: "interior" },
  { id: "leather_clean_care", label: "Leather clean and care balm", pence: 4000, isFrom: true, group: "interior" },
  { id: "steam_clean_surfaces", label: "Steam clean of all surfaces", pence: 4000, isFrom: true, group: "interior" },
  { id: "hydrophobic_sealant", label: "Hydrophobic spray sealant (up to 12 weeks protection)", pence: 1000, isFrom: true, group: "protection", needs: "full valet" },
  { id: "hand_wax", label: "Hand wax application (up to 6 months protection)", pence: 2000, isFrom: true, group: "protection", needs: "full valet" },
  { id: "ceramic_coating", label: "Ceramic coating (1 and 2 years plus protection)", pence: 8000, isFrom: true, group: "protection", needs: "full valet" },
];

export const NOTES = [
  "All prices are guidelines, shown as the starting price, and depend on the condition of the vehicle.",
  "Additional services need the standard valet first; last-stage protection needs a full valet first.",
  "Bookings are by appointment only. The business needs an onboard water tank and a plug socket at the location.",
  "This is an estimate only. The business owner confirms the final price when you book.",
];
