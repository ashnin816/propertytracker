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

// PATCH — update user (status toggle, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, status } = body;

    if (!userId || !status || !["active", "inactive"].includes(status)) {
      return NextResponse.json({ error: "userId and valid status required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Update profile status
    const { error } = await admin.from("profiles").update({ status }).eq("id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ban/unban auth user to invalidate sessions
    if (status === "inactive") {
      await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    } else {
      await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
    }

    return NextResponse.json({ success: true });
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
