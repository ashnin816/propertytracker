"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Space, Item, InboxDocument } from "@/lib/types";
import { getInboxDocuments, assignInboxDocument, dismissInboxDocument, getItemsForSpace } from "@/lib/supabase-storage";
import { authFetch } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import DocTypeIcon from "./DocTypeIcon";

interface InboxPanelProps {
  spaces: Space[];
  onAssigned?: () => void;
}

export default function InboxPanel({ spaces, onAssigned }: InboxPanelProps) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<InboxDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign picker
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [spaceItems, setSpaceItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dismiss
  const [dismissId, setDismissId] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);

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
      setDocs(Array.isArray(data) ? data.map(mapDoc) : []);
    }
    setLoading(false);
  }

  async function handleSpaceSelect(spaceId: string) {
    setSelectedSpaceId(spaceId);
    setSelectedItemId("");
    setSpaceItems([]);
    if (spaceId) {
      setLoadingItems(true);
      const items = await getItemsForSpace(spaceId);
      setSpaceItems(items);
      setLoadingItems(false);
    }
  }

  async function handleAssign(docId: string) {
    if (!selectedItemId) return;
    setSaving(true);
    await assignInboxDocument(docId, selectedItemId);
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    setAssigningId(null);
    setSelectedSpaceId("");
    setSelectedItemId("");
    setSaving(false);
    onAssigned?.();
  }

  async function handleAcceptSuggestion(doc: InboxDocument) {
    if (!doc.suggestedItemId) return;
    setSaving(true);
    await assignInboxDocument(doc.id, doc.suggestedItemId);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setSaving(false);
    onAssigned?.();
  }

  async function handleDismiss() {
    if (!dismissId) return;
    setDismissing(true);
    await dismissInboxDocument(dismissId);
    setDocs((prev) => prev.filter((d) => d.id !== dismissId));
    setDismissId(null);
    setDismissing(false);
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
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {docs.length} document{docs.length !== 1 ? "s" : ""} waiting to be assigned
          </p>
        </div>

        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-lg font-semibold dark:text-white mb-1">Inbox is empty</p>
            <p className="text-sm text-gray-400">Documents emailed to <strong>docs@inbound.propertytrackerplus.com</strong> will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                {/* Document info */}
                <div className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <DocTypeIcon fileType={doc.fileType} fileName={doc.fileName} className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold dark:text-white truncate">{doc.fileName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      From {doc.senderName || doc.senderEmail} · {timeAgo(doc.createdAt)}
                    </p>
                    {doc.subject && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">Subject: {doc.subject}</p>
                    )}
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer flex-shrink-0"
                    title="Preview">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {/* AI suggestion */}
                {doc.suggestedSpaceName && doc.suggestedItemName && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                          <span className="font-medium">AI suggests:</span> {doc.suggestedSpaceName} → {doc.suggestedItemName}
                        </p>
                      </div>
                      <button onClick={() => handleAcceptSuggestion(doc)}
                        disabled={saving}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer flex-shrink-0 ml-2">
                        Accept
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  {assigningId === doc.id ? (
                    <div className="flex-1 flex flex-wrap items-end gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Property</label>
                        <select value={selectedSpaceId} onChange={(e) => handleSpaceSelect(e.target.value)}
                          className="appearance-none bg-white dark:bg-[#0c1222] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]">
                          <option value="">Select...</option>
                          {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Asset</label>
                        {loadingItems ? (
                          <div className="px-3 py-1.5 text-xs text-gray-400">Loading...</div>
                        ) : (
                          <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}
                            disabled={!selectedSpaceId || spaceItems.length === 0}
                            className="appearance-none bg-white dark:bg-[#0c1222] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] disabled:opacity-50">
                            <option value="">{!selectedSpaceId ? "Select property first" : spaceItems.length === 0 ? "No assets" : "Select..."}</option>
                            {spaceItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                        )}
                      </div>
                      <button onClick={() => handleAssign(doc.id)}
                        disabled={!selectedItemId || saving}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                        {saving ? "Assigning..." : "Assign"}
                      </button>
                      <button onClick={() => { setAssigningId(null); setSelectedSpaceId(""); setSelectedItemId(""); }}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setAssigningId(doc.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Assign to Property
                      </button>
                      <button onClick={() => setDismissId(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                        title="Dismiss">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dismiss confirmation */}
      {dismissId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setDismissId(null)}>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-sm animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 text-center">
              <h3 className="text-lg font-bold dark:text-white mb-1">Dismiss this document?</h3>
              <p className="text-sm text-gray-400">It will be removed from the inbox. This cannot be undone.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setDismissId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDismiss} disabled={dismissing}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] disabled:opacity-40 transition-all font-medium text-sm cursor-pointer">
                {dismissing ? "Dismissing..." : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
