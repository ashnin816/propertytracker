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
  org_admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  technician: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  tenant: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  org_admin: "Full access to all properties and team management",
  manager: "Manage properties, units, and documents",
  technician: "View properties and upload documents",
  tenant: "View assigned unit only",
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
  const [filter, setFilter] = useState<string>("all");

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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const filtered = filter === "all" ? members : members.filter((m) => m.role === filter);
  const roleCounts = members.reduce((acc, m) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {members.length} member{members.length !== 1 ? "s" : ""} in your organization
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-medium text-sm shadow-lg shadow-blue-500/20 cursor-pointer no-min-size">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        </div>

        {/* Role filter pills */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          <button onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all no-min-size cursor-pointer whitespace-nowrap ${
              filter === "all" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}>
            All ({members.length})
          </button>
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            roleCounts[key] ? (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all no-min-size cursor-pointer whitespace-nowrap ${
                  filter === key ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}>
                {label} ({roleCounts[key]})
              </button>
            ) : null
          ))}
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {filtered.map((m, i) => {
            const isCurrentUser = m.id === user?.id;
            const colorIndex = members.indexOf(m);
            return (
              <div key={m.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {getInitials(m.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold dark:text-white truncate">{m.name}</p>
                    {isCurrentUser && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>

                {/* Role badge */}
                <div className="hidden sm:block flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${ROLE_COLORS[m.role] || "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                </div>

                {/* Date */}
                <div className="hidden md:block flex-shrink-0">
                  <p className="text-xs text-gray-400">{formatDate(m.created_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {!isCurrentUser && m.role !== "org_admin" ? (
                    <button onClick={() => setDeleteUser(m)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors no-min-size cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No {filter !== "all" ? ROLE_LABELS[filter]?.toLowerCase() + "s" : "members"} found</p>
          </div>
        )}
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
