import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseDocDetails } from "@/lib/docdetails";
import { sendExpirationAlert, sendWeeklyDigest } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

const THRESHOLDS = [7, 30, 60, 90];

export async function GET(req: NextRequest) {
  // Verify this is from Vercel Cron or manual trigger with secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const now = new Date();
  const isMonday = now.getUTCDay() === 1;

  // Get all orgs (skip admin org)
  const { data: orgs } = await admin.from("organizations").select("id, name, slug").neq("slug", "admin");
  if (!orgs || orgs.length === 0) return NextResponse.json({ success: true, message: "No orgs" });

  let alertsSent = 0;
  let digestsSent = 0;

  for (const org of orgs) {
    // Get org admin(s)
    const { data: admins } = await admin.from("profiles")
      .select("id, email, name")
      .eq("org_id", org.id)
      .eq("role", "org_admin")
      .eq("status", "active");

    if (!admins || admins.length === 0) continue;

    // Get all spaces and items for this org
    const { data: spaces } = await admin.from("spaces").select("id, name").eq("org_id", org.id);
    const spaceIds = (spaces || []).map((s: { id: string }) => s.id);
    if (spaceIds.length === 0) continue;

    const { data: items } = await admin.from("items").select("id, name, space_id").in("space_id", spaceIds);
    const itemIds = (items || []).map((i: { id: string }) => i.id);
    if (itemIds.length === 0) continue;

    const itemMap = Object.fromEntries((items || []).map((i: { id: string; name: string; space_id: string }) => [i.id, { name: i.name, spaceId: i.space_id }]));
    const spaceMap = Object.fromEntries((spaces || []).map((s: { id: string; name: string }) => [s.id, s.name]));

    // Get all docs with text
    const { data: docs } = await admin.from("documents")
      .select("id, name, item_id, extracted_text, details")
      .in("item_id", itemIds)
      .not("extracted_text", "is", null);

    // --- Expiration Alerts ---
    const expiringDocs: { docId: string; docName: string; spaceName: string; itemName: string; expiryDate: string; daysRemaining: number; threshold: number }[] = [];

    // Track latest expiry per asset+type — only alert on the newest doc
    const latestByAssetType: Record<string, { docId: string; docName: string; spaceName: string; itemName: string; expiryDate: Date; daysRemaining: number; docType: string }> = {};

    for (const doc of docs || []) {
      const storedDetails = doc.details as Record<string, string> | null;
      const parsedDetails = parseDocDetails(doc.extracted_text);
      const docType = storedDetails?.type || parsedDetails?.type || "unknown";
      const expiry = storedDetails?.expiration || storedDetails?.expiry || parsedDetails?.expiry;
      if (!expiry) continue;
      const expiryDate = parseExpiryToDate(expiry);
      if (!expiryDate) continue;

      const diff = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diff / (24 * 60 * 60 * 1000));
      if (daysRemaining <= 0) continue;

      const item = itemMap[doc.item_id];
      if (!item) continue;

      const key = `${doc.item_id}-${docType.toLowerCase()}`;
      const existing = latestByAssetType[key];
      if (!existing || expiryDate.getTime() > existing.expiryDate.getTime()) {
        latestByAssetType[key] = {
          docId: doc.id, docName: doc.name,
          spaceName: spaceMap[item.spaceId] || "Unknown", itemName: item.name,
          expiryDate, daysRemaining, docType,
        };
      }
    }

    // Apply thresholds to the latest expiry per asset+type
    for (const entry of Object.values(latestByAssetType)) {
      for (const threshold of THRESHOLDS) {
        if (entry.daysRemaining <= threshold) {
          expiringDocs.push({
            docId: entry.docId,
            docName: entry.docName,
            spaceName: entry.spaceName,
            itemName: entry.itemName,
            expiryDate: entry.expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            daysRemaining: entry.daysRemaining,
            threshold,
          });
          break;
        }
      }
    }

    // Filter out already-sent alerts
    if (expiringDocs.length > 0) {
      const { data: alreadySent } = await admin.from("expiry_alerts_sent")
        .select("document_id, threshold_days")
        .in("document_id", expiringDocs.map((d) => d.docId));

      const sentSet = new Set((alreadySent || []).map((a: { document_id: string; threshold_days: number }) => `${a.document_id}-${a.threshold_days}`));
      const newAlerts = expiringDocs.filter((d) => !sentSet.has(`${d.docId}-${d.threshold}`));

      if (newAlerts.length > 0) {
        // Send to each admin
        for (const adminUser of admins) {
          await sendExpirationAlert(
            adminUser.email,
            adminUser.name,
            newAlerts.map((d) => ({
              docName: d.docName,
              spaceName: d.spaceName,
              itemName: d.itemName,
              expiryDate: d.expiryDate,
              daysRemaining: d.daysRemaining,
            }))
          ).catch((err) => console.error("Expiry alert failed:", err));
        }

        // Record sent alerts
        for (const alert of newAlerts) {
          await admin.from("expiry_alerts_sent").upsert({
            document_id: alert.docId,
            threshold_days: alert.threshold,
          });
        }

        alertsSent += newAlerts.length;
      }
    }

    // --- Weekly Digest (Mondays only) ---
    if (isMonday) {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Docs uploaded this week
      const { count: docsThisWeek } = await admin.from("documents")
        .select("id", { count: "exact", head: true })
        .in("item_id", itemIds)
        .gte("created_at", oneWeekAgo);

      // Inbox pending
      const { count: inboxPending } = await admin.from("inbox_documents")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("status", "pending");

      // Expiring in 90 days count
      const expiringCount = expiringDocs.length;

      const stats = {
        docsThisWeek: docsThisWeek || 0,
        inboxPending: inboxPending || 0,
        expiringCount,
      };

      // AI summary (optional — skip if no activity)
      let aiSummary: string | undefined;
      const apiKey = process.env.CLAUDE_API_KEY;
      if (apiKey && (stats.docsThisWeek > 0 || stats.inboxPending > 0 || stats.expiringCount > 0)) {
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 200,
              messages: [{
                role: "user",
                content: `Write a 1-2 sentence summary for a property management weekly email digest. Organization: ${org.name}. Stats: ${stats.docsThisWeek} new documents uploaded, ${stats.inboxPending} inbox items pending, ${stats.expiringCount} documents expiring in 90 days. Be concise, professional, and actionable. No greeting.`,
              }],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            aiSummary = data.content?.[0]?.text || undefined;
          }
        } catch { /* skip AI summary */ }
      }

      for (const adminUser of admins) {
        await sendWeeklyDigest(adminUser.email, adminUser.name, org.name, stats, aiSummary)
          .catch((err) => console.error("Digest failed:", err));
      }

      digestsSent++;
    }
  }

  console.log(`Cron complete: ${alertsSent} alerts, ${digestsSent} digests`);
  return NextResponse.json({ success: true, alertsSent, digestsSent });
}
