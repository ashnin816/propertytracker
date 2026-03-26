import { supabase } from "./supabase";
import { Space, Unit, Item, Document, InboxDocument } from "./types";
import { UserAssignment } from "./auth";

// Helper to convert Supabase snake_case to our camelCase
function toSpace(row: Record<string, unknown>): Space {
  return { id: row.id as string, name: row.name as string, icon: row.icon as string, createdAt: row.created_at as string };
}
function toUnit(row: Record<string, unknown>): Unit {
  return { id: row.id as string, spaceId: row.space_id as string, name: row.name as string, createdAt: row.created_at as string };
}
function toItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string, spaceId: row.space_id as string, unitId: row.unit_id as string | undefined,
    name: row.name as string, icon: row.icon as string, photoUrl: row.photo_url as string | null,
    createdAt: row.created_at as string,
  };
}
function toDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string, itemId: row.item_id as string, name: row.name as string,
    fileUrl: row.file_url as string, fileType: row.file_type as string,
    extractedText: row.extracted_text as string | undefined,
    ocrStatus: row.ocr_status as Document["ocrStatus"],
    createdAt: row.created_at as string,
  };
}

// --- Spaces ---
export async function getAllSpaces(orgId?: string, assignments?: UserAssignment[]): Promise<Space[]> {
  let query = supabase.from("spaces").select("*").order("created_at", { ascending: false });
  if (orgId) query = query.eq("org_id", orgId);
  if (assignments !== undefined) {
    if (assignments.length === 0) return [];
    const spaceIds = [...new Set(assignments.map((a) => a.spaceId))];
    query = query.in("id", spaceIds);
  }
  const { data } = await query;
  return (data || []).map(toSpace);
}

export async function getSpace(id: string): Promise<Space | undefined> {
  const { data } = await supabase.from("spaces").select("*").eq("id", id).single();
  return data ? toSpace(data) : undefined;
}

export async function createSpace(name: string, icon: string): Promise<Space> {
  // Get current user's org_id
  const { data: { user } } = await supabase.auth.getUser();
  let orgId = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    orgId = profile?.org_id;
  }
  const { data } = await supabase.from("spaces").insert({ name, icon, org_id: orgId }).select().single();
  return toSpace(data!);
}

export async function updateSpace(id: string, updates: Partial<Pick<Space, "name" | "icon">>) {
  await supabase.from("spaces").update(updates).eq("id", id);
}

export async function deleteSpace(id: string) {
  await supabase.from("spaces").delete().eq("id", id);
}

// --- Units ---
export async function getUnitsForSpace(spaceId: string, assignments?: UserAssignment[]): Promise<Unit[]> {
  let query = supabase.from("units").select("*").eq("space_id", spaceId).order("name");
  // For users with unit-level assignments, filter to only their assigned units
  if (assignments !== undefined) {
    const unitIds = assignments.filter((a) => a.spaceId === spaceId && a.unitId).map((a) => a.unitId!);
    if (unitIds.length > 0) {
      query = query.in("id", unitIds);
    }
    // If no unit-level assignments for this space, they have property-level access → see all units
  }
  const { data } = await query;
  return (data || []).map(toUnit);
}

export async function getUnit(id: string): Promise<Unit | undefined> {
  const { data } = await supabase.from("units").select("*").eq("id", id).single();
  return data ? toUnit(data) : undefined;
}

export async function createUnit(spaceId: string, name: string): Promise<Unit> {
  const { data } = await supabase.from("units").insert({ space_id: spaceId, name }).select().single();
  return toUnit(data!);
}

export async function updateUnit(id: string, updates: Partial<Pick<Unit, "name">>) {
  await supabase.from("units").update(updates).eq("id", id);
}

export async function deleteUnit(id: string) {
  await supabase.from("units").delete().eq("id", id);
}

export async function getUnitCountForSpace(spaceId: string): Promise<number> {
  const { count } = await supabase.from("units").select("id", { count: "exact", head: true }).eq("space_id", spaceId);
  return count || 0;
}

