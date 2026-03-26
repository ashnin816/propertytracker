import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify caller identity
async function getCallerProfile(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
  if (!token) return null;
  const admin = getAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await admin.from("profiles")
    .select("id, role, org_id")
    .eq("id", user.id)
    .single();
  return profile;
}

// GET — list inbox documents for an org
export async function GET(req: NextRequest) {
  const caller = await getCallerProfile(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("org_id");
  if (!orgId) return NextResponse.json({ error: "org_id required" }, { status: 400 });

  // Must be admin or manager of this org
  const isAdmin = caller.role === "org_admin" || caller.role === "super_admin";
  const isManager = caller.role === "manager";
  if (!isAdmin && !isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isAdmin && caller.org_id !== orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = getAdminClient();
  const { data, error } = await admin.from("inbox_documents")
    .select("*, spaces(name), items(name)")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — permanently delete an inbox document
export async function DELETE(req: NextRequest) {
  const caller = await getCallerProfile(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = caller.role === "org_admin" || caller.role === "super_admin";
  const isManager = caller.role === "manager";
  if (!isAdmin && !isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = getAdminClient();

  // Get file URL to delete from storage
  const { data: doc } = await admin.from("inbox_documents").select("file_url, org_id").eq("id", id).single();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify caller belongs to same org
  if (!isAdmin && caller.org_id !== doc.org_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete file from storage
  if (doc.file_url) {
    const match = doc.file_url.match(/\/documents\/(.+)$/);
    if (match) {
      await admin.storage.from("documents").remove([match[1]]);
    }
  }

  // Delete the row
  await admin.from("inbox_documents").delete().eq("id", id);
  return NextResponse.json({ success: true });
}

// POST — assign an inbox document to an item
export async function POST(req: NextRequest) {
  const caller = await getCallerProfile(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = caller.role === "org_admin" || caller.role === "super_admin";
  const isManager = caller.role === "manager";
  if (!isAdmin && !isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { inboxDocId, itemId } = await req.json();
    if (!inboxDocId || !itemId) return NextResponse.json({ error: "inboxDocId and itemId required" }, { status: 400 });

    const admin = getAdminClient();

    const { data: inbox } = await admin.from("inbox_documents").select("*").eq("id", inboxDocId).single();
    if (!inbox) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Verify caller belongs to same org
    if (!isAdmin && caller.org_id !== inbox.org_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Insert into documents table
    const { error: insertErr } = await admin.from("documents").insert({
      item_id: itemId,
      name: inbox.file_name,
      file_url: inbox.file_url,
      file_type: inbox.file_type,
      extracted_text: inbox.extracted_text || null,
      ocr_status: inbox.extracted_text ? "done" : "pending",
    });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // Mark as assigned
    await admin.from("inbox_documents").update({ status: "assigned" }).eq("id", inboxDocId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Inbox assign error:", err);
    return NextResponse.json({ error: "Failed to assign" }, { status: 500 });
  }
}
