import { supabase, authFetch } from "./supabase";

export interface UserAssignment {
  spaceId: string;
  unitId: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "org_admin" | "manager" | "technician" | "tenant";
  orgId: string | null;
  orgName?: string;
  orgSlug?: string;
  orgStatus?: "active" | "suspended";
  avatarUrl?: string;
  status: "active" | "inactive";
  mustResetPassword?: boolean;
  assignments?: UserAssignment[];
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, name: string, orgId?: string, role?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, org_id: orgId, role: role || "org_admin" },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  clearProfileCache();
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// In-memory profile cache to avoid repeated round trips
let cachedProfile: UserProfile | null = null;
let cachedUserId: string | null = null;

export function clearProfileCache() {
  cachedProfile = null;
  cachedUserId = null;
}

export async function getProfile(forceRefresh = false): Promise<UserProfile | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      clearProfileCache();
      return null;
    }

    // Return cached if same user and not forcing refresh
    if (!forceRefresh && cachedProfile && cachedUserId === user.id) {
      return cachedProfile;
    }

    // Fetch profile + org in parallel where possible
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return null;
    }

    // Get org info and assignments in parallel
    const role = profile.role as UserProfile["role"];
    const needsOrg = !!profile.org_id;
    const needsAssignments = role !== "org_admin" && role !== "super_admin";

    const [orgResult, assignResult] = await Promise.all([
      needsOrg
        ? supabase.from("organizations").select("name, slug, status").eq("id", profile.org_id).single()
        : Promise.resolve({ data: null }),
      needsAssignments
        ? authFetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "get_assignments", userId: user.id }),
          }).then((r) => r.json()).catch(() => [])
        : Promise.resolve(undefined),
    ]);

    const orgName = orgResult.data?.name;
    const orgSlug = orgResult.data?.slug;
    const orgStatus = orgResult.data?.status as "active" | "suspended" | undefined;
    let assignments: UserAssignment[] | undefined;
    if (needsAssignments) {
      assignments = Array.isArray(assignResult)
        ? assignResult.map((a: Record<string, unknown>) => ({
            spaceId: a.space_id as string,
            unitId: a.unit_id as string | null,
          }))
        : [];
    }

    const userProfile: UserProfile = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role,
      orgId: profile.org_id,
      orgName,
      orgSlug,
      orgStatus,
      avatarUrl: profile.avatar_url,
      status: profile.status || "active",
      mustResetPassword: profile.must_reset_password || false,
      assignments,
    };

    // Cache it
    cachedProfile = userProfile;
    cachedUserId = user.id;

    return userProfile;
  } catch (err) {
    console.error("getProfile error:", err);
    return null;
  }
}

export async function setupSuperAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("setup_super_admin", { user_id: user.id });
}

export function onAuthChange(callback: (event: string) => void) {
  return supabase.auth.onAuthStateChange((event) => {
    callback(event);
  });
}