// --- Items ---
export async function getItemsForSpace(spaceId: string): Promise<Item[]> {
  const { data } = await supabase.from("items").select("*").eq("space_id", spaceId).order("name");
  return (data || []).map(toItem);
}

export async function getItemsForUnit(unitId: string): Promise<Item[]> {
  const { data } = await supabase.from("items").select("*").eq("unit_id", unitId).order("name");
  return (data || []).map(toItem);
}

export async function getItem(id: string): Promise<Item | undefined> {
  const { data } = await supabase.from("items").select("*").eq("id", id).single();
  return data ? toItem(data) : undefined;
}

export async function createItem(spaceId: string, name: string, icon: string, photoUrl: string | null, unitId?: string): Promise<Item> {
  const { data } = await supabase.from("items").insert({
    space_id: spaceId, name, icon, photo_url: photoUrl, unit_id: unitId || null,
  }).select().single();
  return toItem(data!);
}

export async function updateItem(id: string, updates: Partial<Pick<Item, "name" | "photoUrl">>) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
  await supabase.from("items").update(dbUpdates).eq("id", id);
}

export async function deleteItem(id: string) {
  await supabase.from("items").delete().eq("id", id);
}

export async function getItemCountForSpace(spaceId: string): Promise<number> {
  const { count } = await supabase.from("items").select("id", { count: "exact", head: true }).eq("space_id", spaceId);
  return count || 0;
}

export async function getDocumentCountForItem(itemId: string): Promise<number> {
  const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("item_id", itemId);
  return count || 0;
}

export async function getDocumentCountsForItems(itemIds: string[]): Promise<Record<string, number>> {
  if (itemIds.length === 0) return {};
  const { data } = await supabase.from("documents").select("item_id").in("item_id", itemIds);
  const counts: Record<string, number> = {};
  for (const id of itemIds) counts[id] = 0;
  for (const row of data || []) counts[row.item_id] = (counts[row.item_id] || 0) + 1;
  return counts;
}

// --- Documents ---
export async function getDocumentsForItem(itemId: string): Promise<Document[]> {
  const { data } = await supabase.from("documents").select("*").eq("item_id", itemId).order("created_at", { ascending: false });
  return (data || []).map(toDocument);
}

export async function getDocument(id: string): Promise<Document | undefined> {
  const { data } = await supabase.from("documents").select("*").eq("id", id).single();
  return data ? toDocument(data) : undefined;
}

