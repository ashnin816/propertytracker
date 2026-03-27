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

// AI: Analyze document and suggest property/asset match
async function processWithAI(admin: SupabaseClient, docId: string, fileUrl: string, fileType: string, orgId: string, subject: string | null) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return;

  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  // Only analyze images for now (PDFs need server-side text extraction)
  if (!isImage && !isPdf) return;

  try {
    let extractedText = "";
    let smartName: string | null = null;

    if (isImage) {
      // Step 1: Download image and send to Claude for analysis
      const imgRes = await fetch(fileUrl);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const base64 = imgBuffer.toString("base64");

      const analyzeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: fileType, data: base64 },
              },
              {
                type: "text",
                text: `Analyze this document image. Return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": All readable text from the document.
3. "details": An object with any key details found (store, amount, date, product, type, expiration, etc.)

Return ONLY valid JSON, no markdown or explanation.`,
              },
            ],
          }],
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
        } catch {
          extractedText = text;
        }
      }
    } else if (isPdf) {
      // Try text extraction first, fall back to sending PDF as document to Claude
      try {
        const pdfRes = await fetch(fileUrl);
        const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

        // Try text-based extraction
        let pdfText = "";
        try {
          const pdfData = await pdfParse(pdfBuffer);
          pdfText = pdfData.text?.trim() || "";
        } catch { /* scanned PDF, no text */ }

        // Build Claude content — use text if available, otherwise send as base64 document
        const base64Pdf = pdfBuffer.toString("base64");
        const claudeContent = pdfText.length > 20
          ? `Analyze this document text and return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": A clean summary of the key content.
3. "details": An object with any key details found (store, amount, date, product, type, expiration, etc.)

Here is the document text:

${pdfText.slice(0, 3000)}

Return ONLY valid JSON, no markdown or explanation.`
          : null;

        // For scanned PDFs (no text), send as base64 document to Claude
        const messages = claudeContent
          ? [{ role: "user" as const, content: claudeContent }]
          : [{
              role: "user" as const,
              content: [
                {
                  type: "document" as const,
                  source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64Pdf },
                },
                {
                  type: "text" as const,
                  text: `Analyze this PDF document. Return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": All readable text from the document.
3. "details": An object with any key details found (store, amount, date, product, type, expiration, etc.)

Return ONLY valid JSON, no markdown or explanation.`,
                },
              ],
            }];

        const analyzeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            messages,
          }),
        });

        if (analyzeRes.ok) {
          const data = await analyzeRes.json();
          const text = data.content?.[0]?.text || "";
          try {
            const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned);
            extractedText = parsed.extractedText || pdfText.slice(0, 2000) || "";
            smartName = parsed.name || null;
          } catch {
            extractedText = pdfText.slice(0, 2000) || text;
          }
        } else {
          const errText = await analyzeRes.text();
          console.error("Claude PDF analysis error:", analyzeRes.status, errText);
          extractedText = pdfText.slice(0, 2000) || `PDF document. ${subject ? `Subject: ${subject}` : ""}`;
        }
      } catch (pdfErr) {
        console.error("PDF processing error:", pdfErr);
        extractedText = `PDF document. ${subject ? `Subject: ${subject}` : ""}`;
      }
    }

    // Update the document with extracted text and smart name
    const updates: Record<string, unknown> = { extracted_text: extractedText || null };
    if (smartName) updates.file_name = smartName;
    await admin.from("inbox_documents").update(updates).eq("id", docId);

    // Step 2: Match to property/asset
    const { data: spaces } = await admin.from("spaces").select("id, name").eq("org_id", orgId);
    if (!spaces || spaces.length === 0) return;

    const spaceIds = spaces.map((s: { id: string }) => s.id);
    const { data: items } = await admin.from("items").select("id, name, space_id").in("space_id", spaceIds);

    // Build context for Claude
    const orgContext = spaces.map((s: { id: string; name: string }) => ({
      spaceId: s.id,
      spaceName: s.name,
      items: (items || []).filter((i: { space_id: string }) => i.space_id === s.id).map((i: { id: string; name: string }) => ({
        itemId: i.id,
        itemName: i.name,
      })),
    }));

    const matchContext = extractedText || smartName || subject || "Unknown document";

    const matchRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Given this document:
- Name: "${smartName || "Unknown"}"
- Content: "${matchContext.slice(0, 1000)}"

And these properties and assets:
${JSON.stringify(orgContext, null, 2)}

