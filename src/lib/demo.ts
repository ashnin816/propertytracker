import { supabase } from "./supabase";

export async function loadDemoData() {
  // Get current user's org_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile?.org_id) return;

  await supabase.rpc("create_demo_data", { p_org_id: profile.org_id });
}
