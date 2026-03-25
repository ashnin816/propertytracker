import { Space, Unit, Item, Document } from "./types";

const SPACES_KEY = "hometracker_spaces";
const UNITS_KEY = "hometracker_units";
const ITEMS_KEY = "hometracker_items";
const DOCS_KEY = "hometracker_documents";

// --- Spaces ---

function getSpaces(): Space[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SPACES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveSpaces(spaces: Space[]) {
  localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
}

export function getAllSpaces(): Space[] {
  return getSpaces().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getSpace(id: string): Space | undefined {
  return getSpaces().find((s) => s.id === id);
}

export function createSpace(name: string, icon: string): Space {
  const spaces = getSpaces();
  const space: Space = {
    id: crypto.randomUUID(),
    name,
    icon,
    createdAt: new Date().toISOString(),
  };
  spaces.push(space);
  saveSpaces(spaces);
  return space;
}

export function updateSpace(id: string, updates: Partial<Pick<Space, "name" | "icon">>) {
  const spaces = getSpaces();
  const idx = spaces.findIndex((s) => s.id === id);
  if (idx === -1) return;
  spaces[idx] = { ...spaces[idx], ...updates };
  saveSpaces(spaces);
}

export function deleteSpace(id: string) {
  const spaces = getSpaces().filter((s) => s.id !== id);
  saveSpaces(spaces);
  // Delete all units in this space
  const units = getUnits().filter((u) => u.spaceId !== id);
  saveUnits(units);
  // Delete all items in this space and their documents
  const items = getItems();
  const itemIds = items.filter((i) => i.spaceId === id).map((i) => i.id);
  saveItems(items.filter((i) => i.spaceId !== id));
  const docs = getDocuments().filter((d) => !itemIds.includes(d.itemId));
  saveDocuments(docs);
}

// --- Units ---

function getUnits(): Unit[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(UNITS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUnits(units: Unit[]) {
  localStorage.setItem(UNITS_KEY, JSON.stringify(units));
}

export function getUnitsForSpace(spaceId: string): Unit[] {
  return getUnits()
    .filter((u) => u.spaceId === spaceId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getUnit(id: string): Unit | undefined {
  return getUnits().find((u) => u.id === id);
}

export function createUnit(spaceId: string, name: string): Unit {
  const units = getUnits();
  const unit: Unit = {
    id: crypto.randomUUID(),
    spaceId,
    name,
    createdAt: new Date().toISOString(),
  };
  units.push(unit);
  saveUnits(units);
  return unit;
}

export function updateUnit(id: string, updates: Partial<Pick<Unit, "name">>) {
  const units = getUnits();
  const idx = units.findIndex((u) => u.id === id);
  if (idx === -1) return;
  units[idx] = { ...units[idx], ...updates };
  saveUnits(units);
}

export function deleteUnit(id: string) {
  const units = getUnits().filter((u) => u.id !== id);
  saveUnits(units);
  // Delete all items in this unit and their documents
  const items = getItems();
  const itemIds = items.filter((i) => i.unitId === id).map((i) => i.id);
  saveItems(items.filter((i) => i.unitId !== id));
  const docs = getDocuments().filter((d) => !itemIds.includes(d.itemId));
  saveDocuments(docs);
}

export function getUnitCountForSpace(spaceId: string): number {
  return getUnits().filter((u) => u.spaceId === spaceId).length;
}

// --- Items ---

function getItems(): Item[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ITEMS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveItems(items: Item[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function getItemsForSpace(spaceId: string): Item[] {
  return getItems()
    .filter((item) => item.spaceId === spaceId)
    .sort(
      (a, b) => a.name.localeCompare(b.name)
    );
}

export function getItem(id: string): Item | undefined {
  return getItems().find((item) => item.id === id);
}

export function getItemsForUnit(unitId: string): Item[] {
  return getItems()
    .filter((item) => item.unitId === unitId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createItem(
  spaceId: string,
  name: string,
  icon: string,
  photoUrl: string | null,
  unitId?: string
): Item {
  const items = getItems();
  const item: Item = {
    id: crypto.randomUUID(),
    spaceId,
    unitId,
    name,
    icon,
    photoUrl,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  saveItems(items);
  return item;
}

export function updateItem(id: string, updates: Partial<Pick<Item, "name" | "photoUrl">>) {
  const items = getItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  items[idx] = { ...items[idx], ...updates };
  saveItems(items);
}

export function deleteItem(id: string) {
  const items = getItems().filter((item) => item.id !== id);
  saveItems(items);
  const docs = getDocuments().filter((doc) => doc.itemId !== id);
  saveDocuments(docs);
}

export function searchItemsInSpace(spaceId: string, query: string): Item[] {
  const q = query.toLowerCase();
  return getItemsForSpace(spaceId).filter((item) =>
    item.name.toLowerCase().includes(q)
  );
}

// --- Documents ---

function getDocuments(): Document[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DOCS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveDocuments(docs: Document[]) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

export function getDocumentsForItem(itemId: string): Document[] {
  return getDocuments()
    .filter((doc) => doc.itemId === itemId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function addDocument(
  itemId: string,
  name: string,
  fileUrl: string,
  fileType: string
): Document {
  const docs = getDocuments();
  const doc: Document = {
    id: crypto.randomUUID(),
    itemId,
    name,
    fileUrl,
    fileType,
    createdAt: new Date().toISOString(),
  };
  docs.push(doc);
  saveDocuments(docs);
  return doc;
}

export function updateDocument(id: string, updates: Partial<Pick<Document, "extractedText" | "ocrStatus" | "name">>) {
  const docs = getDocuments();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return;
  docs[idx] = { ...docs[idx], ...updates };
  saveDocuments(docs);
}

export function getDocument(id: string): Document | undefined {
  return getDocuments().find((d) => d.id === id);
}

export function deleteDocument(id: string) {
  const docs = getDocuments().filter((doc) => doc.id !== id);
  saveDocuments(docs);
}

export function getItemCountForSpace(spaceId: string): number {
  return getItems().filter((item) => item.spaceId === spaceId).length;
}

export function getDocumentCountForItem(itemId: string): number {
  return getDocuments().filter((doc) => doc.itemId === itemId).length;
}

export function getDashboardStats() {
  const spaces = getSpaces();
  const items = getItems();
  const docs = getDocuments();
  return {
    spaces: spaces.length,
    items: items.length,
    documents: docs.length,
  };
}

export function getDocumentCountForSpace(spaceId: string): number {
  const itemIds = getItems()
    .filter((i) => i.spaceId === spaceId)
    .map((i) => i.id);
  return getDocuments().filter((d) => itemIds.includes(d.itemId)).length;
}

export function getAllDocumentsWithContext(): { id: string; itemId: string; spaceId: string; name: string; spaceName: string; itemName: string; text: string }[] {
  const spaces = getSpaces();
  const items = getItems();
  const docs = getDocuments();
  return docs
    .filter((d) => d.extractedText)
    .map((d) => {
      const item = items.find((i) => i.id === d.itemId);
      const space = item ? spaces.find((s) => s.id === item.spaceId) : null;
      return {
        id: d.id,
        itemId: d.itemId,
        spaceId: item?.spaceId || "",
        name: d.name,
        spaceName: space?.name || "Unknown",
        itemName: item?.name || "Unknown",
        text: d.extractedText || "",
      };
    });
}

export interface RecentActivity {
  type: "item" | "document";
  id: string;
  name: string;
  itemId?: string;
  itemName?: string;
  spaceId: string;
  spaceName: string;
  createdAt: string;
}

export function getRecentActivity(limit = 8): RecentActivity[] {
  const spaces = getSpaces();
  const items = getItems();
  const docs = getDocuments();
  const activity: RecentActivity[] = [];

  for (const item of items) {
    const space = spaces.find((s) => s.id === item.spaceId);
    if (!space) continue;
    activity.push({
      type: "item",
      id: item.id,
      name: item.name,
      spaceId: space.id,
      spaceName: space.name,
      createdAt: item.createdAt,
    });
  }

  for (const doc of docs) {
    const item = items.find((i) => i.id === doc.itemId);
    if (!item) continue;
    const space = spaces.find((s) => s.id === item.spaceId);
    if (!space) continue;
    activity.push({
      type: "document",
      id: doc.id,
      name: doc.name,
      itemId: item.id,
      itemName: item.name,
      spaceId: space.id,
      spaceName: space.name,
      createdAt: doc.createdAt,
    });
  }

  return activity
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

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

export function globalSearch(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];
  const spaces = getSpaces();
  const items = getItems();

  // Search spaces
  for (const space of spaces) {
    if (space.name.toLowerCase().includes(q)) {
      results.push({ type: "space", id: space.id, name: space.name, icon: space.icon });
    }
  }

  // Search items
  for (const item of items) {
    if (item.name.toLowerCase().includes(q)) {
      const space = spaces.find((s) => s.id === item.spaceId);
      results.push({
        type: "item",
        id: item.id,
        name: item.name,
        spaceId: item.spaceId,
        spaceName: space?.name,
        icon: item.icon,
      });
    }
  }

  // Search documents (name and OCR text)
  const docs = getDocuments();
  for (const doc of docs) {
    const nameMatch = doc.name.toLowerCase().includes(q);
    const textMatch = doc.extractedText?.toLowerCase().includes(q);
    if (nameMatch || textMatch) {
      const item = items.find((i) => i.id === doc.itemId);
      const space = item ? spaces.find((s) => s.id === item.spaceId) : null;

      // Extract context around the match
      let matchContext: string | undefined;
      if (textMatch && doc.extractedText) {
        const idx = doc.extractedText.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 30);
        const end = Math.min(doc.extractedText.length, idx + q.length + 30);
        matchContext = (start > 0 ? "..." : "") +
          doc.extractedText.slice(start, end).trim() +
          (end < doc.extractedText.length ? "..." : "");
      }

      results.push({
        type: "document",
        id: doc.id,
        name: doc.name,
        itemId: doc.itemId,
        itemName: item?.name,
        spaceName: space?.name,
        icon: item?.icon,
        matchContext,
      });
    }
  }

  return results.slice(0, 12);
}
