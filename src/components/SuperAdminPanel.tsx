"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import { signUp } from "@/lib/auth";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  member_count?: number;
  space_count?: number;
}

export default function SuperAdminPanel() {
  const { user, logout } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create tenant form
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrgs();
  }, []);

  async function loadOrgs() {
    const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });

    // Get counts for each org
    const orgsWithCounts = await Promise.all((data || []).map(async (org) => {
      const { count: members } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("org_id", org.id);
      const { count: spaces } = await supabase.from("spaces").select("id", { count: "exact", head: true }).eq("org_id", org.id);
      return { ...org, member_count: members || 0, space_count: spaces || 0 };
    }));

    setOrgs(orgsWithCounts);
    setLoading(false);
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      // 1. Create organization
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data: org, error: orgError } = await supabase.from("organizations")
        .insert({ name: orgName, slug, plan: "trial" })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Create admin user account
      await signUp(adminEmail, adminPassword, adminName, org.id, "org_admin");

      // 3. Refresh list
      await loadOrgs();
      setShowCreate(false);
      setOrgName("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create tenant");
    }

    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0c1222]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a2332] border-b border-gray-200/60 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 text-blue-600">
              <svg viewBox="0 0 48 48" fill="none"><path d="M24 6L4 22h6v18a2 2 0 002 2h24a2 2 0 002-2V22h6L24 6z" fill="currentColor" opacity="0.2"/><path d="M24 6L4 22h6v18a2 2 0 002 2h24a2 2 0 002-2V22h6L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h1 className="font-bold text-base dark:text-white">PropertyTracker Admin</h1>
              <p className="text-[10px] text-gray-400">Super Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{user?.email}</span>
            <button onClick={logout} className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer no-min-size">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Tenants</h2>
            <p className="text-sm text-gray-400">{orgs.length} organization{orgs.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all text-sm font-medium cursor-pointer no-min-size">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Tenant
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-semibold dark:text-white mb-2">No tenants yet</p>
            <p className="text-sm text-gray-400">Create your first tenant to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orgs.map((org) => (
              <div key={org.id} className="card rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold dark:text-white">{org.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{org.member_count} member{org.member_count !== 1 ? "s" : ""}</span>
                    <span className="text-xs text-gray-400">{org.space_count} propert{org.space_count !== 1 ? "ies" : "y"}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full no-min-size ${
                      org.plan === "enterprise" ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" :
                      org.plan === "pro" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}>{org.plan}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(org.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-xl font-bold dark:text-white">Add New Tenant</h2>
              <p className="text-sm text-gray-400 mt-1">Create an organization and its admin account</p>
            </div>

            <form onSubmit={handleCreateTenant} className="px-6 pb-6">
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Organization Name</label>
                <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} required autoFocus
                  placeholder="Acme Property Management"
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Admin Account</p>
                <div className="space-y-3">
                  <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} required
                    placeholder="Admin name"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
                  <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required
                    placeholder="admin@company.com"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required
                    placeholder="Password (min 6 characters)" minLength={6}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs text-red-600 dark:text-red-400">{error}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm no-min-size cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !orgName || !adminName || !adminEmail || !adminPassword}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm no-min-size cursor-pointer">
                  {creating ? "Creating..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
