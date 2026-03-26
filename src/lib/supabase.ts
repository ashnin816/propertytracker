import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authenticated fetch helper — includes the user's JWT in API calls
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Try getSession first, fall back to refreshing
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Session might be expired — try refreshing
    const { data } = await supabase.auth.refreshSession();
    session = data.session;
  }
  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(url, { ...options, headers });
}
