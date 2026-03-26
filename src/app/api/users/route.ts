import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Server-side Supabase client with service role key (bypasses RLS)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — list users for an org
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("org_id");
  if (!orgId) {
    return NextResponse.json({ error: "org_id required" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin.from("profiles")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — create a new user
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, orgId } = await req.json();

    if (!email || !password || !name || !role || !orgId) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, org_id: orgId },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Create profile (the trigger might not work, so do it explicitly)
    const { error: profileError } = await admin.from("profiles").upsert({
      id: authData.user.id,
      email,
      name,
      role,
      org_id: orgId,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // User was created but profile failed — still return success
    }

    return NextResponse.json({
      id: authData.user.id,
      email,
      name,
      role,
    });
  } catch (err) {
    console.error("User creation error:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// PATCH — update user (status toggle, assignments)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = getAdminClient();

    // Action: toggle_status
    if (body.action === "toggle_status" || body.status) {
      const { userId, status } = body;
      if (!userId || !status || !["active", "inactive"].includes(status)) {
        return NextResponse.json({ error: "userId and valid status required" }, { status: 400 });
      }

      const { error } = await admin.from("profiles").update({ status }).eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      if (status === "inactive") {
        await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
      } else {
        await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
      }
      return NextResponse.json({ success: true });
    }

    // Action: get_assignments
    if (body.action === "get_assignments") {
      const { data, error } = await admin.from("user_assignments")
        .select("id, space_id, unit_id, spaces(name, icon), units(name)")
        .eq("user_id", body.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    // Action: get_units
    if (body.action === "get_units") {
      const { data, error } = await admin.from("units")
        .select("id, name, space_id")
        .eq("space_id", body.spaceId)
        .order("name");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    // Action: assign
    if (body.action === "assign") {
      const { userId, spaceId, unitId } = body;
      const { error } = await admin.from("user_assignments").upsert({
        user_id: userId, space_id: spaceId, unit_id: unitId || null,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Action: unassign
    if (body.action === "unassign") {
      const { userId, spaceId, unitId } = body;
      let query = admin.from("user_assignments").delete()
        .eq("user_id", userId).eq("space_id", spaceId);
      if (unitId) {
        query = query.eq("unit_id", unitId);
      } else {
        query = query.is("unit_id", null);
      }
      const { error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE — remove a user
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Delete profile first
  await admin.from("profiles").delete().eq("id", userId);

  // Delete auth user
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
