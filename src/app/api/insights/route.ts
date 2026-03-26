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
  // Try various date formats
  const now = new Date();

  // Just a year like "2028"
  if (/^\d{4}$/.test(expiry)) return new Date(parseInt(expiry), 11, 31);

  // MM/DD/YYYY or MM-DD-YYYY
  const slashMatch = expiry.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slashMatch) {
    let year = parseInt(slashMatch[3]);
    if (year < 100) year += year > 50 ? 1900 : 2000;
    return new Date(year, parseInt(slashMatch[1]) - 1, parseInt(slashMatch[2]));
  }

  // Month name format: "March 15, 2028"
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

  // Counts
  const [spacesRes, unitsRes, itemsRes, docsRes] = await Promise.all([
    admin.from("spaces").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("units").select("id, space_id", { count: "exact" }).in("space_id",
      (await admin.from("spaces").select("id").eq("org_id", orgId)).data?.map((s: { id: string }) => s.id) || []
    ),
    admin.from("items").select("id", { count: "exact", head: true }).in("space_id",
      (await admin.from("spaces").select("id").eq("org_id", orgId)).data?.map((s: { id: string }) => s.id) || []
    ),
    admin.from("documents").select("id", { count: "exact", head: true }).in("item_id",
      (await admin.from("items").select("id").in("space_id",
        (await admin.from("spaces").select("id").eq("org_id", orgId)).data?.map((s: { id: string }) => s.id) || []
      )).data?.map((i: { id: string }) => i.id) || []
    ),
  ]);

  const counts = {
    properties: spacesRes.count || 0,
    units: unitsRes.count || 0,
    assets: itemsRes.count || 0,
    documents: docsRes.count || 0,
  };

  // Get all documents with context for analysis
  const { data: spaces } = await admin.from("spaces").select("id, name").eq("org_id", orgId);
  const spaceIds = (spaces || []).map((s: { id: string }) => s.id);
  const spaceMap = Object.fromEntries((spaces || []).map((s: { id: string; name: string }) => [s.id, s.name]));

  const { data: items } = await admin.from("items").select("id, name, space_id").in("space_id", spaceIds.length > 0 ? spaceIds : ["none"]);
  const itemMap = Object.fromEntries((items || []).map((i: { id: string; name: string; space_id: string }) => [i.id, { name: i.name, spaceId: i.space_id }]));

  const { data: docs } = await admin.from("documents")
    .select("id, name, item_id, extracted_text")
    .in("item_id", (items || []).map((i: { id: string }) => i.id).length > 0 ? (items || []).map((i: { id: string }) => i.id) : ["none"]);

  // Process documents
  const now = new Date();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const expiring: { docId: string; docName: string; spaceName: string; itemName: string; expiryDate: string; daysRemaining: number }[] = [];
  const typeCounts: Record<string, number> = {};
  const spacesWithInsurance = new Set<string>();
  const itemsWithWarranty = new Set<string>();

  for (const doc of docs || []) {
    const details = parseDocDetails(doc.extracted_text);
    if (!details) continue;

    const item = itemMap[doc.item_id];
    if (!item) continue;

    // Type counts
    if (details.type) {
      typeCounts[details.type] = (typeCounts[details.type] || 0) + 1;
    }

    // Track coverage
    if (details.type === "Insurance") spacesWithInsurance.add(item.spaceId);
    if (details.type === "Warranty") itemsWithWarranty.add(doc.item_id);

    // Expiring soon
    if (details.expiry) {
      const expiryDate = parseExpiryToDate(details.expiry);
      if (expiryDate) {
        const diff = expiryDate.getTime() - now.getTime();
        if (diff > 0 && diff < ninetyDaysMs) {
          expiring.push({
            docId: doc.id,
            docName: doc.name,
            spaceName: spaceMap[item.spaceId] || "Unknown",
            itemName: item.name,
            expiryDate: expiryDate.toISOString(),
            daysRemaining: Math.ceil(diff / (24 * 60 * 60 * 1000)),
          });
        }
      }
    }
  }

  // Sort by urgency
  expiring.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Missing coverage
  const missingInsurance = (spaces || [])
    .filter((s: { id: string }) => !spacesWithInsurance.has(s.id))
    .map((s: { name: string }) => s.name);

  const missingWarranty = (items || [])
    .filter((i: { id: string }) => !itemsWithWarranty.has(i.id))
    .slice(0, 10) // Limit to 10
    .map((i: { id: string; name: string; space_id: string }) => ({
      spaceName: spaceMap[i.space_id] || "Unknown",
      itemName: i.name,
    }));

  return NextResponse.json({
    counts,
    expiring: expiring.slice(0, 20),
    typeCounts,
    missingInsurance,
    missingWarranty,
  });
}
