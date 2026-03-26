import { supabase } from "./supabase";

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
  avatarUrl?: string;
  status: "active" | "inactive";
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
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return null;
    }

    // Simple query first — no join
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return null;
    }

    if (!profile) return null;

    // Get org name separately if org_id exists
    let orgName: string | undefined;
    if (profile.org_id) {
      const { data: org } = await supabase.from("organizations")
        .select("name")
        .eq("id", profile.org_id)
        .single();
      orgName = org?.name;
    }

    // Fetch assignments for non-admin roles (via API to bypass RLS)
    let assignments: UserAssignment[] | undefined;
    const role = profile.role as UserProfile["role"];
    if (role !== "org_admin" && role !== "super_admin") {
      try {
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_assignments", userId: user.id }),
        });
        const assignData = await res.json();
        assignments = Array.isArray(assignData)
          ? assignData.map((a: Record<string, unknown>) => ({
              spaceId: a.space_id as string,
              unitId: a.unit_id as string | null,
            }))
          : [];
      } catch {
        assignments = [];
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role,
      orgId: profile.org_id,
      orgName,
      avatarUrl: profile.avatar_url,
      status: profile.status || "active",
      assignments,
    };
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
