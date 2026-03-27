import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseDocDetails } from "@/lib/docdetails";

export const runtime = "nodejs";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCallerProfile(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) return null;
  const admin = getAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await admin.from("profiles").select("id, role, org_id").eq("id", user.id).single();
  return profile;
}

function parseExpiryToDate(expiry: string): Date | null {
  if (/^\d{4}$/.test(expiry)) return new Date(parseInt(expiry), 11, 31);
  const slashMatch = expiry.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slashMatch) {
    let year = parseInt(slashMatch[3]);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    return new Date(year, parseInt(slashMatch[1]) - 1, parseInt(slashMatch[2]));
  }
  const monthMatch = expiry.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s*(\d{2,4})/i);
  if (monthMatch) {
    const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    let year = parseInt(monthMatch[3]);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    return new Date(year, months[monthMatch[1].toLowerCase().slice(0, 3)], parseInt(monthMatch[2]));
  }
  return null;
}

export async function GET(req: NextRequest) {
  const caller = await getCallerProfile(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("org_id");
  if (!orgId) return NextResponse.json({ error: "org_id required" }, { status: 400 });

  const isAdmin = caller.role === "org_admin" || caller.role === "super_admin";
  const isManager = caller.role === "manager";
  if (!isAdmin && !isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isAdmin && caller.org_id !== orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = getAdminClient();

  // Single query cascade — spaces first, then parallel items + units, then docs
  const { data: spaces } = await admin.from("spaces").select("id, name").eq("org_id", orgId);
  const spaceIds = (spaces || []).map((s: { id: string }) => s.id);

  if (spaceIds.length === 0) {
    return NextResponse.json({
      counts: { properties: 0, units: 0, assets: 0, documents: 0 },
      expiring: [], typeCounts: {}, missingInsurance: [],
    });
  }

  // Parallel: units, items
  const [unitsRes, itemsRes] = await Promise.all([
    admin.from("units").select("id", { count: "exact", head: true }).in("space_id", spaceIds),
    admin.from("items").select("id, name, space_id").in("space_id", spaceIds),
  ]);

  const items = itemsRes.data || [];
  const itemIds = items.map((i: { id: string }) => i.id);
  const itemMap = Object.fromEntries(items.map((i: { id: string; name: string; space_id: string }) => [i.id, { name: i.name, spaceId: i.space_id }]));
  const spaceMap = Object.fromEntries((spaces || []).map((s: { id: string; name: string }) => [s.id, s.name]));

  // Documents — single query with all we need
  const { data: docs, count: docCount } = itemIds.length > 0
    ? await admin.from("documents").select("id, name, item_id, extracted_text, details", { count: "exact" }).in("item_id", itemIds)
    : { data: [], count: 0 };

  const counts = {
    properties: spaceIds.length,
    units: unitsRes.count || 0,
    assets: items.length,
    documents: docCount || 0,
  };

  // Process documents for insights
  const now = new Date();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const expiring: { docId: string; docName: string; spaceId: string; spaceName: string; itemId: string; itemName: string; expiryDate: string; daysRemaining: number }[] = [];
  const typeCounts: Record<string, number> = {};
  const spacesWithInsurance = new Set<string>();

  // Track latest expiry per asset+type to avoid duplicates from replaced docs
  const latestExpiry: Record<string, { docId: string; docName: string; spaceId: string; spaceName: string; itemId: string; itemName: string; expiryDate: Date; daysRemaining: number }> = {};

  for (const doc of docs || []) {
    const storedDetails = doc.details as Record<string, string> | null;
    const parsedDetails = parseDocDetails(doc.extracted_text);
    const docType = storedDetails?.type || parsedDetails?.type;
    const expiry = storedDetails?.expiration || storedDetails?.expiry || parsedDetails?.expiry;

    const item = itemMap[doc.item_id];
    if (!item) continue;
    if (!docType && !expiry) continue;

    if (docType) typeCounts[docType] = (typeCounts[docType] || 0) + 1;
    if (docType?.toLowerCase() === "insurance") spacesWithInsurance.add(item.spaceId);

    if (expiry) {
      const expiryDate = parseExpiryToDate(expiry);
      if (expiryDate && expiryDate.getTime() > now.getTime()) {
        const key = `${doc.item_id}-${(docType || "unknown").toLowerCase()}`;
        const existing = latestExpiry[key];
        // Keep only the latest expiry per asset+type
        if (!existing || expiryDate.getTime() > existing.expiryDate.getTime()) {
          const diff = expiryDate.getTime() - now.getTime();
          latestExpiry[key] = {
            docId: doc.id, docName: doc.name,
            spaceId: item.spaceId, spaceName: spaceMap[item.spaceId] || "Unknown",
            itemId: doc.item_id, itemName: item.name,
            expiryDate, daysRemaining: Math.ceil(diff / (24 * 60 * 60 * 1000)),
          };
        }
      }
    }
  }

  // Filter to 90 days
  for (const entry of Object.values(latestExpiry)) {
    if (entry.daysRemaining <= 90) {
      expiring.push({
        docId: entry.docId, docName: entry.docName,
        spaceId: entry.spaceId, spaceName: entry.spaceName,
        itemId: entry.itemId, itemName: entry.itemName,
        expiryDate: entry.expiryDate.toISOString(),
        daysRemaining: entry.daysRemaining,
      });
    }
  }

  expiring.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const missingInsurance = (spaces || [])
    .filter((s: { id: string }) => !spacesWithInsurance.has(s.id))
    .map((s: { id: string; name: string }) => ({ spaceId: s.id, name: s.name }));

  return NextResponse.json({
    counts,
    expiring: expiring.slice(0, 20),
    typeCounts,
    missingInsurance,
  });
}
