"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Space } from "@/lib/types";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
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

const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

interface TeamPanelProps {
  spaces: Space[];
}

export default function TeamPanel({ spaces }: TeamPanelProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

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

  // Status toggle
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

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

  async function handleToggleStatus(member: TeamMember) {
    setTogglingStatus(member.id);
    const newStatus = member.status === "active" ? "inactive" : "active";
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: member.id, status: newStatus }),
    });
    await loadMembers();
    setTogglingStatus(null);
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

  // Filtering
  const filtered = members.filter((m) => {
    const roleMatch = roleFilter === "all" || m.role === roleFilter;
    const statusMatch = statusFilter === "all" || (m.status || "active") === statusFilter;
    return roleMatch && statusMatch;
  });
  const activeCount = members.filter((m) => (m.status || "active") === "active").length;
  const inactiveCount = members.filter((m) => m.status === "inactive").length;
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
              {activeCount} active member{activeCount !== 1 ? "s" : ""}{inactiveCount > 0 ? ` · ${inactiveCount} inactive` : ""}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-medium text-sm shadow-lg shadow-blue-500/20 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {/* Status filters */}
          {(["active", "inactive", "all"] as const).map((s) => {
            const count = s === "all" ? members.length : s === "active" ? activeCount : inactiveCount;
            if (s === "inactive" && inactiveCount === 0 && statusFilter !== "inactive") return null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === s ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}>
                {s === "all" ? "All" : s === "active" ? "Active" : "Inactive"} ({count})
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Role filters */}
          <button onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === "all" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}>
            All Roles
          </button>
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            roleCounts[key] ? (
              <button key={key} onClick={() => setRoleFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  roleFilter === key ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}>
                {label} ({roleCounts[key]})
              </button>
            ) : null
          ))}
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {filtered.map((m) => {
            const isCurrentUser = m.id === user?.id;
            const isInactive = m.status === "inactive";
            const colorIndex = members.indexOf(m);
            const canManage = !isCurrentUser && m.role !== "org_admin";
            return (
              <div key={m.id}
                className={`flex items-center gap-4 p-4 bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors ${
                  isInactive ? "opacity-50" : ""
                }`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${isInactive ? "bg-gray-400" : AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {getInitials(m.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold dark:text-white truncate">{m.name}</p>
                    {isCurrentUser && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">You</span>
                    )}
                    {isInactive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium flex-shrink-0">Inactive</span>
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
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canManage && (
                    <>
                      {/* Deactivate / Reactivate */}
                      <button
                        onClick={() => handleToggleStatus(m)}
                        disabled={togglingStatus === m.id}
                        title={isInactive ? "Reactivate user" : "Deactivate user"}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          isInactive
                            ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        } ${togglingStatus === m.id ? "opacity-50" : ""}`}>
                        {isInactive ? (
                          // Play icon (reactivate)
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          // Pause icon (deactivate)
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>

                      {/* Delete (secondary) */}
                      <button onClick={() => setDeleteUser(m)}
                        title="Permanently delete"
                        className="p-2 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                  {!canManage && <div className="w-16" />}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No members match the current filters</p>
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
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="jane@company.com"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Temporary Password</label>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required
                    placeholder="Min 6 characters" minLength={6}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Role picker */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["manager", "technician", "tenant"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
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
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !name || !email || !password}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm cursor-pointer">
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
              <h3 className="text-lg font-bold dark:text-white mb-1">Permanently delete {deleteUser.name}?</h3>
              <p className="text-sm text-gray-400">This cannot be undone. Their account and all access will be permanently removed.</p>
              <p className="text-xs text-gray-400 mt-2">Consider deactivating instead if you may need to restore access later.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setDeleteUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] disabled:opacity-40 transition-all font-medium text-sm cursor-pointer">
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
