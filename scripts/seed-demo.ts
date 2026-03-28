import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vmqumqejojpmswiurgia.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtcXVtcWVqb2pwbXN3aXVyZ2lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2NjExOSwiZXhwIjoyMDkwMDQyMTE5fQ.l1fxqqQhXnQDw3SBc-tHrCE1LmjtufxvsAysTSY8grk"
);

const ORG_ID = "ee4f7fdd-e68d-410a-b5b7-cd23097670d6";

function futureDate(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
}

async function uploadBlankPdf(path: string): Promise<string> {
  const pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF";
  await supabase.storage.from("documents").upload(path, Buffer.from(pdf), { contentType: "application/pdf", upsert: true });
  const { data } = supabase.storage.from("documents").getPublicUrl(path);
  return data.publicUrl;
}

async function createItem(spaceId: string, name: string, icon: string, unitId?: string) {
  const insert: Record<string, unknown> = { space_id: spaceId, name, icon };
  if (unitId) insert.unit_id = unitId;
  const { data } = await supabase.from("items").insert(insert).select("id").single();
  return data!.id;
}

async function createDoc(itemId: string, name: string, text: string, details: Record<string, string>) {
  const path = "demo/" + crypto.randomUUID() + ".pdf";
  const fileUrl = await uploadBlankPdf(path);
  await supabase.from("documents").insert({
    item_id: itemId, name, file_url: fileUrl, file_type: "application/pdf",
    extracted_text: text, details, ocr_status: "done",
  });
}