Which property and asset does this document most likely belong to?
Return JSON: { "space_id": "the matching space UUID", "item_id": "the matching item UUID", "reason": "brief explanation" }
If you can identify the property but not a specific asset, return: { "space_id": "the space UUID", "item_id": null, "reason": "Matched to property but no specific asset identified" }
If no match at all, return: { "space_id": null, "item_id": null, "reason": "No clear match found" }
Return ONLY valid JSON, no markdown.`,
        }],
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
          await admin.from("inbox_documents").update(matchUpdate).eq("id", docId);
        }
      } catch {
        console.error("Failed to parse match result:", matchText);
      }
    }

    console.log("AI processing complete for doc:", docId);
  } catch (err) {
    console.error("AI processing error:", err);
  }
}

// POST — receive parsed email from SendGrid Inbound Parse
export async function POST(req: NextRequest) {
  // Optional webhook secret verification
  const secret = req.nextUrl.searchParams.get("secret");
  if (process.env.INBOUND_EMAIL_SECRET && secret && secret !== process.env.INBOUND_EMAIL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const from = formData.get("from") as string;
    const to = formData.get("to") as string;
    const subject = formData.get("subject") as string;
    const numAttachments = parseInt(formData.get("attachments") as string || "0", 10);

    console.log("Inbound email from:", from, "to:", to, "subject:", subject, "attachments:", numAttachments);

    if (!from) {
      return NextResponse.json({ error: "No sender" }, { status: 400 });
    }

    if (numAttachments === 0) {
      return NextResponse.json({ success: true, count: 0, note: "No attachments" });
    }

    const admin = getAdminClient();

    // Parse sender email and name
    const emailMatch = from.match(/<(.+?)>/) || [null, from];
    const senderEmail = (emailMatch[1] || from).trim().toLowerCase();
    const senderName = from.replace(/<.+?>/, "").trim().replace(/^["']|["']$/g, "") || null;

    // Route by "to" address — extract slug from {slug}@inbound.propertytrackerplus.com
    const toEmail = to ? (to.match(/<(.+?)>/) || [null, to])[1]?.trim().toLowerCase() || to.trim().toLowerCase() : "";
    const toSlug = toEmail.split("@")[0];

    let orgId: string | null = null;

    if (toSlug) {
      const { data: org } = await admin.from("organizations")
        .select("id")
        .eq("slug", toSlug)
        .single();
      if (org) orgId = org.id;
    }

    // Fallback: look up org by sender email
    if (!orgId) {
      const { data: profile } = await admin.from("profiles")
        .select("org_id, status")
        .eq("email", senderEmail)
        .single();
      if (profile?.status === "inactive") {
        return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
      }
      orgId = profile?.org_id || null;
    }

    if (!orgId) {
      console.log("No org found for to:", toEmail, "from:", senderEmail);
      return NextResponse.json({ error: "Unknown recipient" }, { status: 403 });
    }

    let processed = 0;
    const aiPromises: Promise<void>[] = [];

    for (let i = 1; i <= numAttachments; i++) {
      const file = formData.get(`attachment${i}`) as File | null;
      if (!file) continue;

      const filename = file.name || `attachment${i}`;
      const contentType = file.type || "application/octet-stream";

      if (file.size > 20 * 1024 * 1024) continue;

      // Skip inline images
      const lowerName = filename.toLowerCase();
      const isLikelyInline =
        (contentType.startsWith("image/") && file.size < 100000 && (
          lowerName.startsWith("image") || lowerName.startsWith("img-") || lowerName.startsWith("img_") ||
          lowerName.includes("logo") || lowerName.includes("signature") || lowerName.includes("banner") ||
          lowerName.includes("icon") || !lowerName.includes(".")
        )) ||
        (contentType.startsWith("image/") && file.size < 5000) ||
        (contentType === "application/octet-stream" && file.size < 100000 && (
          lowerName.startsWith("img-") || lowerName.startsWith("img_") || lowerName.startsWith("image")
        ));
      if (isLikelyInline) continue;

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const ext = filename.split(".").pop() || "bin";
      const storagePath = `inbox/${orgId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await admin.storage
        .from("documents")
        .upload(storagePath, fileBuffer, { contentType });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: urlData } = admin.storage.from("documents").getPublicUrl(storagePath);
      const fileUrl = urlData.publicUrl;

      const { data: insertedDoc, error: insertError } = await admin.from("inbox_documents").insert({
        org_id: orgId,
        sender_email: senderEmail,
        sender_name: senderName,
        subject: subject || null,
        file_name: filename,
        file_url: fileUrl,
        file_type: contentType,
        status: "pending",
      }).select("id").single();

      if (insertError || !insertedDoc) {
        console.error("Insert error:", insertError);
        continue;
      }

      // Queue AI processing
      aiPromises.push(processWithAI(admin, insertedDoc.id, fileUrl, contentType, orgId, subject));
      processed++;
    }

    // Run AI processing with a timeout — don't let SendGrid timeout waiting
    if (aiPromises.length > 0) {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 50000)); // 50s max
      await Promise.race([Promise.all(aiPromises), timeout]);
    }

    console.log("Processed", processed, "attachments for org:", orgId);
    return NextResponse.json({ success: true, count: processed });
  } catch (err) {
    console.error("Inbound email error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
