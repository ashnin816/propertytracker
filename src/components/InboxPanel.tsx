"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Space, Unit, Item, InboxDocument } from "@/lib/types";
import { getItemsForSpace, getItemsForUnit } from "@/lib/supabase-storage";
import { hasUnits } from "@/lib/presets";
import { authFetch } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import DocTypeIcon from "./DocTypeIcon";

interface InboxPanelProps {
  spaces: Space[];
  onAssigned?: () => void;
}

interface DocAssignment {
  spaceId: string;
  unitId: string;
  itemId: string;
  units: Unit[];
  items: Item[];
  loadingUnits: boolean;
  loadingItems: boolean;
  isUnitBased: boolean;
  name: string;
  editingName: boolean;
}

export default function InboxPanel({ spaces, onAssigned }: InboxPanelProps) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<InboxDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, DocAssignment>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<InboxDocument | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.orgId) loadDocs();
  }, [user?.orgId]);

  function mapDoc(r: Record<string, unknown>): InboxDocument {
    const space = r.spaces as Record<string, unknown> | null;
    const item = r.items as Record<string, unknown> | null;
    return {
      id: r.id as string, orgId: r.org_id as string,
      senderEmail: r.sender_email as string, senderName: r.sender_name as string | null,
      subject: r.subject as string | null, fileName: r.file_name as string,
      fileUrl: r.file_url as string, fileType: r.file_type as string,
      extractedText: r.extracted_text as string | null,
      suggestedSpaceId: r.suggested_space_id as string | null,
      suggestedItemId: r.suggested_item_id as string | null,
      suggestedMatchReason: r.suggested_match_reason as string | null,
      suggestedSpaceName: space?.name as string | undefined,
      suggestedItemName: item?.name as string | undefined,
      status: r.status as InboxDocument["status"],
      createdAt: r.created_at as string,
    };
  }

  async function loadDocs() {
    if (!user?.orgId) return;
    const res = await authFetch(`/api/inbox?org_id=${user.orgId}`);
    if (res.ok) {
      const data = await res.json();
      const mapped = Array.isArray(data) ? data.map(mapDoc) : [];
      setDocs(mapped);
      // Pre-fill assignments from AI suggestions
      const emptyAssignment = (name: string): DocAssignment => ({ spaceId: "", unitId: "", itemId: "", units: [], items: [], loadingUnits: false, loadingItems: false, isUnitBased: false, name, editingName: false });
      const newAssignments: Record<string, DocAssignment> = {};
      for (const doc of mapped) {
        if (doc.suggestedSpaceId) {
          const space = spaces.find((s) => s.id === doc.suggestedSpaceId);
          const unitBased = space ? hasUnits(space.icon) : false;
          const items = await getItemsForSpace(doc.suggestedSpaceId);
          newAssignments[doc.id] = {
            spaceId: doc.suggestedSpaceId,
            unitId: "",
            itemId: doc.suggestedItemId || "",
            units: [],
            items: unitBased ? [] : items,
            loadingUnits: false,
            loadingItems: false,
            isUnitBased: unitBased,
            name: doc.fileName,
            editingName: false,
          };
          // Load units if unit-based property
          if (unitBased) {
            const unitsRes = await authFetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_units", spaceId: doc.suggestedSpaceId }) });
            const unitsData = await unitsRes.json();
            const units: Unit[] = Array.isArray(unitsData) ? unitsData.map((u: Record<string, string>) => ({ id: u.id, spaceId: u.space_id, name: u.name, createdAt: "" })) : [];
            newAssignments[doc.id].units = units;
          }
        } else {
          newAssignments[doc.id] = emptyAssignment(doc.fileName);
        }
      }
      setAssignments(newAssignments);
    }
    setLoading(false);
  }

  function getAssignment(doc: InboxDocument): DocAssignment {
    return assignments[doc.id] || { spaceId: "", unitId: "", itemId: "", units: [], items: [], loadingUnits: false, loadingItems: false, isUnitBased: false, name: doc.fileName, editingName: false };
  }

  async function handleSpaceChange(docId: string, spaceId: string) {
    const space = spaces.find((s) => s.id === spaceId);
    const unitBased = space ? hasUnits(space.icon) : false;
    setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], spaceId, unitId: "", itemId: "", units: [], items: [], isUnitBased: unitBased, loadingUnits: unitBased, loadingItems: !unitBased } }));
    if (!spaceId) {
      setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], spaceId: "", unitId: "", itemId: "", units: [], items: [], isUnitBased: false, loadingUnits: false, loadingItems: false } }));
      return;
    }
    if (unitBased) {
      // Fetch units via API (bypasses RLS)
      const res = await authFetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_units", spaceId }) });
      const data = await res.json();
      const units: Unit[] = Array.isArray(data) ? data.map((u: Record<string, string>) => ({ id: u.id, spaceId: u.space_id, name: u.name, createdAt: "" })) : [];
      setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], units, loadingUnits: false } }));
    } else {
      const items = await getItemsForSpace(spaceId);
      setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], items, loadingItems: false } }));
    }
  }

  async function handleUnitChange(docId: string, unitId: string) {
    setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], unitId, itemId: "", items: [], loadingItems: true } }));
    if (unitId) {
      const items = await getItemsForUnit(unitId);
      setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], items, loadingItems: false } }));
    } else {
      setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], unitId: "", itemId: "", items: [], loadingItems: false } }));
    }
  }

  function handleItemChange(docId: string, itemId: string) {
    setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], itemId } }));
  }

  function handleNameChange(docId: string, name: string) {
    setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], name } }));
  }

  function toggleEditName(docId: string) {
    setAssignments((prev) => ({ ...prev, [docId]: { ...prev[docId], editingName: !prev[docId]?.editingName } }));
  }

  async function handleAssign(docId: string) {
    const a = getAssignment(docs.find((d) => d.id === docId)!);
    if (!a.itemId) return;
    setSavingId(docId);
    await authFetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inboxDocId: docId, itemId: a.itemId, name: a.name }),
    });
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    setSavingId(null);
    onAssigned?.();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await authFetch(`/api/inbox?id=${deleteId}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
    onAssigned?.();
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {docs.length} document{docs.length !== 1 ? "s" : ""} waiting to be assigned
          </p>
          {user?.orgSlug && (
            <button onClick={() => { navigator.clipboard.writeText(`${user.orgSlug}@inbound.propertytrackerplus.com`); }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="Click to copy">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Send docs to:</span>
              <span className="font-semibold">{user.orgSlug}@inbound.propertytrackerplus.com</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>

        {/* Empty state */}
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-lg font-semibold dark:text-white mb-2">Inbox is empty</p>
            <p className="text-sm text-gray-400 text-center max-w-sm">
              Email documents to <strong className="text-gray-600 dark:text-gray-300">{user?.orgSlug || "your-org"}@inbound.propertytrackerplus.com</strong> and they&apos;ll appear here for assignment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {docs.map((doc) => {
              const a = getAssignment(doc);
              const isSaving = savingId === doc.id;
              const hasFullMatch = !!(doc.suggestedSpaceId && doc.suggestedItemId);
              const hasPartialMatch = !!(doc.suggestedSpaceId && !doc.suggestedItemId);
              const hasAiSuggestion = hasFullMatch || hasPartialMatch;
              const isAnalyzing = !doc.extractedText && !doc.suggestedMatchReason && (doc.fileType.startsWith("image/") || doc.fileType === "application/pdf");
              const aiProcessed = !!(doc.extractedText || doc.suggestedMatchReason);
              // Name is AI-generated if AI processed and name doesn't look like a raw filename
              // Raw filenames end with common extensions like .pdf, .jpg, .png, .doc, etc.
              const commonExtensions = /\.(pdf|jpg|jpeg|png|gif|doc|docx|xls|xlsx|csv|txt|heic|webp|bmp|tiff?)$/i;
              const aiNamed = aiProcessed && !commonExtensions.test(doc.fileName);
              const noMatch = aiProcessed && !hasAiSuggestion;

              return (
                <div key={doc.id} className="bg-white dark:bg-[#1a2332] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Document info */}
                  <div className="flex items-start gap-3 p-4 pb-3">
                    <button onClick={() => setPreviewDoc(doc)}
                      className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <DocTypeIcon fileType={doc.fileType} fileName={doc.fileName} className="w-6 h-6 text-gray-500" />
                    </button>
                    <div className="min-w-0 flex-1">
                      {a.editingName ? (
                        <div className="flex items-center gap-2">
                          <input type="text" value={a.name} onChange={(e) => handleNameChange(doc.id, e.target.value)}
                            onBlur={() => toggleEditName(doc.id)}
                            onKeyDown={(e) => { if (e.key === "Enter") toggleEditName(doc.id); }}
                            autoFocus
                            className="text-sm font-semibold dark:text-white bg-transparent border-b-2 border-blue-500 outline-none flex-1 py-0.5" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <button onClick={() => setPreviewDoc(doc)}
                            className="text-sm font-semibold dark:text-white text-left cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {a.name}
                          </button>
                          <button onClick={() => toggleEditName(doc.id)}
                            className="p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                            title="Edit name">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.senderName || doc.senderEmail} · {timeAgo(doc.createdAt)}
                        {doc.subject && <span> · {doc.subject}</span>}
                      </p>
                    </div>
                    <button onClick={() => setDeleteId(doc.id)} title="Delete"
                      className="w-8 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Subtle AI hint — one line above the dropdowns */}
                  {isAnalyzing && (
                    <div className="mx-4 mb-2 flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span className="text-[11px] font-medium text-violet-600 dark:text-violet-400">AI is reading this document...</span>
                    </div>
                  )}
                  {hasAiSuggestion && !isAnalyzing && (
                    <div className="mx-4 mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        <span className="font-semibold">AI suggested</span>{" "}
                        {doc.suggestedSpaceName}{doc.suggestedItemName ? ` → ${doc.suggestedItemName}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Assignment controls */}
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap items-end gap-2">
                      {/* Property */}
                      <div className="flex-1 min-w-[130px]">
                        <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Property</label>
                        <select value={a.spaceId} onChange={(e) => handleSpaceChange(doc.id, e.target.value)}
                          className={`w-full appearance-none border rounded-lg px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
                            hasAiSuggestion && a.spaceId === doc.suggestedSpaceId
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-200"
                              : "bg-gray-50 dark:bg-[#0c1222] border-gray-200 dark:border-gray-700 dark:text-gray-200"
                          }`}>
                          <option value="">Select property...</option>
                          {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      {/* Unit (only for unit-based properties) */}
                      {a.isUnitBased && (
                        <div className="flex-1 min-w-[130px]">
                          <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Unit</label>
                          {a.loadingUnits ? (
                            <div className="flex items-center gap-2 h-[38px] px-3 text-xs text-gray-400">
                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            <select value={a.unitId} onChange={(e) => handleUnitChange(doc.id, e.target.value)}
                              disabled={!a.spaceId || a.units.length === 0}
                              className="w-full appearance-none bg-gray-50 dark:bg-[#0c1222] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-40 transition-shadow">
                              <option value="">{!a.spaceId ? "Select property first" : a.units.length === 0 ? "No units" : "Select unit..."}</option>
                              {a.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                          )}
                        </div>
                      )}

                      {/* Asset */}
                      <div className="flex-1 min-w-[130px]">
                        <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Asset</label>
                        {a.loadingItems ? (
                          <div className="flex items-center gap-2 h-[38px] px-3 text-xs text-gray-400">
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </div>
                        ) : (
                          <select value={a.itemId} onChange={(e) => handleItemChange(doc.id, e.target.value)}
                            disabled={(!a.spaceId || (a.isUnitBased && !a.unitId)) || a.items.length === 0}
                            className={`w-full appearance-none border rounded-lg px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-40 transition-shadow ${
                              hasAiSuggestion && a.itemId === doc.suggestedItemId
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-200"
                                : "bg-gray-50 dark:bg-[#0c1222] border-gray-200 dark:border-gray-700 dark:text-gray-200"
                            }`}>
                            <option value="">
                              {!a.spaceId ? "Select property first" : a.isUnitBased && !a.unitId ? "Select unit first" : a.items.length === 0 ? "No assets" : "Select asset..."}
                            </option>
                            {a.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                        )}
                      </div>

                      <button onClick={() => handleAssign(doc.id)}
                        disabled={!a.itemId || isSaving}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-blue-500/20">
                        {isSaving ? "Assigning..." : "Assign"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setDeleteId(null)}>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-sm animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold dark:text-white mb-1">Delete this document?</h3>
              <p className="text-sm text-gray-400">This will permanently remove the document from your inbox.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] disabled:opacity-40 transition-all font-medium text-sm cursor-pointer">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 sm:p-10 animate-fade-in" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="min-w-0 flex-1 mr-4">
                <p className="text-sm font-semibold dark:text-white truncate">{previewDoc.fileName}</p>
                <p className="text-xs text-gray-400 mt-0.5">From {previewDoc.senderName || previewDoc.senderEmail} · {timeAgo(previewDoc.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={previewDoc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </a>
                <button onClick={() => setPreviewDoc(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
              {previewDoc.fileType.startsWith("image/") ? (
                <div className="flex items-center justify-center p-6 min-h-[300px]">
                  <img src={previewDoc.fileUrl} alt={previewDoc.fileName} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm" />
                </div>
              ) : previewDoc.fileType === "application/pdf" ? (
                <iframe src={previewDoc.fileUrl} className="w-full h-[75vh] border-0" title={previewDoc.fileName} />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 gap-4">
                  <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-400">Preview not available for this file type</p>
                  <a href={previewDoc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-medium text-sm cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