async function seed() {
  console.log("Clearing existing Acme data...");
  const { data: existingSpaces } = await supabase.from("spaces").select("id").eq("org_id", ORG_ID);
  if (existingSpaces && existingSpaces.length > 0) {
    const spaceIds = existingSpaces.map((s: { id: string }) => s.id);
    const { data: existingItems } = await supabase.from("items").select("id").in("space_id", spaceIds);
    if (existingItems && existingItems.length > 0) {
      await supabase.from("documents").delete().in("item_id", existingItems.map((i: { id: string }) => i.id));
      await supabase.from("items").delete().in("space_id", spaceIds);
    }
    await supabase.from("units").delete().in("space_id", spaceIds);
    await supabase.from("spaces").delete().eq("org_id", ORG_ID);
  }
  await supabase.from("inbox_documents").delete().eq("org_id", ORG_ID);

  console.log("Creating properties...");
  const { data: sp1 } = await supabase.from("spaces").insert({ name: "123 Oak Street", icon: "residential", org_id: ORG_ID }).select("id").single();
  const { data: sp2 } = await supabase.from("spaces").insert({ name: "Parkview Apartments", icon: "multifamily", org_id: ORG_ID }).select("id").single();
  const { data: sp3 } = await supabase.from("spaces").insert({ name: "Downtown Office Plaza", icon: "commercial", org_id: ORG_ID }).select("id").single();
  const s1 = sp1!.id, s2 = sp2!.id, s3 = sp3!.id;

  console.log("Creating 123 Oak Street assets...");
  const oak_pd = await createItem(s1, "Property Documents", "property-docs");
  const oak_hvac = await createItem(s1, "HVAC System", "hvac");
  const oak_dish = await createItem(s1, "Dishwasher", "dishwasher");
  const oak_wh = await createItem(s1, "Water Heater", "water-heater");
  const oak_roof = await createItem(s1, "Roof", "roof");
  const oak_wash = await createItem(s1, "Washer/Dryer", "washer");

  console.log("Creating 123 Oak Street documents...");
  await createDoc(oak_pd, "Property Insurance - StateFarm", "Property Insurance Policy\nInsurer: StateFarm\nPolicy #: HO-2024-8891\nProperty: 123 Oak Street\nCoverage: $750,000\nDeductible: $2,500\nAnnual Premium: $4,200\nExpires: December 31, 2025", { type: "Insurance", company: "StateFarm", amount: "$4,200", expiration: futureDate(280) });
  await createDoc(oak_pd, "Property Tax Assessment 2025", "Property Tax Assessment\nCounty of Los Angeles\nParcel #: 4328-015-022\nProperty: 123 Oak Street\nAssessed Value: $1,250,000\nAnnual Tax: $15,625\nDue Date: April 10, 2025", { type: "Invoice", amount: "$15,625", date: "1/15/2025", company: "LA County Assessor" });
  await createDoc(oak_hvac, "HVAC Warranty - Carrier", "Carrier HVAC Limited Warranty\nModel: 24ACC636A003\nSerial: 2921E45832\nInstallation: March 15, 2022\nParts: 10 years\nCompressor: 10 years\nExpires: March 15, 2032", { type: "Warranty", company: "Carrier", product: "HVAC System", expiration: "3/15/2032" });
  await createDoc(oak_hvac, "HVAC Service Contract - CoolAir", "Annual HVAC Service Contract\nProvider: CoolAir Inc.\nProperty: 123 Oak Street\n2 maintenance visits, priority emergency service\nAnnual Cost: $1,800\nExpires: " + futureDate(75), { type: "Contract", company: "CoolAir Inc", amount: "$1,800", expiration: futureDate(75) });
  await createDoc(oak_hvac, "HVAC Inspection - Spring 2025", "HVAC Inspection Report\nInspector: Mike Chen, CoolAir Inc.\nDate: February 28, 2025\nSystem: Carrier 24ACC636A003\nStatus: PASS\nAll components operating within specs.", { type: "Inspection", company: "CoolAir Inc", date: "2/28/2025" });
  await createDoc(oak_dish, "Bosch Dishwasher Warranty", "Bosch Limited Warranty\nModel: SHE3AR75UC\nSerial: FD-9802-14872\nPurchase: November 10, 2023\nWarranty: 2 years parts and labor\nExpires: " + futureDate(15), { type: "Warranty", company: "Bosch", product: "Dishwasher SHE3AR75UC", expiration: futureDate(15) });
  await createDoc(oak_dish, "Home Depot Receipt - Dishwasher", "Home Depot\nStore #6639 - Los Angeles\nDate: November 10, 2023\nBosch 300 Series Dishwasher SHE3AR75UC\nPrice: $849.99\nDelivery: $79.99\nInstallation: $159.00\nTotal: $1,180.51", { type: "Receipt", company: "Home Depot", amount: "$1,180.51", date: "11/10/2023" });
  await createDoc(oak_wh, "Water Heater Warranty - Rheem", "Rheem ProTerra Hybrid Water Heater Warranty\nModel: PROPH65 T2 RH375\nInstallation: January 20, 2024\nTank Warranty: 12 years\nExpires: January 20, 2036", { type: "Warranty", company: "Rheem", product: "Water Heater", expiration: "1/20/2036" });
  await createDoc(oak_roof, "Roof Warranty - GAF", "GAF Golden Pledge Warranty\nTimberline HDZ Shingles\nInstallation: April 5, 2020\nWarranty: 25 years non-prorated\nExpires: April 5, 2045", { type: "Warranty", company: "GAF", product: "Roofing", expiration: "4/5/2045" });
  await createDoc(oak_roof, "Roof Inspection - 2025", "Annual Roof Inspection\nInspector: Tom Rodriguez, Summit Roofing\nDate: March 1, 2025\nCondition: Good\nMinor granule loss on south slope (normal). All flashings intact.", { type: "Inspection", company: "Summit Roofing", date: "3/1/2025" });
  await createDoc(oak_wash, "Samsung Washer Warranty", "Samsung Warranty\nModel: WF45T6000AW\nPurchase: June 15, 2023\nParts: 3 years\nMotor: 10 years\nParts Expires: " + futureDate(45), { type: "Warranty", company: "Samsung", product: "Washer", expiration: futureDate(45) });

  console.log("Creating Parkview Apartments...");
  const park_pd = await createItem(s2, "Property Documents", "property-docs");
  const { data: u101 } = await supabase.from("units").insert({ space_id: s2, name: "Unit 101" }).select("id").single();
  const { data: u102 } = await supabase.from("units").insert({ space_id: s2, name: "Unit 102" }).select("id").single();
  const { data: u201 } = await supabase.from("units").insert({ space_id: s2, name: "Unit 201" }).select("id").single();
  const { data: u202 } = await supabase.from("units").insert({ space_id: s2, name: "Unit 202" }).select("id").single();

  const park_elev = await createItem(s2, "Elevator", "elevator");
  const park_sec = await createItem(s2, "Security System", "security");
  await createItem(s2, "HVAC", "hvac", u101!.id);
  await createItem(s2, "Dishwasher", "dishwasher", u101!.id);
  await createItem(s2, "HVAC", "hvac", u102!.id);
  await createItem(s2, "Refrigerator", "refrigerator", u102!.id);
  await createItem(s2, "HVAC", "hvac", u201!.id);
  await createItem(s2, "Oven", "oven", u201!.id);
  await createItem(s2, "HVAC", "hvac", u202!.id);
  await createItem(s2, "Water Heater", "water-heater", u202!.id);

  await createDoc(park_pd, "Property Insurance - AllState", "Commercial Property Insurance\nInsurer: AllState\nPolicy #: CP-2025-11203\nProperty: Parkview Apartments\nCoverage: $2,500,000\nLiability: $1,000,000\nAnnual Premium: $12,400\nExpires: " + futureDate(200), { type: "Insurance", company: "AllState", amount: "$12,400", expiration: futureDate(200) });
  await createDoc(park_pd, "Lease - Unit 101 - Johnson", "Residential Lease Agreement\nUnit 101, Parkview Apartments\nTenant: Sarah Johnson\nTerm: Jan 1 - Dec 31, 2025\nRent: $2,400/mo\nDeposit: $4,800", { type: "Lease", amount: "$2,400/mo", expiration: "12/31/2025" });
  await createDoc(park_pd, "Lease - Unit 202 - Chen", "Residential Lease Agreement\nUnit 202, Parkview Apartments\nTenant: David Chen\nTerm: Mar 1, 2025 - Feb 28, 2026\nRent: $2,650/mo", { type: "Lease", amount: "$2,650/mo", expiration: "2/28/2026" });
  await createDoc(park_elev, "Elevator Inspection Certificate", "Elevator Inspection Certificate\nCA Dept of Industrial Relations\nElevator ID: EL-2019-0042\nInspection: January 15, 2025\nResult: PASSED\nExpires: " + futureDate(42), { type: "Certificate", date: "1/15/2025", expiration: futureDate(42) });
  await createDoc(park_elev, "Elevator Service Contract - Otis", "Elevator Maintenance Agreement\nProvider: Otis Elevator\nMonthly visits, 24/7 emergency\nAnnual Cost: $8,400\nExpires: December 31, 2025", { type: "Contract", company: "Otis", amount: "$8,400", expiration: "12/31/2025" });
  await createDoc(park_sec, "ADT Security Contract", "ADT Security Monitoring\n24/7 monitoring, 8 cameras, access control\nMonthly: $249\nContract Expires: May 31, 2027", { type: "Contract", company: "ADT", amount: "$249/mo", expiration: "5/31/2027" });

  console.log("Creating Downtown Office Plaza...");
  const off_pd = await createItem(s3, "Property Documents", "property-docs");
  const off_hvac = await createItem(s3, "HVAC System", "hvac");
  const off_fire = await createItem(s3, "Fire Suppression", "fire-system");
  const off_elev = await createItem(s3, "Elevator", "elevator");

  // NO insurance for Downtown Office — shows in Missing Coverage!
  await createDoc(off_pd, "Commercial Lease - TechStartup Inc", "Commercial Lease\nSuite 300, Downtown Office Plaza\nTenant: TechStartup Inc.\n36 months\nRent: $8,500/mo\nCAM: $1,200/mo\nExpires: March 31, 2027", { type: "Lease", company: "TechStartup Inc", amount: "$8,500/mo", expiration: "3/31/2027" });
  await createDoc(off_hvac, "HVAC Maintenance - Johnson Controls", "Preventive Maintenance Agreement\nProvider: Johnson Controls\n3x Trane RTU-400 units\nFull service with parts\nAnnual: $12,000\nExpires: " + futureDate(60), { type: "Contract", company: "Johnson Controls", amount: "$12,000", expiration: futureDate(60) });
  await createDoc(off_fire, "Fire Suppression Inspection", "Fire Suppression Inspection\nInspector: Pacific Fire Protection\nDate: February 1, 2025\nResult: PASSED\nNext Due: February 2026", { type: "Inspection", company: "Pacific Fire Protection", date: "2/1/2025" });
  await createDoc(off_fire, "Fire Alarm Monitoring", "Fire Alarm Monitoring\nProvider: Simplex Grinnell\n24/7 central station\nMonthly: $189\nExpires: " + futureDate(12), { type: "Contract", company: "Simplex Grinnell", amount: "$189/mo", expiration: futureDate(12) });
  await createDoc(off_elev, "Elevator Certificate", "Certificate of Operation\nCA Dept of Industrial Relations\n2 passenger elevators\nInspection: March 10, 2025\nExpires: " + futureDate(85), { type: "Certificate", date: "3/10/2025", expiration: futureDate(85) });

  console.log("\n✅ Demo data seeded!");
  console.log("3 properties, ~30 documents");
  console.log("Expiring: 15d (dishwasher), 42d (elevator cert), 45d (washer), 60d (HVAC contract), 75d (CoolAir), 85d (elevator cert)");
  console.log("Missing insurance: Downtown Office Plaza");
  console.log("Doc types: Warranty, Insurance, Receipt, Contract, Lease, Inspection, Certificate, Invoice");
}

seed().catch(console.error);