export async function addDocument(itemId: string, name: string, fileUrl: string, fileType: string): Promise<Document> {
  // Upload file to Supabase Storage if it's a data URL
  let storedUrl = fileUrl;
  if (fileUrl.startsWith("data:")) {
    const fileName = `${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const base64 = fileUrl.split(",")[1];
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const { data: uploadData } = await supabase.storage.from("documents").upload(fileName, bytes, {
      contentType: fileType,
      upsert: false,
    });

    if (uploadData) {
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(uploadData.path);
      storedUrl = urlData.publicUrl;
    }
  }

  const { data } = await supabase.from("documents").insert({
    item_id: itemId, name, file_url: storedUrl, file_type: fileType,
  }).select().single();
  return toDocument(data!);
}

export async function updateDocument(id: string, updates: Partial<Pick<Document, "name" | "extractedText" | "ocrStatus">>) {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.extractedText !== undefined) dbUpdates.extracted_text = updates.extractedText;
  if (updates.ocrStatus !== undefined) dbUpdates.ocr_status = updates.ocrStatus;
  await supabase.from("documents").update(dbUpdates).eq("id", id);
}

export async function deleteDocument(id: string) {
  await supabase.from("documents").delete().eq("id", id);
}

// --- Search ---
export interface SearchResult {
  type: "space" | "item" | "document";
  id: string;
  name: string;
  spaceId?: string;
  spaceName?: string;
  itemId?: string;
  itemName?: string;
  icon?: string;
  matchContext?: string;
}

export async function globalSearch(query: string, assignments?: UserAssignment[]): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  if (assignments !== undefined && assignments.length === 0) return [];
  const q = `%${query}%`;
  const spaceIds = assignments ? [...new Set(assignments.map((a) => a.spaceId))] : undefined;
  const results: SearchResult[] = [];

  // Search spaces
  let spaceQuery = supabase.from("spaces").select("*").ilike("name", q).limit(3);
  if (spaceIds) spaceQuery = spaceQuery.in("id", spaceIds);
  const { data: spaces } = await spaceQuery;
  for (const s of spaces || []) {
    results.push({ type: "space", id: s.id, name: s.name, icon: s.icon });
  }

  // Search items
  let itemQuery = supabase.from("items").select("*, spaces!inner(name)").ilike("name", q).limit(3);
  if (spaceIds) itemQuery = itemQuery.in("space_id", spaceIds);
  const { data: items } = await itemQuery;
  for (const i of items || []) {
    results.push({
      type: "item", id: i.id, name: i.name, spaceId: i.space_id,
      spaceName: (i as Record<string, unknown>).spaces ? ((i as Record<string, unknown>).spaces as Record<string, unknown>).name as string : undefined,
      icon: i.icon,
    });
  }

  // Search documents (name and extracted text)
  let docQuery = supabase.from("documents")
    .select("*, items!inner(name, space_id, spaces!inner(name))")
    .or(`name.ilike.${q},extracted_text.ilike.${q}`)
    .limit(4);
  if (spaceIds) docQuery = docQuery.in("items.space_id", spaceIds);
  const { data: docs } = await docQuery;

  for (const d of docs || []) {
    const item = (d as Record<string, unknown>).items as Record<string, unknown> | undefined;
    const space = item?.spaces as Record<string, unknown> | undefined;

    let matchContext: string | undefined;
    if (d.extracted_text?.toLowerCase().includes(query.toLowerCase())) {
      const idx = d.extracted_text.toLowerCase().indexOf(query.toLowerCase());
      const start = Math.max(0, idx - 30);
      const end = Math.min(d.extracted_text.length, idx + query.length + 30);
      matchContext = (start > 0 ? "..." : "") + d.extracted_text.slice(start, end).trim() + (end < d.extracted_text.length ? "..." : "");
    }

    results.push({
      type: "document", id: d.id, name: d.name,
      itemId: d.item_id, itemName: item?.name as string,
      spaceName: space?.name as string,
      matchContext,
    });
  }

  return results.slice(0, 10);
}

// --- Aggregates ---
export async function getDocumentCountForSpace(spaceId: string): Promise<number> {
  const { data: items } = await supabase.from("items").select("id").eq("space_id", spaceId);
  if (!items || items.length === 0) return 0;
  const itemIds = items.map((i) => i.id);
  const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).in("item_id", itemIds);
  return count || 0;
}

export async function getAllDocumentsWithContext(assignments?: UserAssignment[]): Promise<{
  id: string; itemId: string; spaceId: string; name: string; spaceName: string; itemName: string; text: string;
}[]> {
  if (assignments !== undefined && assignments.length === 0) return [];
  const spaceIds = assignments ? [...new Set(assignments.map((a) => a.spaceId))] : undefined;
  let query = supabase.from("documents")
    .select("*, items!inner(name, space_id, spaces!inner(name))")
    .not("extracted_text", "is", null);
  if (spaceIds) query = query.in("items.space_id", spaceIds);
  const { data } = await query;

  return (data || []).map((d) => {
    const item = (d as Record<string, unknown>).items as Record<string, unknown>;
    const space = item?.spaces as Record<string, unknown>;
    return {
      id: d.id, itemId: d.item_id, spaceId: item?.space_id as string,
      name: d.name, spaceName: space?.name as string || "Unknown",
      itemName: item?.name as string || "Unknown", text: d.extracted_text || "",
    };
  });
}

// --- Recent Activity ---
export async function getRecentActivity(limit = 8, assignments?: UserAssignment[]): Promise<{
  type: "item" | "document"; id: string; name: string; itemId?: string; itemName?: string;
  spaceId: string; spaceName: string; createdAt: string;
}[]> {
  if (assignments !== undefined && assignments.length === 0) return [];
  const spaceIds = assignments ? [...new Set(assignments.map((a) => a.spaceId))] : undefined;

  const activity: Awaited<ReturnType<typeof getRecentActivity>> = [];

  let itemQuery = supabase.from("items")
    .select("*, spaces!inner(name)")
    .order("created_at", { ascending: false }).limit(limit);
  if (spaceIds) itemQuery = itemQuery.in("space_id", spaceIds);
  const { data: items } = await itemQuery;

  for (const i of items || []) {
    const space = (i as Record<string, unknown>).spaces as Record<string, unknown>;
    activity.push({
      type: "item", id: i.id, name: i.name, spaceId: i.space_id,
      spaceName: space?.name as string, createdAt: i.created_at,
    });
  }

  let docQuery = supabase.from("documents")
    .select("*, items!inner(name, space_id, spaces!inner(name))")
    .order("created_at", { ascending: false }).limit(limit);
  if (spaceIds) docQuery = docQuery.in("items.space_id", spaceIds);
  const { data: docs } = await docQuery;

  for (const d of docs || []) {
    const item = (d as Record<string, unknown>).items as Record<string, unknown>;
    const space = item?.spaces as Record<string, unknown>;
    activity.push({
      type: "document", id: d.id, name: d.name, itemId: d.item_id,
      itemName: item?.name as string, spaceId: item?.space_id as string,
      spaceName: space?.name as string, createdAt: d.created_at,
    });
  }

  return activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

// --- Inbox ---
function toInboxDocument(row: Record<string, unknown>): InboxDocument {
  const space = row.spaces as Record<string, unknown> | null;
  const item = row.items as Record<string, unknown> | null;
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    senderEmail: row.sender_email as string,
    senderName: row.sender_name as string | null,
    subject: row.subject as string | null,
    fileName: row.file_name as string,
    fileUrl: row.file_url as string,
    fileType: row.file_type as string,
    extractedText: row.extracted_text as string | null,
    suggestedSpaceId: row.suggested_space_id as string | null,
    suggestedItemId: row.suggested_item_id as string | null,
    suggestedMatchReason: row.suggested_match_reason as string | null,
    suggestedSpaceName: space?.name as string | undefined,
    suggestedItemName: item?.name as string | undefined,
    status: row.status as InboxDocument["status"],
    createdAt: row.created_at as string,
  };
}

export async function getInboxDocuments(orgId: string): Promise<InboxDocument[]> {
  const { data } = await supabase.from("inbox_documents")
    .select("*, spaces(name), items(name)")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data || []).map((r) => toInboxDocument(r as Record<string, unknown>));
}

export async function getInboxCount(orgId: string): Promise<number> {
  const { count } = await supabase.from("inbox_documents")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "pending");
  return count || 0;
}

export async function assignInboxDocument(inboxDocId: string, itemId: string): Promise<void> {
  const admin = supabase;
  // Get the inbox document
  const { data: inbox } = await admin.from("inbox_documents").select("*").eq("id", inboxDocId).single();
  if (!inbox) return;

  // Insert into documents table
  const { data: doc } = await admin.from("documents").insert({
    item_id: itemId,
    name: inbox.file_name,
    file_url: inbox.file_url,
    file_type: inbox.file_type,
    extracted_text: inbox.extracted_text || null,
    ocr_status: inbox.extracted_text ? "done" : "pending",
  }).select().single();

  if (doc) {
    // Mark inbox document as assigned
    await admin.from("inbox_documents").update({ status: "assigned" }).eq("id", inboxDocId);
  }
}

export async function dismissInboxDocument(id: string): Promise<void> {
  await supabase.from("inbox_documents").update({ status: "dismissed" }).eq("id", id);
}
