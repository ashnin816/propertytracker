import { supabase } from "./supabase";

export async function loadDemoData() {
  await supabase.rpc("create_demo_data");
}
