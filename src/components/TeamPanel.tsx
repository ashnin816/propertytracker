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

type SortKey = "name" | "email" | "role" | "status" | "created_at";
type SortDir = "asc" | "desc";

interface TeamPanelProps {
  spaces: Space[];
}

export default function TeamPanel({ spaces }: TeamPanelProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  // Assignments
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [memberAssignments, setMemberAssignments] = useState<Record<string, boolean>>({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState<string | null>(null);

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

  async function handleExpandMember(memberId: string) {
    if (expandedMember === memberId) { setExpandedMember(null); return; }
    setExpandedMember(memberId);
    setLoadingAssignments(true);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_assignments", userId: memberId }),
    });
    const data = await res.json();
    const map: Record<string, boolean> = {};
    if (Array.isArray(data)) { for (const a of data) map[a.space_id] = true; }
    setMemberAssignments(map);
    setLoadingAssignments(false);
  }

  async function handleToggleAssignment(memberId: string, spaceId: string, assigned: boolean) {
    setSavingAssignment(spaceId);
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: assigned ? "unassign" : "assign", userId: memberId, spaceId }),
    });
    setMemberAssignments((prev) => ({ ...prev, [spaceId]: !assigned }));
    setSavingAssignment(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Filter + sort
  const inactiveCount = members.filter((m) => m.status === "inactive").length;
  const filtered = members
    .filter((m) => statusFilter === "all" || (m.status || "active") === statusFilter)
    .sort((a, b) => {
      let aVal = a[sortKey] || "";
      let bVal = b[sortKey] || "";
      if (sortKey === "role") { aVal = ROLE_LABELS[aVal] || aVal; bVal = ROLE_LABELS[bVal] || bVal; }
      if (sortKey === "status") { aVal = aVal || "active"; bVal = bVal || "active"; }
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <svg className="w-3 h-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    return sortDir === "asc"
      ? <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
  }

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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            </p>
            {inactiveCount > 0 && (
              <button onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === "all" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}>
                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                  statusFilter === "all" ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {statusFilter === "all" && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                Show inactive ({inactiveCount})
              </button>
            )}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-medium text-sm shadow-lg shadow-blue-500/20 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] sm:grid-cols-[1fr_1.2fr_90px_80px_auto] items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
            <button onClick={() => handleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Name <SortIcon col="name" />
            </button>
            <button onClick={() => handleSort("email")} className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Email <SortIcon col="email" />
            </button>
            <button onClick={() => handleSort("role")} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Role <SortIcon col="role" />
            </button>
            <button onClick={() => handleSort("status")} className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Status <SortIcon col="status" />
            </button>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
              Actions
            </div>
          </div>

          {/* Table rows */}
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-gray-400">No members found</p>
            </div>
          ) : (
            <div>
              {filtered.map((m) => {
                const isCurrentUser = m.id === user?.id;
                const isInactive = m.status === "inactive";
                const canManage = !isCurrentUser && m.role !== "org_admin";
                const canAssign = canManage;
                const isExpanded = expandedMember === m.id;
                return (
                  <div key={m.id} className={isInactive ? "opacity-60" : ""}>
                    <div className={`grid grid-cols-[1fr_1fr_auto_auto_auto] sm:grid-cols-[1fr_1.2fr_90px_80px_auto] items-center gap-2 px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${canAssign ? "cursor-pointer" : ""}`}
                      onClick={() => canAssign && handleExpandMember(m.id)}>
                      {/* Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium dark:text-white truncate">{m.name}</p>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">You</span>
                        )}
                      </div>

                      {/* Email */}
                      <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 truncate">{m.email}</p>

                      {/* Role */}
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md w-fit ${ROLE_COLORS[m.role] || "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[m.role] || m.role}
                      </span>

                      {/* Status */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isInactive ? "bg-red-400" : "bg-emerald-400"}`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{isInactive ? "Inactive" : "Active"}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 flex-nowrap" onClick={(e) => e.stopPropagation()}>
                        {canAssign && (
                          <button onClick={() => handleExpandMember(m.id)} className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            isExpanded ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" : "text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          }`}>
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Access
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => handleToggleStatus(m)}
                            disabled={togglingStatus === m.id}
                            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                              togglingStatus === m.id ? "opacity-50" : ""
                            } ${isInactive
                              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}>
                            {isInactive ? "Activate" : "Deactivate"}
                          </button>
                        )}
                        {canManage && (
                          <button onClick={() => setDeleteUser(m)}
                            title="Delete"
                            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded: Property assignments */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Property Access</p>
                        {loadingAssignments ? (
                          <div className="flex items-center gap-2 py-1">
                            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-400">Loading...</span>
                          </div>
                        ) : spaces.length === 0 ? (
                          <p className="text-xs text-gray-400">No properties yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {spaces.map((space) => {
                              const assigned = memberAssignments[space.id] || false;
                              const saving = savingAssignment === space.id;
                              return (
                                <button key={space.id}
                                  onClick={() => handleToggleAssignment(m.id, space.id, assigned)}
                                  disabled={saving}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    assigned
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-600"
                                  } ${saving ? "opacity-50" : ""}`}>
                                  {space.name}
                                  {assigned && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {!loadingAssignments && Object.values(memberAssignments).filter(Boolean).length === 0 && spaces.length > 0 && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">No properties assigned — this user won&apos;t see any data</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
