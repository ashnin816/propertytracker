import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST — receive parsed email from SendGrid Inbound Parse
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const from = formData.get("from") as string;
    const subject = formData.get("subject") as string;
    const numAttachments = parseInt(formData.get("attachments") as string || "0", 10);

    console.log("Inbound email from:", from, "subject:", subject, "attachments:", numAttachments);

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

    // Look up sender's org
    const { data: profile } = await admin.from("profiles")
      .select("org_id, status")
      .eq("email", senderEmail)
      .single();

    if (!profile || !profile.org_id) {
      console.log("Unknown sender:", senderEmail);
      return NextResponse.json({ error: "Unknown sender" }, { status: 403 });
    }

    if (profile.status === "inactive") {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
    }

    const orgId = profile.org_id;
    let processed = 0;

    // SendGrid sends attachments as attachment1, attachment2, etc.
    for (let i = 1; i <= numAttachments; i++) {
      const file = formData.get(`attachment${i}`) as File | null;
      if (!file) continue;

      const filename = file.name || `attachment${i}`;
      const contentType = file.type || "application/octet-stream";

      // Skip files over 20MB
      if (file.size > 20 * 1024 * 1024) continue;

      // Skip inline images (signatures, logos, tracking pixels)
      const lowerName = filename.toLowerCase();
      const isLikelyInline =
        // Small images with generic/auto-generated names
        (contentType.startsWith("image/") && file.size < 100000 && (
          lowerName.startsWith("image") ||
          lowerName.startsWith("img-") ||
          lowerName.startsWith("img_") ||
          lowerName.includes("logo") ||
          lowerName.includes("signature") ||
          lowerName.includes("banner") ||
          lowerName.includes("icon") ||
          !lowerName.includes(".")  // no file extension = likely inline
        )) ||
        // Tracking pixels
        (contentType.startsWith("image/") && file.size < 5000) ||
        // Generic octet-stream with image-like auto-generated names
        (contentType === "application/octet-stream" && file.size < 100000 && (
          lowerName.startsWith("img-") ||
          lowerName.startsWith("img_") ||
          lowerName.startsWith("image")
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

      const { error: insertError } = await admin.from("inbox_documents").insert({
        org_id: orgId,
        sender_email: senderEmail,
        sender_name: senderName,
        subject: subject || null,
        file_name: filename,
        file_url: fileUrl,
        file_type: contentType,
        status: "pending",
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      processed++;
    }

    console.log("Processed", processed, "attachments for org:", orgId);
    return NextResponse.json({ success: true, count: processed });
  } catch (err) {
    console.error("Inbound email error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
