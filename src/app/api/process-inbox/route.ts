import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import pdfParse from "pdf-parse-new";

export const runtime = "nodejs";
export const maxDuration = 60;

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

// Process one unprocessed inbox document — analyze with AI and match
export async function POST(req: NextRequest) {
  const caller = await getCallerProfile(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await req.json();
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const admin = getAdminClient();

  // Find one unprocessed doc (no extracted_text, analyzable file type)
  const { data: doc } = await admin.from("inbox_documents")
    .select("id, file_url, file_type, file_name, subject, org_id")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .is("extracted_text", null)
    .in("file_type", ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"])
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!doc) return NextResponse.json({ processed: false, message: "Nothing to process" });

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ processed: false, message: "No API key" });

  try {
    let extractedText = "";
    let smartName: string | null = null;
    let docDetails: Record<string, string> | null = null;

    const isImage = doc.file_type.startsWith("image/");
    const isPdf = doc.file_type === "application/pdf";

    if (isImage) {
      const imgRes = await fetch(doc.file_url);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const base64 = imgBuffer.toString("base64");

      const analyzeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 2000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: doc.file_type, data: base64 } },
            { type: "text", text: `Analyze this document image. Return a JSON object with:\n1. "name": A short, descriptive name (max 60 chars)\n2. "extractedText": All readable text\n3. "details": Key details (store, amount, date, product, type, expiration, etc.)\n\nReturn ONLY valid JSON.` },
          ]}],
        }),
      });

      if (analyzeRes.ok) {
        const data = await analyzeRes.json();
        const text = data.content?.[0]?.text || "";
        try {
          const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleaned);
          extractedText = parsed.extractedText || "";
          smartName = parsed.name || null;
          docDetails = parsed.details || null;
        } catch { extractedText = text; }
      }
    } else if (isPdf) {
      try {
        const pdfRes = await fetch(doc.file_url);
        const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
        let pdfText = "";
        try { const pdfData = await pdfParse(pdfBuffer); pdfText = pdfData.text?.trim() || ""; } catch {}

        const messages = pdfText.length > 20
          ? [{ role: "user" as const, content: `Analyze this document text and return JSON with "name", "extractedText", "details".\n\n${pdfText.slice(0, 3000)}\n\nReturn ONLY valid JSON.` }]
          : [{ role: "user" as const, content: [
              { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: pdfBuffer.toString("base64") } },
              { type: "text" as const, text: `Analyze this PDF. Return JSON with "name", "extractedText", "details".\n\nReturn ONLY valid JSON.` },
            ]}];

        const analyzeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2000, messages }),
        });

        if (analyzeRes.ok) {
          const data = await analyzeRes.json();
          const text = data.content?.[0]?.text || "";
          try {
            const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned);
            extractedText = parsed.extractedText || pdfText.slice(0, 2000) || "";
            smartName = parsed.name || null;
            docDetails = parsed.details || null;
          } catch { extractedText = pdfText.slice(0, 2000) || text; }
        } else { extractedText = pdfText.slice(0, 2000) || `PDF document. ${doc.subject ? `Subject: ${doc.subject}` : ""}`; }
      } catch { extractedText = `PDF document. ${doc.subject ? `Subject: ${doc.subject}` : ""}`; }
    }

    // Update doc with analysis
    const updates: Record<string, unknown> = { extracted_text: extractedText || "analyzed" };
    if (smartName) updates.file_name = smartName;
    if (docDetails) updates.details = docDetails;
    await admin.from("inbox_documents").update(updates).eq("id", doc.id);

    // Match to property/asset
    const { data: spaces } = await admin.from("spaces").select("id, name").eq("org_id", orgId);
    if (spaces && spaces.length > 0) {
      const spaceIds = spaces.map((s: { id: string }) => s.id);
      const { data: items } = await admin.from("items").select("id, name, space_id").in("space_id", spaceIds);
      const orgContext = spaces.map((s: { id: string; name: string }) => ({
        spaceId: s.id, spaceName: s.name,
        items: (items || []).filter((i: { space_id: string }) => i.space_id === s.id).map((i: { id: string; name: string }) => ({ itemId: i.id, itemName: i.name })),
      }));

      const matchContext = extractedText || smartName || doc.subject || "Unknown";
      const matchRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 500,
          messages: [{ role: "user", content: `Given this document:\n- Name: "${smartName || "Unknown"}"\n- Content: "${matchContext.slice(0, 1000)}"\n\nAnd these properties and assets:\n${JSON.stringify(orgContext, null, 2)}\n\nWhich property and asset does this belong to?\nReturn JSON: { "space_id": "...", "item_id": "...", "reason": "..." }\nIf property only: { "space_id": "...", "item_id": null, "reason": "..." }\nIf no match: { "space_id": null, "item_id": null, "reason": "No clear match" }\nReturn ONLY valid JSON.` }],
        }),
      });

      if (matchRes.ok) {
        const matchData = await matchRes.json();
        const matchText = matchData.content?.[0]?.text || "";
        try {
          const cleaned = matchText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const match = JSON.parse(cleaned);
          const matchUpdate: Record<string, unknown> = {};
          if (match.space_id) matchUpdate.suggested_space_id = match.space_id;
          if (match.item_id) matchUpdate.suggested_item_id = match.item_id;
          if (match.reason) matchUpdate.suggested_match_reason = match.reason;
          if (Object.keys(matchUpdate).length > 0) {
            await admin.from("inbox_documents").update(matchUpdate).eq("id", doc.id);
          }
        } catch {}
      }
    }

    return NextResponse.json({ processed: true, docId: doc.id });
  } catch (err) {
    console.error("Process inbox error:", err);
    // Mark as analyzed (with empty text) so we don't retry forever
    await admin.from("inbox_documents").update({ extracted_text: "error" }).eq("id", doc.id);
    return NextResponse.json({ processed: true, error: true });
  }
}
