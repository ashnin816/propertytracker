import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "org_admin" | "manager" | "technician" | "tenant";
  orgId: string | null;
  orgName?: string;
  avatarUrl?: string;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles")
    .select("*, organizations(name)")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const org = (profile as Record<string, unknown>).organizations as Record<string, unknown> | null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as UserProfile["role"],
    orgId: profile.org_id,
    orgName: org?.name as string | undefined,
    avatarUrl: profile.avatar_url,
  };
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
