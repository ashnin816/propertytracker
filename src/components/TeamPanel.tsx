"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Space } from "@/lib/types";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  org_id: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Admin",
  manager: "Manager",
  technician: "Technician",
  tenant: "Tenant",
};

const ROLE_COLORS: Record<string, string> = {
  org_admin: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  manager: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  technician: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  tenant: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

interface TeamPanelProps {
  spaces: Space[];
}

export default function TeamPanel({ spaces }: TeamPanelProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Delete
  const [deleteUser, setDeleteUser] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.orgId) loadMembers();
  }, [user?.orgId]);

  async function loadMembers() {
    if (!user?.orgId) return;
    const res = await fetch(`/api/users?org_id=${user.orgId}`);
    const data = await res.json();
    if (Array.isArray(data)) setMembers(data);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role, orgId: user?.orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadMembers();
      setShowAdd(false);
      setName(""); setEmail(""); setPassword(""); setRole("manager");
    } catch (err: unknown) {
      setError((err as Error).message);
    }
    setCreating(false);
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    await fetch(`/api/users?user_id=${deleteUser.id}`, { method: "DELETE" });
    await loadMembers();
    setDeleteUser(null);
    setDeleting(false);
  }

  function getInitials(n: string) {
    return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  if (loading) return null;

  return (
    <>
      {/* Sidebar team section */}
      <div className="px-3 py-2 border-t border-gray-200/60 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Team</span>
          {(user?.role === "org_admin" || user?.role === "super_admin") && (
            <button onClick={() => setShowAdd(true)}
              className="text-xs text-blue-600 font-medium cursor-pointer no-min-size hover:text-blue-700">Invite</button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {members.map((m, i) => (
            <div key={m.id} title={`${m.name} (${ROLE_LABELS[m.role] || m.role})`}
              className={`w-7 h-7 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[9px] font-bold no-min-size cursor-default`}>
              {getInitials(m.name)}
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowAdd(false)}>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-xl font-bold dark:text-white">Add Team Member</h2>
              <p className="text-sm text-gray-400 mt-1">Create an account for a new team member</p>
            </div>

            <form onSubmit={handleAdd} className="px-6 pb-6">
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus
                    placeholder="Jane Smith"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="jane@company.com"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Temporary Password</label>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required
                    placeholder="Min 6 characters" minLength={6}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
                </div>
              </div>

              {/* Role picker */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["manager", "technician", "tenant"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`p-3 rounded-xl text-left transition-all no-min-size cursor-pointer ${
                        role === r ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}>
                      <p className="text-xs font-semibold dark:text-white">{ROLE_LABELS[r]}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {r === "manager" && "Manage properties"}
                        {r === "technician" && "View & upload docs"}
                        {r === "tenant" && "View their unit"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs text-red-600 dark:text-red-400">{error}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm no-min-size cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !name || !email || !password}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm no-min-size cursor-pointer">
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setDeleteUser(null)}>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-sm animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold dark:text-white mb-1">Remove {deleteUser.name}?</h3>
              <p className="text-sm text-gray-400">This will delete their account and remove all access.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setDeleteUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm no-min-size cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] disabled:opacity-40 transition-all font-medium text-sm no-min-size cursor-pointer">
                {deleting ? "Removing..." : "Remove User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
