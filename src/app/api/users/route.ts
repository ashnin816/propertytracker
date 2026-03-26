import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendWelcomeEmail, sendPasswordResetEmail, sendDeactivatedEmail, sendReactivatedEmail } from "@/lib/email";

export const runtime = "nodejs";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function generateRandomPassword() {
  return crypto.randomBytes(16).toString("base64url");
}

// Server-side Supabase client with service role key (bypasses RLS)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify the caller's identity and role from their JWT
async function getCallerProfile(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");

  // Try to get token from Authorization header or Supabase auth cookie
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (cookieHeader) {
    // Supabase stores the access token in cookies
    const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (match) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        token = parsed?.access_token || parsed?.[0]?.access_token;
      } catch { /* ignore */ }
    }
  }

  if (!token) return null;

  const admin = getAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await admin.from("profiles")
    .select("id, role, org_id, status")
    .eq("id", user.id)
    .single();

  return profile;
}

function isAdmin(role: string) {
  return role === "org_admin" || role === "super_admin";
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET — list users for an org
export async function GET(req: NextRequest) {
  const caller = await getCallerProfile(req);
  if (!caller) return unauthorized();

  const orgId = req.nextUrl.searchParams.get("org_id");
  if (!orgId) {
    return NextResponse.json({ error: "org_id required" }, { status: 400 });
  }

  // Must be admin of this org, or super_admin
  if (caller.role !== "super_admin" && (!isAdmin(caller.role) || caller.org_id !== orgId)) {
    return forbidden();
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
  const caller = await getCallerProfile(req);
  if (!caller) return unauthorized();
  if (!isAdmin(caller.role)) return forbidden();

  try {
    const { email, name, role, orgId } = await req.json();

    if (!email || !name || !role || !orgId) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    // org_admin can only create users in their own org
    if (caller.role !== "super_admin" && caller.org_id !== orgId) {
      return forbidden();
    }

    const admin = getAdminClient();
    const randomPassword = generateRandomPassword();
    const setupToken = generateToken();
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // 1. Create auth user with random password (user will set their own via setup link)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { name, role, org_id: orgId },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Create profile with setup token
    const { error: profileError } = await admin.from("profiles").upsert({
      id: authData.user.id,
      email,
      name,
      role,
      org_id: orgId,
      must_reset_password: true,
      setup_token: setupToken,
      setup_token_expires: tokenExpires,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // Send welcome email with setup link
    sendWelcomeEmail(email, name, setupToken).catch((err) =>
      console.error("Welcome email failed:", err)
    );

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

// PATCH — update user (status toggle, assignments, password reset)
export async function PATCH(req: NextRequest) {
  const caller = await getCallerProfile(req);
  if (!caller) return unauthorized();

  try {
    const body = await req.json();
    const admin = getAdminClient();

    // Action: toggle_status — admin only
    if (body.action === "toggle_status" || body.status) {
      if (!isAdmin(caller.role)) return forbidden();
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

      // Send status email (don't block on failure)
      const { data: targetProfile } = await admin.from("profiles").select("email, name").eq("id", userId).single();
      if (targetProfile) {
        const emailFn = status === "inactive" ? sendDeactivatedEmail : sendReactivatedEmail;
        emailFn(targetProfile.email, targetProfile.name).catch((err) =>
          console.error("Status email failed:", err)
        );
      }

      return NextResponse.json({ success: true });
    }

    // Action: get_assignments — admin or the user themselves
    if (body.action === "get_assignments") {
      if (!isAdmin(caller.role) && caller.id !== body.userId) return forbidden();
      const { data, error } = await admin.from("user_assignments")
        .select("id, space_id, unit_id, spaces(name, icon), units(name)")
        .eq("user_id", body.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    // Action: get_units — any authenticated user (needed for tenant assignment UI and navigation)
    if (body.action === "get_units") {
      const { data, error } = await admin.from("units")
        .select("id, name, space_id")
        .eq("space_id", body.spaceId)
        .order("name");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    // Action: assign — admin only
    if (body.action === "assign") {
      if (!isAdmin(caller.role)) return forbidden();
      const { userId, spaceId, unitId } = body;
      const { error } = await admin.from("user_assignments").upsert({
        user_id: userId, space_id: spaceId, unit_id: unitId || null,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Action: unassign — admin only
    if (body.action === "unassign") {
      if (!isAdmin(caller.role)) return forbidden();
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

    // Action: reset_password — user can reset their own password (first login flow)
    if (body.action === "reset_password") {
      const { userId, newPassword } = body;
      if (caller.id !== userId) return forbidden(); // can only reset your own
      if (!userId || !newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const { error: authErr } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });
      const { error: profErr } = await admin.from("profiles").update({ must_reset_password: false }).eq("id", userId);
      if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Action: admin_reset_password — admin only, sends setup link
    if (body.action === "admin_reset_password") {
      if (!isAdmin(caller.role)) return forbidden();
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

      const setupToken = generateToken();
      const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: profErr } = await admin.from("profiles").update({
        must_reset_password: true,
        setup_token: setupToken,
        setup_token_expires: tokenExpires,
      }).eq("id", userId);
      if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

      // Ban user so current session is invalidated — they must use the setup link
      await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });

      // Send password reset email with setup link
      const { data: targetProfile } = await admin.from("profiles").select("email, name").eq("id", userId).single();
      if (targetProfile) {
        sendPasswordResetEmail(targetProfile.email, targetProfile.name, setupToken).catch((err) =>
          console.error("Password reset email failed:", err)
        );
      }

      return NextResponse.json({ success: true });
    }

    // Action: validate_setup_token — public, validates token and sets password
    if (body.action === "validate_setup_token") {
      const { token, newPassword } = body;
      if (!token || !newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Token and password (min 6 chars) required" }, { status: 400 });
      }

      const { data: profile, error: findErr } = await admin.from("profiles")
        .select("id, email, name, setup_token_expires")
        .eq("setup_token", token)
        .single();

      if (findErr || !profile) {
        return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
      }

      if (profile.setup_token_expires && new Date(profile.setup_token_expires) < new Date()) {
        return NextResponse.json({ error: "This link has expired. Ask your admin to send a new one." }, { status: 400 });
      }

      // Set the password and clear the token
      const { error: authErr } = await admin.auth.admin.updateUserById(profile.id, {
        password: newPassword,
        ban_duration: "none",
      });
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

      const { error: updateErr } = await admin.from("profiles").update({
        must_reset_password: false,
        setup_token: null,
        setup_token_expires: null,
      }).eq("id", profile.id);
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      return NextResponse.json({ success: true, email: profile.email });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE — remove a user (admin only)
export async function DELETE(req: NextRequest) {
  const caller = await getCallerProfile(req);
  if (!caller) return unauthorized();
  if (!isAdmin(caller.role)) return forbidden();

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
