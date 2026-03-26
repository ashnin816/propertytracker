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
