import { createSpace, createUnit, createItem, addDocument } from "./storage";

export function loadDemoData() {
  // Create a residential property
  const property1 = createSpace("123 Oak Street", "residential");

  // Kitchen items
  const dishwasher = createItem(property1.id, "Dishwasher", "dishwasher", null);
  addDocument(
    dishwasher.id,
    "Dishwasher Warranty.pdf",
    makePlaceholderDoc("Dishwasher Warranty", "Valid until 2028\nModel: DW-3400\nSerial: A8X92K"),
    "application/pdf"
  );
  addDocument(
    dishwasher.id,
    "Purchase Receipt.pdf",
    makePlaceholderDoc("Purchase Receipt", "Purchased: Jan 15, 2024\nStore: Home Depot\nTotal: $849.99"),
    "application/pdf"
  );

  const fridge = createItem(property1.id, "Refrigerator", "refrigerator", null);
  addDocument(
    fridge.id,
    "Fridge Manual.pdf",
    makePlaceholderDoc("Refrigerator Manual", "Model: RF-2800\nCapacity: 28 cu ft\nFilter: Replace every 6 months"),
    "application/pdf"
  );

  const oven = createItem(property1.id, "Oven / Stove", "oven", null);
  addDocument(
    oven.id,
    "Installation Guide.pdf",
    makePlaceholderDoc("Oven Installation", "Gas line connected: Mar 2024\nTechnician: Mike's Appliances\nNext inspection: Mar 2025"),
    "application/pdf"
  );

  // Laundry
  const washer = createItem(property1.id, "Washing Machine", "washer", null);
  addDocument(
    washer.id,
    "Washer Warranty.pdf",
    makePlaceholderDoc("Washer Warranty", "5-year warranty\nExpires: 2029\nCoverage: Parts & labor"),
    "application/pdf"
  );

  createItem(property1.id, "Dryer", "dryer", null);

  // Climate
  const hvac = createItem(property1.id, "HVAC / AC", "hvac", null);
  addDocument(
    hvac.id,
    "Service Contract.pdf",
    makePlaceholderDoc("HVAC Service Contract", "Provider: CoolAir HVAC\nAnnual service: $199/yr\nNext visit: June 2025"),
    "application/pdf"
  );
  addDocument(
    hvac.id,
    "Filter Replacement Log.pdf",
    makePlaceholderDoc("Filter Log", "Last replaced: Dec 2024\nFilter size: 20x25x1\nBrand: Filtrete 1500"),
    "application/pdf"
  );

  const waterHeater = createItem(property1.id, "Water Heater", "water-heater", null);
  addDocument(
    waterHeater.id,
    "Water Heater Receipt.pdf",
    makePlaceholderDoc("Water Heater Purchase", "50 gallon, gas\nInstalled: Aug 2023\nCost: $1,200 + $350 install"),
    "application/pdf"
  );

  // Home systems
  createItem(property1.id, "Roof", "roof", null);
  createItem(property1.id, "Plumbing", "plumbing", null);
  createItem(property1.id, "Fire System", "fire-system", null);

  // Create a multi-family property
  const property2 = createSpace("Parkview Apartments", "multifamily");

  // Units
  const unit1 = createUnit(property2.id, "Unit 101");
  const unit1Dishwasher = createItem(property2.id, "Dishwasher", "dishwasher", null, unit1.id);
  addDocument(
    unit1Dishwasher.id,
    "Dishwasher Warranty.pdf",
    makePlaceholderDoc("Dishwasher Warranty", "Model: DW-2200\nSerial: BK44721\nExpires: 2027"),
    "application/pdf"
  );
  createItem(property2.id, "HVAC", "hvac", null, unit1.id);
  // Unit-level documents (lease attached to an item in the unit)
  const unit1Lease = createItem(property2.id, "Lease", "lease", null, unit1.id);
  addDocument(
    unit1Lease.id,
    "Lease Agreement.pdf",
    makePlaceholderDoc("Lease Agreement", "Tenant: John Smith\nLease: Jan 2024 - Dec 2024\nRent: $1,850/mo\nDeposit: $3,700"),
    "application/pdf"
  );
  addDocument(
    unit1Lease.id,
    "Move-in Inspection.pdf",
    makePlaceholderDoc("Move-in Inspection", "Date: Jan 5, 2024\nCondition: Good\nNotes: Minor scuff on kitchen wall"),
    "application/pdf"
  );

  const unit2 = createUnit(property2.id, "Unit 102");
  createItem(property2.id, "Refrigerator", "refrigerator", null, unit2.id);
  createItem(property2.id, "Washing Machine", "washer", null, unit2.id);
  const unit2Lease = createItem(property2.id, "Lease", "lease", null, unit2.id);
  addDocument(
    unit2Lease.id,
    "Lease Agreement.pdf",
    makePlaceholderDoc("Lease Agreement", "Tenant: Sarah Johnson\nLease: Mar 2024 - Feb 2025\nRent: $2,100/mo\nDeposit: $4,200"),
    "application/pdf"
  );

  createUnit(property2.id, "Unit 103");
  createUnit(property2.id, "Unit 104");

  // Building-level assets (no unit)
  createItem(property2.id, "Elevator", "elevator", null);
  createItem(property2.id, "Fire System", "fire-system", null);
  createItem(property2.id, "Parking Garage", "parking", null);
  const buildingHvac = createItem(property2.id, "Central HVAC", "hvac", null);
  addDocument(
    buildingHvac.id,
    "HVAC Service Contract.pdf",
    makePlaceholderDoc("HVAC Service Contract", "Provider: CoolAir HVAC\nBuilding-wide system\nAnnual service: $2,400/yr"),
    "application/pdf"
  );

  // Suppress unused variable warnings
  void washer;
}

function makePlaceholderDoc(title: string, body: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/>
    <rect x="40" y="40" width="520" height="60" rx="8" fill="#f3f4f6"/>
    <text x="300" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#1f2937">${title}</text>
    ${body.split("\n").map((line, i) =>
      `<text x="60" y="${150 + i * 36}" font-family="Arial, sans-serif" font-size="16" fill="#4b5563">${line}</text>`
    ).join("")}
    <text x="300" y="760" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">PropertyTracker Demo Document</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
