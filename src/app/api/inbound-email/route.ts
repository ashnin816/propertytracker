import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import PostalMime from "postal-mime";

export const runtime = "nodejs";
export const maxDuration = 60;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST — receive raw email from Cloudflare Worker
export async function POST(req: NextRequest) {
  // Verify shared secret
  const secret = req.headers.get("x-inbound-secret");
  if (!secret || secret !== process.env.INBOUND_EMAIL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { from, rawEmail } = body;

    if (!from || !rawEmail) {
      return NextResponse.json({ error: "Missing from or rawEmail" }, { status: 400 });
    }

    // Parse the raw email server-side
    const rawBuffer = Buffer.from(rawEmail, "base64");
    const parser = new PostalMime();
    const parsed = await parser.parse(rawBuffer);

    // Filter attachments — skip inline images (signatures, logos)
    const attachments = (parsed.attachments || []).filter(
      (att) => att.content && att.filename && att.disposition !== "inline"
    );

    if (attachments.length === 0) {
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
      return NextResponse.json({ error: "Unknown sender" }, { status: 403 });
    }

    if (profile.status === "inactive") {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
    }

    const orgId = profile.org_id;
    const subject = parsed.subject || body.subject || null;
    let processed = 0;

    for (const attachment of attachments) {
      const { filename, content, mimeType } = attachment;
      if (!content || !filename) continue;

      const contentType = mimeType || "application/octet-stream";
      const fileBuffer = Buffer.from(new Uint8Array(content as ArrayBuffer));
      const ext = filename.split(".").pop() || "bin";
      const storagePath = `inbox/${orgId}/${crypto.randomUUID()}.${ext}`;

      // Skip files over 20MB
      if (fileBuffer.byteLength > 20 * 1024 * 1024) continue;

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
        subject,
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

    return NextResponse.json({ success: true, count: processed });
  } catch (err) {
    console.error("Inbound email error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
