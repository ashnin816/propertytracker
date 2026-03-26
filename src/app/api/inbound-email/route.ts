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

// POST — receive parsed email from Cloudflare Worker
export async function POST(req: NextRequest) {
  // Verify shared secret
  const secret = req.headers.get("x-inbound-secret");
  if (!secret || secret !== process.env.INBOUND_EMAIL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { from, subject, attachments } = await req.json();

    if (!from || !attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return NextResponse.json({ error: "No attachments" }, { status: 400 });
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
      return NextResponse.json({ error: "Unknown sender" }, { status: 403 });
    }

    if (profile.status === "inactive") {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
    }

    const orgId = profile.org_id;
    let processed = 0;

    for (const attachment of attachments) {
      const { filename, content, contentType, size } = attachment;
      if (!content || !filename) continue;

      // Skip files over 20MB
      if (size && size > 20 * 1024 * 1024) continue;

      // Upload to Supabase Storage
      const fileBuffer = Buffer.from(content, "base64");
      const ext = filename.split(".").pop() || "bin";
      const storagePath = `inbox/${orgId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await admin.storage
        .from("documents")
        .upload(storagePath, fileBuffer, { contentType: contentType || "application/octet-stream" });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: urlData } = admin.storage.from("documents").getPublicUrl(storagePath);
      const fileUrl = urlData.publicUrl;

      // Insert inbox document
      const { error: insertError } = await admin.from("inbox_documents").insert({
        org_id: orgId,
        sender_email: senderEmail,
        sender_name: senderName,
        subject: subject || null,
        file_name: filename,
        file_url: fileUrl,
        file_type: contentType || "application/octet-stream",
        status: "pending",
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      processed++;
    }

    return NextResponse.json({ success: true, count: processed });
  } catch (err) {
    console.error("Inbound email error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
