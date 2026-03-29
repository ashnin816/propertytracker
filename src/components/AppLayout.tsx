"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Space, Unit, Item, Document } from "@/lib/types";
import {
  getAllSpaces, createSpace, deleteSpace, updateSpace, getSpace,
  getUnitsForSpace, createUnit, deleteUnit, updateUnit, getUnit, getUnitCountForSpace,
  getItemsForSpace, getItemsForUnit, createItem, deleteItem, updateItem, getItem,
  getItemCountForSpace, getDocumentCountForSpace,
  getDocumentsForItem, addDocument, deleteDocument, updateDocument,
  getDocumentCountForItem,
  getDocumentCountsForItems,
  globalSearch, SearchResult, getRecentActivity, getAllDocumentsWithContext,
  getDocument, getInboxCount, getItemCountsForSpaces, getUnitCountsForSpaces,
} from "@/lib/supabase-storage";
import { authFetch } from "@/lib/supabase";
import { getSpaceIcon, getSpaceColors, getItemPreset, getCategoryColors, getPresetsForSpaceType, hasUnits, ITEM_PRESETS } from "@/lib/presets";
import { getCustomIcon } from "@/lib/icons";
import { timeAgo } from "@/lib/time";
import { compressImage, isImageDataUrl } from "@/lib/compress";
import { extractText, extractSmartPages, isExtractable } from "@/lib/ocr";
import { loadDemoData } from "@/lib/demo";
import { generateDocumentName } from "@/lib/docname";
import { parseDocDetails } from "@/lib/docdetails";
import { analyzeDocument } from "@/lib/claude";
import { useToast } from "./Toast";
import { useTheme } from "./ThemeProvider";
import AddSpaceModal from "./AddSpaceModal";
import AddItemModal from "./AddItemModal";
import DeleteModal from "./DeleteModal";
import DocumentPreview from "./DocumentPreview";
import DocTypeIcon from "./DocTypeIcon";
import IconPicker from "./IconPicker";
import FAB from "./FAB";
import AnalyzeModal from "./AnalyzeModal";
import ContextMenu from "./ContextMenu";
import ItemPicker from "./ItemPicker";
import AskAI from "./AskAI";
import { useAuth } from "./AuthProvider";
import TeamPanel from "./TeamPanel";
import InboxPanel from "./InboxPanel";
import InsightsPanel from "./InsightsPanel";
import WelcomeWizard from "./WelcomeWizard";
import NotificationCenter, { NotificationItem } from "./NotificationCenter";
import RenameModal from "./RenameModal";
import BulkUnitsModal from "./BulkUnitsModal";

type View = "home" | "space" | "units" | "unit" | "item" | "team" | "inbox";

interface AppLayoutProps {
  mirrorOrgId?: string;
  mirrorOrgName?: string;
  onExitMirror?: () => void;
}

export default function AppLayout({ mirrorOrgId, mirrorOrgName, onExitMirror }: AppLayoutProps = {}) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [view, setView] = useState<View>("home");
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Async-derived state (replaces inline sync calls)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [spaceCounts, setSpaceCounts] = useState<Record<string, { items: number; units: number }>>({});
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<Awaited<ReturnType<typeof getRecentActivity>>>([]);
  const [askAIDocuments, setAskAIDocuments] = useState<Awaited<ReturnType<typeof getAllDocumentsWithContext>>>([]);

  // Modals
  const [showAddSpace, setShowAddSpace] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showDeleteSpace, setShowDeleteSpace] = useState(false);
  const [showDeleteItem, setShowDeleteItem] = useState(false);
  const [contextDeleteSpaceId, setContextDeleteSpaceId] = useState<string | null>(null);
  const [contextDeleteItemId, setContextDeleteItemId] = useState<string | null>(null);
  const [contextDeleteUnitId, setContextDeleteUnitId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ type: "space" | "unit" | "item"; id: string; name: string } | null>(null);
  const [changeIconTarget, setChangeIconTarget] = useState<{ id: string; currentIcon: string } | null>(null);
  const [showBulkUnits, setShowBulkUnits] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [newSpaceWelcome, setNewSpaceWelcome] = useState<{ name: string; emoji: string } | null>(null);
  const [uploadQueue, setUploadQueue] = useState<{ files: File[]; itemId: string }[]>([]);
  const [showAskAI, setShowAskAI] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [uploadCount, setUploadCount] = useState({ current: 0, total: 0 });
  const [inboxCount, setInboxCount] = useState(0);
  const [insightsData, setInsightsData] = useState<{ expiring: { docId: string; docName: string; spaceId: string; spaceName: string; itemId: string; itemName: string; expiryDate: string; daysRemaining: number }[]; missingInsurance: { spaceId: string; name: string }[] } | null>(null);

  // State for modal context data (replaces inline sync calls in JSX)
  const [contextDeleteSpaceData, setContextDeleteSpaceData] = useState<{ space: Space; itemCount: number } | null>(null);
  const [contextDeleteUnitData, setContextDeleteUnitData] = useState<{ unit: Unit; assetCount: number } | null>(null);
  const [contextDeleteItemData, setContextDeleteItemData] = useState<{ item: Item; docCount: number } | null>(null);

  // Analyze modal state
  const [analyzeModal, setAnalyzeModal] = useState<{
    visible: boolean;
    fileName: string;
    isImage: boolean;
    stage: "uploading" | "analyzing" | "extracting" | "naming" | "done";
    extractedText: string | null;
    suggestedName: string | null;
    docId: string | null;
    engine: "claude" | "ocr";
  }>({ visible: false, fileName: "", isImage: false, stage: "uploading", extractedText: null, suggestedName: null, docId: null, engine: "ocr" });

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  // Editing
  const [editingSpace, setEditingSpace] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editingItem, setEditingItem] = useState(false);
  const [editName, setEditName] = useState("");

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [searchPos, setSearchPos] = useState({ top: 0, left: 0, width: 0 });

  // Drag
  const [dragging, setDragging] = useState(false);
  const dragCounter = { current: 0 };

  const { toast } = useToast();
  const { user: authUser, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  // Role-based permissions
  const role = authUser?.role;
  const canAddProperties = role === "org_admin" || role === "super_admin";
  const canEditStructure = role === "org_admin" || role === "super_admin" || role === "manager"; // add/edit/delete units & assets
  const canUpload = role !== "tenant"; // org_admin, manager, technician
  const canDelete = role === "org_admin" || role === "super_admin" || role === "manager";

  // Compute notifications on-the-fly from insights data + inbox count
  const notifications: NotificationItem[] = (() => {
    const items: NotificationItem[] = [];
    if (insightsData?.expiring) {
      for (const doc of insightsData.expiring) {
        const urgency = doc.daysRemaining <= 7 ? "critical" : doc.daysRemaining <= 30 ? "warning" : doc.daysRemaining <= 60 ? "notice" : "info";
        items.push({
          id: `exp-${doc.docId}`,
          type: "expiring",
          title: doc.docName,
          subtitle: `${doc.spaceName} · ${doc.itemName} · ${doc.daysRemaining}d`,
          urgency,
          action: () => { selectSpace(doc.spaceId); setTimeout(() => selectItem(doc.itemId), 300); },
        });
      }
    }
    if (inboxCount > 0) {
      items.push({
        id: "inbox",
        type: "inbox",
        title: `${inboxCount} pending document${inboxCount !== 1 ? "s" : ""}`,
        subtitle: "Waiting to be filed",
        action: () => { setView("inbox"); setSelectedSpaceId(null); setSidebarOpen(false); },
      });
    }
    if (insightsData?.missingInsurance) {
      for (const space of insightsData.missingInsurance) {
        items.push({
          id: `ins-${space.spaceId}`,
          type: "insurance",
          title: `${space.name} — no insurance`,
          subtitle: "Upload insurance documentation",
          action: () => selectSpace(space.spaceId),
        });
      }
    }
    return items;
  })();

  // Update selectedSpace when selectedSpaceId changes
  useEffect(() => {
    if (selectedSpaceId) {
      getSpace(selectedSpaceId).then((s) => setSelectedSpace(s ?? null));
    } else {
      setSelectedSpace(null);
    }
  }, [selectedSpaceId]);

  // Update selectedItem when selectedItemId changes
  useEffect(() => {
    if (selectedItemId) {
      getItem(selectedItemId).then((i) => setSelectedItem(i ?? null));
    } else {
      setSelectedItem(null);
    }
  }, [selectedItemId]);

  // Update selectedUnit when selectedUnitId changes
  useEffect(() => {
    if (selectedUnitId) {
      getUnit(selectedUnitId).then((u) => setSelectedUnit(u ?? null));
    } else {
      setSelectedUnit(null);
    }
  }, [selectedUnitId]);

  const spaceColors = selectedSpace ? getSpaceColors(selectedSpace.icon) : null;
  const spaceIcon = selectedSpace ? getSpaceIcon(selectedSpace.icon) : null;

  // Load space counts whenever spaces change
  useEffect(() => {
    async function loadCounts() {
      if (spaces.length === 0) { setSpaceCounts({}); return; }
      const spaceIds = spaces.map((s) => s.id);
      const [itemsRes, unitsRes] = await Promise.all([
        getItemCountsForSpaces(spaceIds),
        getUnitCountsForSpaces(spaceIds),
      ]);
      const counts: Record<string, { items: number; units: number }> = {};
      for (const id of spaceIds) {
        counts[id] = { items: itemsRes[id] || 0, units: unitsRes[id] || 0 };
      }
      setSpaceCounts(counts);
    }
    loadCounts();
  }, [spaces]);

  // Load document counts whenever items change (single batch query)
  useEffect(() => {
    if (items.length > 0) {
      getDocumentCountsForItems(items.map((i) => i.id)).then(setDocumentCounts);
    } else {
      setDocumentCounts({});
    }
  }, [items]);

  // Load recent activity when on home view
  useEffect(() => {
    if (view === "home" && spaces.length > 0) {
      getRecentActivity(6, authUser?.assignments).then(setRecentActivity);
    }
  }, [view, spaces]);

  useEffect(() => {
    setTimeout(() => setInitialLoad(false), 300);
  }, []);

  // Re-fetch spaces when user loads or changes (assignments affect visibility)
  useEffect(() => {
    if (authUser) {
      getAllSpaces(mirrorOrgId, authUser.assignments).then(setSpaces);
      // Load inbox count for admins/managers
      const effectiveOrgId = mirrorOrgId || authUser.orgId;
      if (effectiveOrgId && (canAddProperties || canEditStructure)) {
        getInboxCount(effectiveOrgId).then(setInboxCount);
        authFetch(`/api/insights?org_id=${effectiveOrgId}`).then(r => r.json()).then(d => { if (d.counts) setInsightsData(d); });
        // Poll every 60 seconds
        const interval = setInterval(() => {
          if (effectiveOrgId) {
            getInboxCount(effectiveOrgId).then(setInboxCount);
            authFetch(`/api/insights?org_id=${effectiveOrgId}`).then(r => r.json()).then(d => { if (d.counts) setInsightsData(d); });
          }
        }, 60000);
        return () => clearInterval(interval);
      }
    }
  }, [authUser?.id, authUser?.assignments?.length]);

  useEffect(() => {
    globalSearch(searchQuery, authUser?.assignments).then(setSearchResults);
  }, [searchQuery]);

  // Load context-delete data when IDs are set
  useEffect(() => {
    if (contextDeleteSpaceId) {
      Promise.all([getSpace(contextDeleteSpaceId), getItemCountForSpace(contextDeleteSpaceId)]).then(
        ([s, ic]) => {
          if (s) setContextDeleteSpaceData({ space: s, itemCount: ic });
        }
      );
    } else {
      setContextDeleteSpaceData(null);
    }
  }, [contextDeleteSpaceId]);

  useEffect(() => {
    if (contextDeleteUnitId) {
      Promise.all([getUnit(contextDeleteUnitId), getItemsForUnit(contextDeleteUnitId)]).then(
        ([u, items]) => {
          if (u) setContextDeleteUnitData({ unit: u, assetCount: items.length });
        }
      );
    } else {
      setContextDeleteUnitData(null);
    }
  }, [contextDeleteUnitId]);

  useEffect(() => {
    if (contextDeleteItemId) {
      Promise.all([getItem(contextDeleteItemId), getDocumentsForItem(contextDeleteItemId)]).then(
        ([it, docs]) => {
          if (it) setContextDeleteItemData({ item: it, docCount: docs.length });
        }
      );
    } else {
      setContextDeleteItemData(null);
    }
  }, [contextDeleteItemId]);

  // Sort items: Property Documents first, custom/unknown last, rest alphabetical
  function sortItems(itemList: Item[]): Item[] {
    return [...itemList].sort((a, b) => {
      const aIsPropertyDocs = a.icon === "property-docs";
      const bIsPropertyDocs = b.icon === "property-docs";
      if (aIsPropertyDocs && !bIsPropertyDocs) return -1;
      if (!aIsPropertyDocs && bIsPropertyDocs) return 1;
      const aIsCustom = a.icon === "custom";
      const bIsCustom = b.icon === "custom";
      if (aIsCustom && !bIsCustom) return 1;
      if (!aIsCustom && bIsCustom) return -1;
      return a.name.localeCompare(b.name);
    });
  }

  async function refreshSpaces() {
    const s = await getAllSpaces(mirrorOrgId, authUser?.assignments);
    setSpaces(s);
  }

  // Wrapper that passes user assignments to unit queries (for tenant filtering)
  async function loadUnits(spaceId: string) {
    return getUnitsForSpace(spaceId, authUser?.assignments);
  }

  async function selectSpace(id: string) {
    setTransitioning(true);
    setSelectedSpaceId(id);
    setSelectedUnitId(null);
    setSelectedItemId(null);
    setSidebarOpen(false);
    const space = await getSpace(id);
    setTimeout(async () => {
      if (space && hasUnits(space.icon)) {
        const [u, i] = await Promise.all([loadUnits(id), getItemsForSpace(id)]);
        setUnits(u);
        setItems(i.filter((i) => !i.unitId)); // building-level assets
        setView("units");
      } else {
        setItems(await getItemsForSpace(id));
        setView("space");
      }
      setTransitioning(false);
    }, 150);
  }

  async function selectUnit(id: string) {
    setTransitioning(true);
    setSelectedUnitId(id);
    setSelectedItemId(null);
    setTimeout(async () => {
      setItems(await getItemsForUnit(id));
      setView("unit");
      setTransitioning(false);
    }, 150);
  }

  async function selectItem(id: string) {
    setTransitioning(true);
    setSelectedItemId(id);
    setTimeout(async () => {
      setDocuments(await getDocumentsForItem(id));
      setView("item");
      setTransitioning(false);
    }, 150);
  }

  async function goBack() {
    if (view === "item") {
      setSelectedItemId(null);
      if (selectedUnitId) {
        setItems(await getItemsForUnit(selectedUnitId));
        setView("unit");
      } else if (selectedSpaceId) {
        const space = await getSpace(selectedSpaceId);
        if (space && hasUnits(space.icon)) {
          const [u, i] = await Promise.all([loadUnits(selectedSpaceId), getItemsForSpace(selectedSpaceId)]);
          setUnits(u);
          setItems(i.filter((i) => !i.unitId));
          setView("units");
        } else {
          setItems(await getItemsForSpace(selectedSpaceId));
          setView("space");
        }
      }
    } else if (view === "unit") {
      setSelectedUnitId(null);
      if (selectedSpaceId) {
        const [u, i] = await Promise.all([loadUnits(selectedSpaceId), getItemsForSpace(selectedSpaceId)]);
        setUnits(u);
        setItems(i.filter((i) => !i.unitId));
      }
      setView("units");
    } else if (view === "units" || view === "space") {
      setSelectedSpaceId(null);
      setSelectedUnitId(null);
      setView("home");
    }
  }

  // Space actions
  async function handleAddSpace(name: string, icon: string) {
    const space = await createSpace(name, icon);
    // Auto-create "Property Documents" asset for property-level docs
    await createItem(space.id, "Property Documents", "property-docs", null);
    const spaceIconData = getSpaceIcon(icon);
    await refreshSpaces();
    setShowAddSpace(false);

    // Show welcome celebration
    setNewSpaceWelcome({ name, emoji: spaceIconData.emoji });

    // After celebration, navigate into the space
    setTimeout(() => {
      setNewSpaceWelcome(null);
      selectSpace(space.id);
    }, 1800);
  }

  async function handleDeleteSpace() {
    const idToDelete = contextDeleteSpaceId || selectedSpaceId;
    if (!idToDelete) return;
    await deleteSpace(idToDelete);
    await refreshSpaces();
    if (selectedSpaceId === idToDelete) {
      setSelectedSpaceId(null);
      setSelectedItemId(null);
      setView("home");
    }
    setShowDeleteSpace(false);
    setContextDeleteSpaceId(null);
    toast("Space deleted");
  }

  async function handleRenameTarget(newName: string) {
    if (!renameTarget) return;
    if (renameTarget.type === "space") {
      await updateSpace(renameTarget.id, { name: newName });
      await refreshSpaces();
      toast("Property renamed");
    } else if (renameTarget.type === "unit") {
      if (!selectedSpaceId) return;
      await updateUnit(renameTarget.id, { name: newName });
      setUnits(await loadUnits(selectedSpaceId));
      toast("Unit renamed");
    } else {
      if (!selectedSpaceId) return;
      await updateItem(renameTarget.id, { name: newName });
      if (selectedUnitId) {
        setItems(await getItemsForUnit(selectedUnitId));
      } else {
        const spaceItems = await getItemsForSpace(selectedSpaceId);
        setItems(spaceItems.filter((i) => !i.unitId));
      }
      toast("Asset renamed");
    }
    setRenameTarget(null);
  }

  async function handleBulkUnits(unitNames: string[], template: { assets: { name: string; icon: string }[] } | null) {
    if (!selectedSpaceId) return;
    setShowBulkUnits(false);
    toast(`Creating ${unitNames.length} unit${unitNames.length !== 1 ? "s" : ""}...`);

    // Create all units in parallel
    const units = await Promise.all(
      unitNames.map((name) => createUnit(selectedSpaceId!, name))
    );

    // Create assets for all units in parallel
    let totalAssets = 0;
    if (template && template.assets.length > 0) {
      await Promise.all(
        units.flatMap((unit) =>
          template.assets.map((asset) => {
            totalAssets++;
            return createItem(selectedSpaceId!, asset.name, asset.icon, null, unit.id);
          })
        )
      );
    }

    const [u, i] = await Promise.all([loadUnits(selectedSpaceId), getItemsForSpace(selectedSpaceId)]);
    setUnits(u);
    setItems(i.filter((i) => !i.unitId));
    await refreshSpaces();

    if (totalAssets > 0) {
      toast(`Created ${unitNames.length} units with ${totalAssets} assets`);
    } else {
      toast(`Created ${unitNames.length} units`);
    }
  }

  async function handleContextDeleteUnit() {
    if (!contextDeleteUnitId || !selectedSpaceId) return;
    await deleteUnit(contextDeleteUnitId);
    const [u, i] = await Promise.all([loadUnits(selectedSpaceId), getItemsForSpace(selectedSpaceId)]);
    setUnits(u);
    setItems(i.filter((i) => !i.unitId));
    await refreshSpaces();
    if (selectedUnitId === contextDeleteUnitId) {
      setSelectedUnitId(null);
      setView("units");
    }
    setContextDeleteUnitId(null);
    toast("Unit deleted");
  }

  async function handleContextDeleteItem() {
    if (!contextDeleteItemId || !selectedSpaceId) return;
    await deleteItem(contextDeleteItemId);
    if (selectedUnitId) {
      setItems(await getItemsForUnit(selectedUnitId));
    } else {
      const spaceItems = await getItemsForSpace(selectedSpaceId);
      setItems(spaceItems.filter((i) => !i.unitId));
    }
    await refreshSpaces();
    if (selectedItemId === contextDeleteItemId) {
      setSelectedItemId(null);
      if (selectedUnitId) setView("unit");
      else setView("space");
    }
    setContextDeleteItemId(null);
    toast("Asset deleted");
  }

  async function handleRenameSpace() {
    if (!selectedSpaceId || !editName.trim()) return;
    await updateSpace(selectedSpaceId, { name: editName.trim() });
    await refreshSpaces();
    setEditingSpace(false);
    toast("Space renamed");
  }

  // Item actions
  async function handleAddItem(name: string, icon: string, photoUrl: string | null) {
    if (!selectedSpaceId) return;
    await createItem(selectedSpaceId, name, icon, photoUrl, selectedUnitId || undefined);
    if (selectedUnitId) {
      setItems(await getItemsForUnit(selectedUnitId));
    } else {
      const spaceItems = await getItemsForSpace(selectedSpaceId);
      setItems(spaceItems.filter((i) => !i.unitId));
    }
    await refreshSpaces();
    setShowAddItem(false);
    toast(`${name} added`);
  }

  async function handleQuickAddItem(name: string, icon: string) {
    if (!selectedSpaceId) return;
    await createItem(selectedSpaceId, name, icon, null, selectedUnitId || undefined);
    if (selectedUnitId) {
      setItems(await getItemsForUnit(selectedUnitId));
    } else {
      const spaceItems = await getItemsForSpace(selectedSpaceId);
      setItems(spaceItems.filter((i) => !i.unitId));
    }
    await refreshSpaces();
    toast(`${name} added`);
  }

  async function handleDeleteItem() {
    if (!selectedItemId || !selectedSpaceId) return;
    await deleteItem(selectedItemId);
    setItems(await getItemsForSpace(selectedSpaceId));
    await refreshSpaces();
    setSelectedItemId(null);
    setView("space");
    setShowDeleteItem(false);
    toast("Item deleted");
  }

  async function handleRenameItem() {
    if (!selectedItemId || !editName.trim()) return;
    await updateItem(selectedItemId, { name: editName.trim() });
    setEditingItem(false);
    toast("Item renamed");
  }

  async function handleRenameItemInGrid() {
    if (!editingItemId || !editName.trim() || !selectedSpaceId) return;
    await updateItem(editingItemId, { name: editName.trim() });
    setItems(await getItemsForSpace(selectedSpaceId));
    setEditingItemId(null);
    toast("Item renamed");
  }

  // Document actions
  // Process a single file with analyze modal
  async function analyzeSingleFile(file: File, itemId: string) {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const raw = reader.result as string;
        const canExtract = isExtractable(file.type);

        if (canExtract) {
          setAnalyzeModal({ visible: true, fileName: file.name, isImage: file.type.startsWith("image/"), stage: "uploading", extractedText: null, suggestedName: null, docId: null, engine: "claude" });
        }

        const data = isImageDataUrl(raw) ? await compressImage(raw) : raw;
        const doc = await addDocument(itemId, file.name, data, file.type);
        setDocuments(await getDocumentsForItem(itemId));

        if (!canExtract) {
          toast("Document added");
          resolve();
          return;
        }

        setAnalyzeModal((prev) => ({ ...prev, stage: "analyzing", docId: doc.id }));
        await updateDocument(doc.id, { ocrStatus: "processing" });
        setDocuments(await getDocumentsForItem(itemId));

        try {
          if (file.type.startsWith("image/")) {
            await new Promise((r) => setTimeout(r, 300));
            setAnalyzeModal((prev) => ({ ...prev, stage: "extracting" }));
            const result = await analyzeDocument(raw, file.type);
            setAnalyzeModal((prev) => ({ ...prev, stage: "naming", extractedText: result.extractedText || null }));
            await new Promise((r) => setTimeout(r, 400));
            await updateDocument(doc.id, { extractedText: result.extractedText || undefined, details: result.details || undefined, ocrStatus: "done" });
            setDocuments(await getDocumentsForItem(itemId));
            setAnalyzeModal((prev) => ({ ...prev, stage: "done", suggestedName: result.name }));
          } else if (file.type === "application/pdf") {
            await new Promise((r) => setTimeout(r, 300));
            setAnalyzeModal((prev) => ({ ...prev, stage: "extracting" }));

            // Extract full text for search, smart pages for Claude
            const [fullText, smartText] = await Promise.all([
              extractText(data, file.type),
              extractSmartPages(data),
            ]);

            const textForClaude = smartText || fullText;
            const textForSearch = fullText || smartText;

            if (textForClaude) {
              setAnalyzeModal((prev) => ({ ...prev, extractedText: textForClaude }));
              const result = await analyzeDocument(textForClaude, "text/plain");
              setAnalyzeModal((prev) => ({ ...prev, stage: "naming", extractedText: result.extractedText || textForClaude }));
              await new Promise((r) => setTimeout(r, 400));
              await updateDocument(doc.id, { extractedText: textForSearch || result.extractedText || undefined, details: result.details || undefined, ocrStatus: "done" });
              setDocuments(await getDocumentsForItem(itemId));
              setAnalyzeModal((prev) => ({ ...prev, stage: "done", suggestedName: result.name }));
            } else {
              await updateDocument(doc.id, { ocrStatus: "done" });
              setDocuments(await getDocumentsForItem(itemId));
              setAnalyzeModal((prev) => ({ ...prev, stage: "done", suggestedName: null }));
            }
          } else {
            await new Promise((r) => setTimeout(r, 500));
            setAnalyzeModal((prev) => ({ ...prev, stage: "extracting" }));
            const text = await extractText(data, file.type);
            setAnalyzeModal((prev) => ({ ...prev, stage: "naming", extractedText: text || null }));
            await new Promise((r) => setTimeout(r, 600));
            const smartName = text ? generateDocumentName(text, file.name) : null;
            await updateDocument(doc.id, { extractedText: text || undefined, ocrStatus: "done" });
            setDocuments(await getDocumentsForItem(itemId));
            setAnalyzeModal((prev) => ({ ...prev, stage: "done", suggestedName: smartName }));
          }
        } catch (err) {
          console.error("Document analysis error:", err);
          await updateDocument(doc.id, { ocrStatus: "failed" });
          setDocuments(await getDocumentsForItem(itemId));
          setAnalyzeModal((prev) => ({ ...prev, stage: "done", suggestedName: null }));
        }

        // Wait for user to accept/skip via the modal — resolve is called by the modal handlers
        // Store resolve so modal handlers can call it
        analyzeResolveRef.current = resolve;
      };
      reader.readAsDataURL(file);
    });
  }

  // Ref to hold the resolve function for the current analyze promise
  const analyzeResolveRef = useRef<(() => void) | null>(null);

  function processFiles(files: FileList | File[]) {
    if (!selectedItemId) return;
    const itemId = selectedItemId;
    const fileArray = Array.from(files);

    // Non-extractable files: add immediately
    const nonExtractable = fileArray.filter((f) => !isExtractable(f.type));
    nonExtractable.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const raw = reader.result as string;
        const data = isImageDataUrl(raw) ? await compressImage(raw) : raw;
        await addDocument(itemId, file.name, data, file.type);
        setDocuments(await getDocumentsForItem(itemId));
        toast("Document added");
      };
      reader.readAsDataURL(file);
    });

    // Extractable files: process sequentially
    const extractable = fileArray.filter((f) => isExtractable(f.type));
    if (extractable.length > 0) {
      setUploadCount({ current: 1, total: extractable.length });
      processFileQueue(extractable, itemId, 0);
    }
  }

  function processFileQueue(files: File[], itemId: string, index: number) {
    if (index >= files.length) {
      setUploadCount({ current: 0, total: 0 });
      queueRef.current = null;
      return;
    }
    queueRef.current = { files, itemId, index };
    setUploadCount({ current: index + 1, total: files.length });
    analyzeSingleFile(files[index], itemId);
  }

  // Store queue info for chaining
  const queueRef = useRef<{ files: File[]; itemId: string; index: number } | null>(null);

  async function handleAnalyzeAccept(name: string) {
    if (analyzeModal.docId && selectedItemId) {
      await updateDocument(analyzeModal.docId, { name });
      setDocuments(await getDocumentsForItem(selectedItemId));
      toast(`Named "${name}"`);
    }
    setAnalyzeModal((prev) => ({ ...prev, visible: false }));
    // Resolve the promise so next file can process
    if (analyzeResolveRef.current) {
      const resolve = analyzeResolveRef.current;
      analyzeResolveRef.current = null;
      resolve();
    }
    // Process next in queue
    if (queueRef.current) {
      const { files, itemId, index } = queueRef.current;
      if (index + 1 < files.length) {
        queueRef.current = { files, itemId, index: index + 1 };
        setUploadCount({ current: index + 2, total: files.length });
        setTimeout(() => analyzeSingleFile(files[index + 1], itemId), 300);
      } else {
        queueRef.current = null;
        setUploadCount({ current: 0, total: 0 });
      }
    }
  }

  async function handleAnalyzeSkip() {
    if (selectedItemId) setDocuments(await getDocumentsForItem(selectedItemId));
    setAnalyzeModal((prev) => ({ ...prev, visible: false }));
    toast("Document added");
    if (analyzeResolveRef.current) {
      const resolve = analyzeResolveRef.current;
      analyzeResolveRef.current = null;
      resolve();
    }
    if (queueRef.current) {
      const { files, itemId, index } = queueRef.current;
      if (index + 1 < files.length) {
        queueRef.current = { files, itemId, index: index + 1 };
        setUploadCount({ current: index + 2, total: files.length });
        setTimeout(() => analyzeSingleFile(files[index + 1], itemId), 300);
      } else {
        queueRef.current = null;
        setUploadCount({ current: 0, total: 0 });
      }
    }
  }

  async function handleRenameDoc() {
    if (!editingDocId || !editDocName.trim() || !selectedItemId) return;
    const existing = documents.find((d) => d.id === editingDocId);
    const newName = editDocName.trim();
    if (existing && existing.name !== newName) {
      await updateDocument(editingDocId, { name: newName });
      setDocuments(await getDocumentsForItem(selectedItemId));
      toast("Document renamed");
    }
    setEditingDocId(null);
  }

  function handleSpaceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    setShowItemPicker(true);
    e.target.value = "";
  }

  async function handleItemPickerSelect(itemId: string) {
    setShowItemPicker(false);
    setSelectedItemId(itemId);
    setDocuments(await getDocumentsForItem(itemId));
    setView("item");

    // Use the same processFiles flow (which shows the analyze modal)
    // Need to set selectedItemId first so processFiles can use it
    const filesToProcess = [...pendingFiles];
    setPendingFiles([]);

    // Small delay to let state update, then process
    setTimeout(() => {
      processFilesForItem(filesToProcess, itemId);
    }, 100);
  }

  function processFilesForItem(files: File[], itemId: string) {
    // Reuse the same queue system
    const nonExtractable = files.filter((f) => !isExtractable(f.type));
    nonExtractable.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const raw = reader.result as string;
        const data = isImageDataUrl(raw) ? await compressImage(raw) : raw;
        await addDocument(itemId, file.name, data, file.type);
        setDocuments(await getDocumentsForItem(itemId));
        toast("Document added");
      };
      reader.readAsDataURL(file);
    });

    const extractable = files.filter((f) => isExtractable(f.type));
    if (extractable.length > 0) {
      // Temporarily set selectedItemId so analyzeSingleFile works
      setSelectedItemId(itemId);
      processFileQueue(extractable, itemId, 0);
    }
  }

  async function handleDeleteDoc() {
    if (!deleteDocId || !selectedItemId) return;
    await deleteDocument(deleteDocId);
    setDocuments(await getDocumentsForItem(selectedItemId));
    setDeleteDocId(null);
    toast("Document deleted");
  }

  async function handleSearchSelect(result: SearchResult) {
    setSearchQuery("");
    setSearchFocused(false);
    if (result.type === "space") {
      await selectSpace(result.id);
    } else if (result.type === "item") {
      const item = await getItem(result.id);
      if (item) {
        setSelectedSpaceId(item.spaceId);
        setItems(await getItemsForSpace(item.spaceId));
        await selectItem(result.id);
      }
    } else if (result.type === "document" && result.itemId) {
      const item = await getItem(result.itemId);
      if (item) {
        setSelectedSpaceId(item.spaceId);
        setItems(await getItemsForSpace(item.spaceId));
        await selectItem(result.itemId);
      }
    }
  }

  const docToDelete = deleteDocId ? documents.find((d) => d.id === deleteDocId) : null;
  const itemPreset = selectedItem && selectedItem.icon !== "custom" && !selectedItem.icon.startsWith("icon-")
    ? getItemPreset(selectedItem.icon) : null;
  const itemCustomIcon = selectedItem?.icon.startsWith("icon-") ? getCustomIcon(selectedItem.icon) : null;
  const itemColors = itemPreset ? getCategoryColors(itemPreset.category) : null;
  const itemCardGradient = itemColors?.cardGradient || itemCustomIcon?.color || "from-gray-400 to-gray-600";
  const anyModal = showAddSpace || showAddItem || showDeleteSpace || showDeleteItem || !!deleteDocId || !!previewDoc;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#111827] border-r border-gray-200/60 dark:border-gray-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Mirror banner */}
        {mirrorOrgId && onExitMirror && (
          <div className="bg-amber-500 px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-[10px] font-semibold text-amber-900 uppercase tracking-wider">Viewing as</p>
              <p className="text-sm font-bold text-white">{mirrorOrgName}</p>
            </div>
            <button onClick={onExitMirror}
              className="text-xs font-medium text-amber-900 bg-white/30 hover:bg-white/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer no-min-size">
              Exit
            </button>
          </div>
        )}

        {/* Sidebar header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800 flex-shrink-0">
          <button onClick={() => { setView("home"); setSelectedSpaceId(null); setSidebarOpen(false); }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 text-blue-600">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 6L4 22h6v18a2 2 0 002 2h24a2 2 0 002-2V22h6L24 6z" fill="currentColor" opacity="0.2"/>
                <path d="M24 6L4 22h6v18a2 2 0 002 2h24a2 2 0 002-2V22h6L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-base dark:text-white">PropertyTracker+</span>
          </button>
        </div>

        {/* Space list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Properties</span>
              {authUser?.assignments === undefined && (
                <button onClick={() => setShowAddSpace(true)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors no-min-size cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            {spaces.length >= 8 && (
              <div className="relative mt-1.5">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={sidebarFilter}
                  onChange={(e) => setSidebarFilter(e.target.value)}
                  placeholder="Filter properties..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs focus:outline-none focus:bg-white dark:focus:bg-[#1a2332] focus:ring-1 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-all dark:text-gray-200"
                />
              </div>
            )}
          </div>
          {spaces.length === 0 ? (
            <div className="px-4 py-8 text-center">
              {authUser?.assignments !== undefined ? (
                <p className="text-sm text-gray-400">No properties assigned</p>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-3">No spaces yet</p>
                  <button onClick={async () => { await loadDemoData(); await refreshSpaces(); toast("Demo data loaded"); }}
                    className="text-xs text-blue-500 font-medium hover:text-blue-600 no-min-size cursor-pointer">
                    Try demo data
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {spaces.filter((s) => !sidebarFilter || s.name.toLowerCase().includes(sidebarFilter.toLowerCase())).map((space) => {
                const icon = getSpaceIcon(space.icon);
                const colors = getSpaceColors(space.icon);
                const isActive = selectedSpaceId === space.id;
                const counts = spaceCounts[space.id] || { items: 0, units: 0 };
                const unitCount = counts.units;
                const itemCount = counts.items;
                const isUnitBased = hasUnits(space.icon);
                return (
                  <div
                    key={space.id}
                    onClick={() => { if (!editingSpace || selectedSpaceId !== space.id) selectSpace(space.id); }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left no-min-size cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                    <div className="min-w-0 flex-1">
                      {editingSpace && selectedSpaceId === space.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleRenameSpace(); }} onClick={(e) => e.stopPropagation()}>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)}
                            className={`text-sm font-medium w-full outline-none bg-transparent border-b ${isActive ? "border-white/50 text-white" : "border-blue-500 dark:text-white"}`}
                            autoFocus onBlur={() => handleRenameSpace()} />
                        </form>
                      ) : (
                        <>
                          <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "dark:text-gray-200"}`}>{space.name}</p>
                          <p className={`text-xs ${isActive ? "text-white/70" : "text-gray-400"}`}>
                            {isUnitBased ? `${unitCount} unit${unitCount !== 1 ? "s" : ""}` : `${itemCount} asset${itemCount !== 1 ? "s" : ""}`}
                          </p>
                        </>
                      )}
                    </div>
                    {canAddProperties && (
                      <ContextMenu items={[
                        { label: "Rename", icon: "rename", onClick: () => setRenameTarget({ type: "space", id: space.id, name: space.name }) },
                        { label: "Delete", icon: "delete", danger: true, onClick: () => setContextDeleteSpaceId(space.id) },
                      ]} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-200/60 dark:border-gray-800 flex-shrink-0 space-y-2">
          {/* Ask PropertyTracker+ */}
          <button onClick={async () => {
            if (!showAskAI) {
              const docs = await getAllDocumentsWithContext(authUser?.assignments);
              setAskAIDocuments(docs);
            }
            setShowAskAI(!showAskAI);
          }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all cursor-pointer no-min-size group">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Ask PropertyTracker+</p>
              <p className="text-[10px] text-white/60">AI-powered document search</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 px-4 flex items-center gap-3 border-b border-gray-200/60 dark:border-gray-800 bg-white/90 dark:bg-[#0c1222]/90 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg no-min-size">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Back button on inner views */}
            {view !== "home" && (
              <button onClick={goBack} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg no-min-size">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Context title */}
            <div className="min-w-0">
              {view === "home" && <h1 className="text-base font-semibold dark:text-white">{(canAddProperties || canEditStructure) && spaces.length > 0 ? "Insights" : "Dashboard"}</h1>}
              {view === "team" && <h1 className="text-base font-semibold dark:text-white">Team</h1>}
              {view === "inbox" && <h1 className="text-base font-semibold dark:text-white">Inbox</h1>}
              {(view === "space" || view === "units") && selectedSpace && spaceIcon && (
                <div className="flex items-center gap-2.5">
                  <span className="text-xl flex-shrink-0">{spaceIcon.emoji}</span>
                  <h1 className="text-base font-semibold dark:text-white truncate">{selectedSpace.name}</h1>
                </div>
              )}
              {view === "unit" && selectedUnit && (
                <div className="flex items-center gap-2.5">
                  <span className="text-xl flex-shrink-0">🚪</span>
                  <div className="min-w-0">
                    <h1 className="text-base font-semibold dark:text-white truncate">{selectedUnit.name}</h1>
                    {selectedSpace && <p className="text-xs text-gray-400 truncate">{selectedSpace.name}</p>}
                  </div>
                </div>
              )}
              {view === "item" && selectedItem && (
                <div className="flex items-center gap-2.5">
                  {(itemPreset?.svg || itemCustomIcon?.svg) ? (
                    <div className="w-7 h-7 flex-shrink-0" dangerouslySetInnerHTML={{ __html: (itemPreset?.svg || itemCustomIcon?.svg)! }} />
                  ) : selectedItem.photoUrl ? (
                    <img src={selectedItem.photoUrl} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                  ) : null}
                  <div className="min-w-0">
                    <h1 className="text-base font-semibold dark:text-white truncate">{selectedItem.name}</h1>
                    {selectedSpace && <p className="text-xs text-gray-400 truncate">{selectedSpace.name}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
          {/* Upload button in header — space, units, and unit views */}
          {(view === "space" || view === "units" || view === "unit") && canUpload && (
            <button onClick={() => document.getElementById("space-doc-upload")?.click()}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs font-medium cursor-pointer no-min-size">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Upload
            </button>
          )}

          {/* Add Asset button in header — space view only */}
          {view === "space" && items.length > 0 && canEditStructure && (
            <button onClick={() => setShowAddItem(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium cursor-pointer no-min-size">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Add Asset</span>
            </button>
          )}

          {/* Mobile search icon */}
          <button onClick={() => {
            const el = document.getElementById("mobile-search");
            if (el) { el.classList.toggle("hidden"); el.querySelector("input")?.focus(); }
          }} className="sm:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg no-min-size cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Desktop search */}
          <div ref={searchBoxRef} className="relative w-64 hidden sm:block" onBlur={() => setTimeout(() => setSearchFocused(false), 200)}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setSearchFocused(true);
                if (searchBoxRef.current) {
                  const rect = searchBoxRef.current.getBoundingClientRect();
                  setSearchPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                }
              }}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:bg-white dark:focus:bg-[#1a2332] focus:shadow-md focus:border-gray-300 dark:focus:border-gray-600 border border-transparent transition-all no-min-size"
            />
            {searchFocused && searchQuery && createPortal(
              <div
                className="fixed bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-200/80 dark:border-gray-700 overflow-hidden z-[200] animate-fade-in"
                style={{ top: searchPos.top, left: searchPos.left, width: searchPos.width }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {searchResults.length === 0 ? (
                  <div className="px-4 py-4 text-center text-gray-400 text-sm">No results</div>
                ) : (
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button key={`${r.type}-${r.id}`} onClick={() => handleSearchSelect(r)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-left no-min-size">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate dark:text-gray-200">{r.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {r.type === "space" ? "Space" : r.type === "document" ? `${r.itemName} · ${r.spaceName}` : r.spaceName || "Item"}
                          </p>
                          {r.matchContext && <p className="text-xs text-emerald-500 truncate mt-0.5">&ldquo;{r.matchContext}&rdquo;</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>,
              document.body
            )}
          </div>

          {/* Notifications */}
          {authUser && (canAddProperties || canEditStructure) && (
            <NotificationCenter notifications={notifications} />
          )}

          {/* Inbox */}
          {authUser && (canAddProperties || canEditStructure) && (
            <button onClick={() => { setView("inbox"); setSelectedSpaceId(null); setSidebarOpen(false); }}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                view === "inbox"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="Inbox">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span className="text-xs font-medium hidden sm:inline">Inbox</span>
              {inboxCount > 0 && (
                <span className={`text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${
                  view === "inbox" ? "bg-white/20 text-white" : "bg-red-500 text-white"
                }`}>{inboxCount}</span>
              )}
            </button>
          )}

          {/* User avatar + dropdown */}
          {authUser && (
            <div className="relative flex-shrink-0" ref={userMenuRef}>
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-all ${
                  showUserMenu ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#0c1222]" : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600"
                } bg-blue-600`}>
                {authUser.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
              </button>
              {showUserMenu && createPortal(
                <>
                  <div className="fixed inset-0 z-[200]" onClick={() => setShowUserMenu(false)} />
                  <div className="fixed w-64 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-200/60 dark:border-gray-700 z-[201] overflow-hidden animate-scale-in"
                    style={{
                      top: (userMenuRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
                      right: window.innerWidth - (userMenuRef.current?.getBoundingClientRect().right ?? 0),
                    }}>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold dark:text-white truncate">{authUser.name}</p>
                      <p className="text-xs text-gray-400 truncate">{authUser.email}</p>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { toggleTheme(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        {theme === "light" ? (
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        )}
                        <span className="text-sm dark:text-gray-200">{theme === "light" ? "Dark mode" : "Light mode"}</span>
                      </button>
                      {(authUser.role === "org_admin" || authUser.role === "super_admin") && (
                        <button onClick={() => { setView("team"); setSelectedSpaceId(null); setSidebarOpen(false); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <span className="text-sm dark:text-gray-200">Team</span>
                        </button>
                      )}
                      {(canAddProperties || canEditStructure) && (
                        <button onClick={() => { setView("inbox"); setSelectedSpaceId(null); setSidebarOpen(false); setShowUserMenu(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <span className="text-sm dark:text-gray-200">Inbox</span>
                          </div>
                          {inboxCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{inboxCount}</span>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                      <button onClick={() => { setShowUserMenu(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm text-red-600 dark:text-red-400">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          )}
          </div>
        </header>

        {/* Content area */}
        {/* Mobile search bar */}
        <div id="mobile-search" className="hidden sm:hidden px-4 py-2 border-b border-gray-200/60 dark:border-gray-800 bg-white dark:bg-[#0c1222]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none focus:bg-white dark:focus:bg-[#1a2332] border border-transparent focus:border-gray-300 dark:focus:border-gray-600 transition-all no-min-size dark:text-white"
            />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto relative">

          {/* Initial loading */}
          {initialLoad && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading...</p>
              </div>
            </div>
          )}

          {/* Transition overlay */}
          <div className={`transition-opacity duration-200 ${transitioning || initialLoad ? "opacity-0" : "opacity-100"}`}>

          {/* HOME VIEW */}
          {view === "home" && (canAddProperties || canEditStructure) && spaces.length > 0 && (
            <InsightsPanel
              orgId={mirrorOrgId || authUser?.orgId}
              onNavigateToItem={(spaceId, itemId) => { selectSpace(spaceId); setTimeout(() => selectItem(itemId), 300); }}
              onNavigateToSpace={(spaceId) => selectSpace(spaceId)}
            />
          )}
          {view === "home" && (!canAddProperties && !canEditStructure || spaces.length === 0) && (
            <div className="flex-1 flex items-center justify-center px-4">
              {spaces.length === 0 ? (
                authUser?.assignments !== undefined ? (
                  /* Non-admin with no assignments */
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 dark:text-white">No Access Yet</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-sm mx-auto">Your admin hasn&apos;t assigned you to any properties yet.</p>
                    <p className="text-sm text-gray-400">Contact your organization admin to get access.</p>
                  </div>
                ) : (
                  /* Admin with no properties — show wizard */
                  <WelcomeWizard
                    orgName={authUser?.orgName}
                    onComplete={async (name, icon, assets) => {
                      const space = await createSpace(name, icon);
                      for (const asset of assets) {
                        await createItem(space.id, asset.name, asset.icon, null);
                      }
                      await refreshSpaces();
                      selectSpace(space.id);
                    }}
                    onDismiss={() => setShowAddSpace(true)}
                  />
                )
              ) : (
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 text-blue-600">
                      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 6L4 22h6v18a2 2 0 002 2h24a2 2 0 002-2V22h6L24 6z" fill="currentColor" opacity="0.2"/>
                        <path d="M24 6L4 22h6v18a2 2 0 002 2h24a2 2 0 002-2V22h6L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-xl font-bold dark:text-white">Welcome back</p>
                    <p className="text-sm text-gray-400 mt-1">Select a property to get started</p>
                  </div>

                  {/* Email inbox hint for admins */}
                  {authUser?.orgSlug && (canAddProperties || canEditStructure) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Email documents directly</p>
                        <p className="text-xs text-blue-700/70 dark:text-blue-300/60 mt-0.5">
                          Send attachments to <button onClick={() => navigator.clipboard.writeText(`${authUser.orgSlug}@inbound.propertytrackerplus.com`)} className="font-semibold underline cursor-pointer">{authUser.orgSlug}@inbound.propertytrackerplus.com</button> — they&apos;ll appear in your Inbox
                        </p>
                      </div>
                    </div>
                  )}

                  {recentActivity.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Recent Activity</p>
                      <div className="card rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                        {recentActivity.map((activity) => (
                          <button
                            key={`${activity.type}-${activity.id}`}
                            onClick={async () => {
                              if (activity.type === "document" && activity.itemId) {
                                setSelectedSpaceId(activity.spaceId);
                                setItems(await getItemsForSpace(activity.spaceId));
                                await selectItem(activity.itemId);
                              } else {
                                await selectSpace(activity.spaceId);
                              }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-colors no-min-size cursor-pointer"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              activity.type === "document"
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "bg-blue-100 dark:bg-blue-900/30"
                            }`}>
                              {activity.type === "document" ? (
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate dark:text-gray-200">{activity.name}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {activity.type === "document" ? `${activity.itemName} · ${activity.spaceName}` : activity.spaceName} · {timeAgo(activity.createdAt)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TEAM VIEW */}
          {view === "team" && (
            <TeamPanel spaces={spaces} />
          )}

          {/* INBOX VIEW */}
          {view === "inbox" && (
            <InboxPanel spaces={spaces} orgId={mirrorOrgId || authUser?.orgId} onAssigned={() => {
              const oid = mirrorOrgId || authUser?.orgId;
              if (oid) getInboxCount(oid).then(setInboxCount);
            }} />
          )}

          {/* Shared hidden file input for upload button */}
          {canUpload && (
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
              onChange={handleSpaceUpload} className="hidden" id="space-doc-upload" />
          )}

          {/* SPACE VIEW */}
          {view === "space" && selectedSpace && spaceColors && spaceIcon && (
            <div className="p-4 h-full">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <span className="text-4xl mb-3 block">{spaceIcon.emoji}</span>
                  {canEditStructure ? (
                    <QuickSetup
                      spaceIcon={selectedSpace.icon}
                      onAdd={async (items) => {
                        if (!selectedSpaceId) return;
                        for (const item of items) {
                          await createItem(selectedSpaceId, item.name, item.icon, null, selectedUnitId || undefined);
                        }
                        if (selectedUnitId) {
                          setItems(await getItemsForUnit(selectedUnitId));
                        } else {
                          const spaceItems = await getItemsForSpace(selectedSpaceId);
                          setItems(spaceItems.filter((i) => !i.unitId));
                        }
                        await refreshSpaces();
                        toast(`${items.length} asset${items.length !== 1 ? "s" : ""} added`);
                      }}
                      spaceName={selectedSpace.name}
                    />
                  ) : (
                    <>
                      <p className="text-lg font-bold dark:text-white mb-2">{selectedSpace.name}</p>
                      <p className="text-sm text-gray-400">No assets have been set up for this property yet</p>
                    </>
                  )}
                </div>
              ) : (
                <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortItems(items).map((item) => {
                    const preset = item.icon !== "custom" && !item.icon.startsWith("icon-") ? getItemPreset(item.icon) : null;
                    const ci = item.icon.startsWith("icon-") ? getCustomIcon(item.icon) : null;
                    const c = preset ? getCategoryColors(preset.category) : null;
                    const grad = c?.cardGradient || ci?.color || "from-gray-400 to-gray-600";
                    const emoji = preset?.emoji || null;
                    const dc = documentCounts[item.id] || 0;
                    return (
                      <div key={item.id}
                        className="group active:scale-[0.97] transition-all text-left no-min-size cursor-pointer">

                        <div className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white dark:bg-[#1a2332] relative">
                          {/* Context menu — top right corner */}
                          {canEditStructure && (
                            <div className="absolute top-2 right-2 z-10">
                              <ContextMenu items={[
                                { label: "Rename", icon: "rename", onClick: () => setRenameTarget({ type: "item", id: item.id, name: item.name }) },
                                { label: "Change Icon", icon: "rename", onClick: () => setChangeIconTarget({ id: item.id, currentIcon: item.icon }) },
                                { label: "Delete", icon: "delete", danger: true, onClick: () => setContextDeleteItemId(item.id) },
                              ]} />
                            </div>
                          )}

                          {item.photoUrl ? (
                            <div className="aspect-square overflow-hidden" onClick={() => selectItem(item.id)}>
                              <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="aspect-square flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50" onClick={() => selectItem(item.id)}>
                              {(preset?.svg || ci?.svg) ? (
                                <div className="w-3/4 h-3/4 group-hover:scale-110 transition-transform duration-200"
                                  dangerouslySetInnerHTML={{ __html: (preset?.svg || ci?.svg)! }} />
                              ) : (
                                <div className="w-3/4 h-3/4 group-hover:scale-110 transition-transform duration-200"
                                  dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 64 64" fill="none"><path d="M10 20a4 4 0 014-4h12l4 4h20a4 4 0 014 4v24a4 4 0 01-4 4H14a4 4 0 01-4-4V20z" fill="#94a3b8"/><path d="M10 24h44v24a4 4 0 01-4 4H14a4 4 0 01-4-4V24z" fill="#7e8a9a"/></svg>` }} />
                              )}
                            </div>
                          )}

                          <div className="px-3 py-2.5 cursor-pointer" onClick={() => { if (editingItemId !== item.id) selectItem(item.id); }}>
                            {editingItemId === item.id ? (
                              <form onSubmit={(e) => { e.preventDefault(); handleRenameItemInGrid(); }} onClick={(e) => e.stopPropagation()}>
                                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                                  className="text-sm font-bold w-full outline-none bg-transparent border-b border-blue-500 dark:text-white"
                                  autoFocus onBlur={() => handleRenameItemInGrid()} />
                              </form>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-sm truncate dark:text-white">{item.name}</p>
                                {dc > 0 && (
                                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 no-min-size">
                                    {dc}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              )}
            </div>
          )}

          {/* UNITS VIEW — shows units + building-level assets */}
          {view === "units" && selectedSpace && (
            <div className="p-4">
              {/* Units section */}
              {units.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Units ({units.length})</span>
                    {canEditStructure && (
                      <button onClick={() => setShowBulkUnits(true)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium cursor-pointer no-min-size">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Add Units
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {units.map((unit) => {
                      // Use spaceCounts for unit asset count — we already loaded items for the space
                      // But for individual unit asset counts, we need to count from loaded items or pre-fetch
                      // Since getItemsForUnit is async, we use items already loaded in state
                      // Note: items state only has building-level assets (filtered), so we can't count per-unit from it
                      // We'll use spaceCounts approach — but for units we need a separate count
                      // For now, we don't have unit-level item counts pre-loaded
                      // Let's just show 0 and let the unitItemCounts state handle it
                      return (
                        <UnitCard key={unit.id} unit={unit} onSelect={() => selectUnit(unit.id)}
                          onRename={() => setRenameTarget({ type: "unit", id: unit.id, name: unit.name })}
                          onDelete={() => setContextDeleteUnitId(unit.id)}
                          canEdit={canEditStructure} />
                      );
                    })}
                  </div>
                </div>
              )}

              {units.length === 0 && (
                <div className="text-center py-8 mb-6">
                  <span className="text-4xl mb-3 block">🏢</span>
                  <p className="font-semibold dark:text-white mb-2">No units yet</p>
                  {canEditStructure ? (
                    <>
                      <p className="text-sm text-gray-400 mb-4">Add units to start organizing this property</p>
                      <button onClick={() => setShowBulkUnits(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-medium text-sm cursor-pointer no-min-size">
                        + Add Units
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No units have been set up for this property</p>
                  )}
                </div>
              )}

              {/* Building-level assets */}
              {items.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Building Assets</span>
                    {canEditStructure && (
                      <button onClick={() => setShowAddItem(true)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium cursor-pointer no-min-size">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Add Building Asset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sortItems(items).map((item) => {
                      const preset = item.icon !== "custom" && !item.icon.startsWith("icon-") ? getItemPreset(item.icon) : null;
                      const ci = item.icon.startsWith("icon-") ? getCustomIcon(item.icon) : null;
                      const dc = documentCounts[item.id] || 0;
                      return (
                        <div key={item.id}
                          className="group card rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all hover:shadow-lg cursor-pointer no-min-size relative">
                          {canEditStructure && (
                            <div className="absolute top-2 right-2 z-10">
                              <ContextMenu items={[
                                { label: "Rename", icon: "rename", onClick: () => setRenameTarget({ type: "item", id: item.id, name: item.name }) },
                                { label: "Change Icon", icon: "rename", onClick: () => setChangeIconTarget({ id: item.id, currentIcon: item.icon }) },
                                { label: "Delete", icon: "delete", danger: true, onClick: () => setContextDeleteItemId(item.id) },
                              ]} />
                            </div>
                          )}
                          <div className="aspect-square flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50" onClick={() => selectItem(item.id)}>
                            {(preset?.svg || ci?.svg) ? (
                              <div className="w-3/4 h-3/4 group-hover:scale-110 transition-transform" dangerouslySetInnerHTML={{ __html: (preset?.svg || ci?.svg)! }} />
                            ) : (
                              <span className="text-4xl">{preset?.emoji || "📦"}</span>
                            )}
                          </div>
                          <div className="px-3 py-2.5 flex items-center justify-between" onClick={() => selectItem(item.id)}>
                            <p className="font-bold text-sm truncate dark:text-white">{item.name}</p>
                            {dc > 0 && <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full no-min-size">{dc}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* UNIT VIEW — shows assets inside a unit */}
          {view === "unit" && selectedUnitId && selectedSpace && (
            <div className="p-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <span className="text-4xl mb-3">🚪</span>
                  {canEditStructure ? (
                    <QuickSetup
                      spaceIcon={selectedSpace.icon}
                      onAdd={async (addItems) => {
                        if (!selectedSpaceId) return;
                        for (const item of addItems) {
                          await createItem(selectedSpaceId, item.name, item.icon, null, selectedUnitId);
                        }
                        setItems(await getItemsForUnit(selectedUnitId));
                        await refreshSpaces();
                        toast(`${addItems.length} asset${addItems.length !== 1 ? "s" : ""} added`);
                      }}
                      spaceName={selectedUnit?.name || ""}
                    />
                  ) : (
                    <>
                      <p className="text-lg font-bold dark:text-white mb-2">{selectedUnit?.name}</p>
                      <p className="text-sm text-gray-400">No assets have been set up for this unit yet</p>
                    </>
                  )}
                </div>
              ) : (
                <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assets ({items.length})</span>
                  {canEditStructure && (
                    <button onClick={() => setShowAddItem(true)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium cursor-pointer no-min-size">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      Add Asset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortItems(items).map((item) => {
                    const preset = item.icon !== "custom" && !item.icon.startsWith("icon-") ? getItemPreset(item.icon) : null;
                    const ci = item.icon.startsWith("icon-") ? getCustomIcon(item.icon) : null;
                    const dc = documentCounts[item.id] || 0;
                    return (
                      <div key={item.id}
                        className="group card rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all hover:shadow-lg cursor-pointer no-min-size relative">
                        {canEditStructure && (
                          <div className="absolute top-2 right-2 z-10">
                            <ContextMenu items={[
                              { label: "Rename", icon: "rename", onClick: () => setRenameTarget({ type: "item", id: item.id, name: item.name }) },
                              { label: "Delete", icon: "delete", danger: true, onClick: () => setContextDeleteItemId(item.id) },
                            ]} />
                          </div>
                        )}
                        {item.photoUrl ? (
                          <div className="aspect-square overflow-hidden" onClick={() => selectItem(item.id)}>
                            <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="aspect-square flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50" onClick={() => selectItem(item.id)}>
                            {(preset?.svg || ci?.svg) ? (
                              <div className="w-3/4 h-3/4 group-hover:scale-110 transition-transform" dangerouslySetInnerHTML={{ __html: (preset?.svg || ci?.svg)! }} />
                            ) : (
                              <span className="text-4xl">{preset?.emoji || "📦"}</span>
                            )}
                          </div>
                        )}
                        <div className="px-3 py-2.5 flex items-center justify-between" onClick={() => selectItem(item.id)}>
                          <p className="font-bold text-sm truncate dark:text-white">{item.name}</p>
                          {dc > 0 && <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full no-min-size">{dc}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              )}

            </div>
          )}

          {/* ITEM VIEW */}
          {view === "item" && selectedItem && (
            <div className="p-4 min-h-full flex flex-col">
              <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                {canUpload && (
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                    onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }}
                    className="hidden" id="doc-upload" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Documents ({documents.length})</span>
                </div>

                {documents.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="font-semibold dark:text-gray-200 mb-3">No documents yet</p>
                      {canUpload ? (
                        <div
                          className={`border-2 border-dashed rounded-2xl py-10 px-6 text-center cursor-pointer transition-all ${
                            dragging ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                          }`}
                          onClick={() => document.getElementById("doc-upload")?.click()}
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files); }}
                        >
                          <svg className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragging ? "text-blue-400" : "text-gray-300 dark:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className={`text-sm font-medium transition-colors ${dragging ? "text-blue-500" : "text-gray-400"}`}>
                            {dragging ? "Drop to upload" : "Drag files here or click to upload"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No documents have been uploaded for this asset</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="card rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                    {documents.map((doc) => {
                      const details = parseDocDetails(doc.extractedText);
                      const isImage = doc.fileType.startsWith("image/");
                      const hasRealUrl = doc.fileUrl && doc.fileUrl !== "demo";
                      return (
                      <div key={doc.id} className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        onClick={() => setPreviewDoc(doc)}>
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail */}
                          {isImage && hasRealUrl ? (
                            <img src={doc.fileUrl} alt={doc.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <DocTypeIcon fileType={doc.fileType} fileName={doc.name} className="w-12 h-12" />
                          )}
                          <div className="min-w-0">
                            {editingDocId === doc.id ? (
                              <form onSubmit={(e) => { e.preventDefault(); handleRenameDoc(); }} onClick={(e) => e.stopPropagation()}>
                                <input value={editDocName} onChange={(e) => setEditDocName(e.target.value)}
                                  className="text-sm font-medium w-full outline-none bg-transparent border-b border-blue-500 dark:text-white no-min-size"
                                  autoFocus onBlur={() => handleRenameDoc()} />
                              </form>
                            ) : (
                              <p className="text-sm font-medium truncate dark:text-gray-200">{doc.name}</p>
                            )}
                            {/* Rich details */}
                            {details && (
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {details.type && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 no-min-size">{details.type}</span>
                                )}
                                {details.amount && (
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 no-min-size">{details.amount}</span>
                                )}
                                {details.expiry && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 no-min-size">Exp: {details.expiry}</span>
                                )}
                                {details.date && !details.expiry && (
                                  <span className="text-[10px] text-gray-400 no-min-size">{details.date}</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400">{timeAgo(doc.createdAt)}</span>
                              {doc.ocrStatus === "processing" && <span className="text-[10px] text-blue-500 font-medium">Extracting&hellip;</span>}
                              {doc.ocrStatus === "done" && doc.extractedText && <span className="text-[10px] text-emerald-500 font-medium">Searchable</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center flex-shrink-0 no-min-size">
                          <button onClick={(e) => { e.stopPropagation(); setEditDocName(doc.name); setEditingDocId(doc.id); }}
                            className="p-2 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <a href={doc.fileUrl} download={doc.name} onClick={(e) => e.stopPropagation()}
                            className="p-2 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </a>
                          {canDelete && (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteDocId(doc.id); }}
                              className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors cursor-pointer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}

                {canUpload && documents.length > 0 && (
                  <div
                    className={`mt-3 border-2 border-dashed rounded-xl py-4 text-center text-sm cursor-pointer transition-all ${
                      dragging ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-500" : "border-gray-300 dark:border-gray-600 text-gray-400 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:text-blue-400"
                    }`}
                    onClick={() => document.getElementById("doc-upload")?.click()}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files); }}
                  >
                    {dragging ? "Drop to upload" : "Drag files here or click to upload more"}
                  </div>
                )}
                {/* Centered add document button */}
                {canUpload && (
                  <div className="sticky bottom-6 flex justify-center mt-4 pointer-events-none">
                    <button
                      onClick={() => document.getElementById("doc-upload")?.click()}
                      className="pointer-events-auto cursor-pointer bg-blue-600 text-white h-12 px-6 rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 flex items-center gap-2 font-semibold text-sm no-min-size"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          </div>{/* end transition wrapper */}
        </main>

        {/* FAB */}
        {/* Space FAB moved inline — see space view */}
        {/* Item view FAB is rendered inside the content area instead */}
      </div>

      {/* Modals */}
      {showAddSpace && <AddSpaceModal onAdd={handleAddSpace} onClose={() => setShowAddSpace(false)} />}
      {showAddItem && selectedSpace && <AddItemModal onAdd={handleAddItem} onClose={() => setShowAddItem(false)} spaceType={selectedSpace.icon} existingIcons={items.map((i) => i.icon)} />}
      {showDeleteSpace && selectedSpace && (
        <DeleteModal title={`Delete "${selectedSpace.name}"?`} message="This space and everything inside it will be permanently removed."
          warning={items.length > 0 ? `${items.length} item${items.length !== 1 ? "s" : ""} and all their documents will be deleted.` : undefined}
          onConfirm={handleDeleteSpace} onCancel={() => setShowDeleteSpace(false)} />
      )}
      {showDeleteItem && selectedItem && (
        <DeleteModal title={`Delete "${selectedItem.name}"?`} message="This item and all its documents will be permanently removed."
          warning={documents.length > 0 ? `${documents.length} document${documents.length !== 1 ? "s" : ""} will be deleted.` : undefined}
          onConfirm={handleDeleteItem} onCancel={() => setShowDeleteItem(false)} />
      )}
      {deleteDocId && docToDelete && (
        <DeleteModal title="Delete document?" message={`"${docToDelete.name}" will be permanently removed.`}
          onConfirm={handleDeleteDoc} onCancel={() => setDeleteDocId(null)} />
      )}
      {contextDeleteSpaceData && (
        <DeleteModal title={`Delete "${contextDeleteSpaceData.space.name}"?`} message="This space and everything inside it will be permanently removed."
          warning={contextDeleteSpaceData.itemCount > 0 ? `${contextDeleteSpaceData.itemCount} item${contextDeleteSpaceData.itemCount !== 1 ? "s" : ""} and all their documents will be deleted.` : undefined}
          onConfirm={handleDeleteSpace} onCancel={() => setContextDeleteSpaceId(null)} />
      )}
      {showBulkUnits && (
        <BulkUnitsModal spaceType={selectedSpace?.icon} onSubmit={handleBulkUnits} onClose={() => setShowBulkUnits(false)} />
      )}
      {renameTarget && (
        <RenameModal
          title={renameTarget.type === "space" ? "Rename Property" : renameTarget.type === "unit" ? "Rename Unit" : "Rename Asset"}
          currentName={renameTarget.name}
          onRename={handleRenameTarget}
          onCancel={() => setRenameTarget(null)}
        />
      )}
      {changeIconTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setChangeIconTarget(null)}>
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold dark:text-white">Change Icon</h2>
              <p className="text-sm text-gray-400 mt-1">Choose an icon for this asset</p>
            </div>
            <div className="px-6 pb-6 grid grid-cols-5 gap-2 max-h-80 overflow-y-auto">
              {ITEM_PRESETS.map((p) => (
                <button key={p.key} onClick={async () => {
                  await updateItem(changeIconTarget.id, { icon: p.key });
                  if (selectedUnitId) setItems(await getItemsForUnit(selectedUnitId));
                  else if (selectedSpaceId) {
                    const spaceItems = await getItemsForSpace(selectedSpaceId);
                    setItems(spaceItems.filter((i) => !i.unitId));
                  }
                  setChangeIconTarget(null);
                  toast(`Icon changed`);
                }}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 cursor-pointer transition-all ${
                    changeIconTarget.currentIcon === p.key ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}>
                  <div className="w-9 h-9" dangerouslySetInnerHTML={{ __html: p.svg }} />
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center truncate w-full">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {contextDeleteUnitData && (
        <DeleteModal title={`Delete "${contextDeleteUnitData.unit.name}"?`} message="This unit and all its assets will be permanently removed."
          warning={contextDeleteUnitData.assetCount > 0 ? `${contextDeleteUnitData.assetCount} asset${contextDeleteUnitData.assetCount !== 1 ? "s" : ""} and all their documents will be deleted.` : undefined}
          onConfirm={handleContextDeleteUnit} onCancel={() => setContextDeleteUnitId(null)} />
      )}
      {contextDeleteItemData && (
        <DeleteModal title={`Delete "${contextDeleteItemData.item.name}"?`} message="This item and all its documents will be permanently removed."
          warning={contextDeleteItemData.docCount > 0 ? `${contextDeleteItemData.docCount} document${contextDeleteItemData.docCount !== 1 ? "s" : ""} will be deleted.` : undefined}
          onConfirm={handleContextDeleteItem} onCancel={() => setContextDeleteItemId(null)} />
      )}
      {showItemPicker && items.length > 0 && (
        <ItemPicker
          items={items}
          onSelect={handleItemPickerSelect}
          onCancel={() => { setShowItemPicker(false); setPendingFiles([]); }}
        />
      )}
      {/* New space welcome */}
      {newSpaceWelcome && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="text-7xl mb-4" style={{ animation: "bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
              {newSpaceWelcome.emoji}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{newSpaceWelcome.name}</h2>
            <p className="text-white/60 text-sm">Setting up your space...</p>
          </div>
        </div>
      )}

      {analyzeModal.visible && (
        <AnalyzeModal
          fileName={analyzeModal.fileName}
          isImage={analyzeModal.isImage}
          extractedText={analyzeModal.extractedText}
          suggestedName={analyzeModal.suggestedName}
          stage={analyzeModal.stage}
          engine={analyzeModal.engine}
          fileCount={uploadCount.total > 1 ? uploadCount : undefined}
          onAccept={handleAnalyzeAccept}
          onSkip={handleAnalyzeSkip}
        />
      )}
      {previewDoc && <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />}
      {showAskAI && <AskAI
        documents={askAIDocuments}
        onClose={() => setShowAskAI(false)}
        onNavigateToItem={async (spaceId, itemId) => {
          setShowAskAI(false);
          setSelectedSpaceId(spaceId);
          setItems(await getItemsForSpace(spaceId));
          await selectItem(itemId);
        }}
      />}
    </div>
  );
}

// Custom asset form with live icon preview and icon picker
function CustomAssetForm({ customName, onNameChange, onAdd, onCancel, findIcon }: {
  customName: string; onNameChange: (v: string) => void;
  onAdd: (iconOverride?: string) => void; onCancel: () => void; findIcon: (name: string) => string;
}) {
  const [overrideIcon, setOverrideIcon] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const autoIcon = customName.trim() ? findIcon(customName.trim()) : "custom";
  const activeIcon = overrideIcon || autoIcon;
  const activePreset = activeIcon !== "custom" ? getItemPreset(activeIcon) : null;

  // Generic icon SVG at full size to match preset icons
  const genericSvg = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20a4 4 0 014-4h12l4 4h20a4 4 0 014 4v24a4 4 0 01-4 4H14a4 4 0 01-4-4V20z" fill="#94a3b8"/>
    <path d="M10 24h44v24a4 4 0 01-4 4H14a4 4 0 01-4-4V24z" fill="#7e8a9a"/>
  </svg>`;

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-[#1a2332] shadow-md border-2 border-dashed border-blue-400 dark:border-blue-600">
      {/* Clickable icon */}
      <button onClick={() => setShowPicker(!showPicker)} className="cursor-pointer mb-2 relative group" title="Change icon">
        <div className="w-10 h-10" dangerouslySetInnerHTML={{ __html: activePreset?.svg || genericSvg }} />
        <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      </button>

      {/* Icon picker dropdown */}
      {showPicker && (
        <div className="mb-2 grid grid-cols-5 gap-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl max-h-32 overflow-y-auto">
          {ITEM_PRESETS.slice(0, 30).map((p) => (
            <button key={p.key} onClick={() => { setOverrideIcon(p.key); setShowPicker(false); }}
              title={p.label}
              className={`w-8 h-8 rounded-lg cursor-pointer transition-all ${activeIcon === p.key ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
              <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: p.svg }} />
            </button>
          ))}
        </div>
      )}

      <input type="text" value={customName} onChange={(e) => { onNameChange(e.target.value); if (!overrideIcon) setOverrideIcon(null); }}
        onKeyDown={(e) => { if (e.key === "Enter") onAdd(overrideIcon || undefined); if (e.key === "Escape") onCancel(); }}
        placeholder="Asset name..."
        autoFocus
        className="w-full text-sm font-semibold dark:text-white bg-transparent outline-none mb-1 placeholder-gray-400" />
      {activePreset && customName.trim() && !overrideIcon && (
        <p className="text-[10px] text-blue-500 mb-1">Auto: {activePreset.label} icon · <button onClick={() => setShowPicker(true)} className="underline cursor-pointer">change</button></p>
      )}
      {overrideIcon && activePreset && (
        <p className="text-[10px] text-blue-500 mb-1">{activePreset.label} icon · <button onClick={() => { setOverrideIcon(null); setShowPicker(false); }} className="underline cursor-pointer">reset</button></p>
      )}
      <div className="flex items-center gap-2">
        <button onClick={() => onAdd(overrideIcon || undefined)} disabled={!customName.trim()}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 cursor-pointer disabled:opacity-40">Add</button>
        <button onClick={onCancel}
          className="text-xs text-gray-400 cursor-pointer">Cancel</button>
      </div>
    </div>
  );
}

// Quick setup component — multi-select presets + custom asset with auto-icon
function QuickSetup({ spaceIcon, spaceName, onAdd }: {
  spaceIcon: string;
  spaceName: string;
  onAdd: (items: { name: string; icon: string }[]) => Promise<void>;
}) {
  const presets = getPresetsForSpaceType(spaceIcon).slice(0, 12);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customItems, setCustomItems] = useState<{ name: string; icon: string }[]>([]);
  const [adding, setAdding] = useState(false);

  function togglePreset(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Auto-suggest icon from preset labels
  // Keyword aliases for better auto-icon matching
  const iconAliases: Record<string, string[]> = {
    "property-docs": ["property", "tax", "insurance", "hoa", "deed", "title", "mortgage", "assessment", "permit", "certificate of occupancy"],
    engine: ["car", "truck", "suv", "auto", "automobile", "van", "vehicle", "engine", "motor"],
    hvac: ["hvac", "ac", "air condition", "heating", "furnace", "heat pump", "thermostat"],
    "water-heater": ["water heater", "hot water", "boiler", "tankless"],
    dishwasher: ["dish", "dishwasher"],
    refrigerator: ["fridge", "refrigerator", "freezer"],
    washer: ["washer", "washing machine", "laundry"],
    dryer: ["dryer", "clothes dryer"],
    oven: ["oven", "stove", "range", "cooktop"],
    microwave: ["microwave"],
    lawnmower: ["lawn", "mower", "yard", "landscap"],
    pool: ["pool", "swimming", "spa", "hot tub"],
    grill: ["grill", "bbq", "barbecue"],
    roof: ["roof", "roofing", "shingle"],
    plumbing: ["plumb", "pipe", "drain", "faucet", "toilet", "sink"],
    electrical: ["electric", "wiring", "outlet", "breaker", "panel"],
    security: ["security", "alarm", "camera", "surveillance"],
    "fire-system": ["smoke", "fire", "detector", "carbon monoxide", "sprinkler"],
    tv: ["tv", "television", "monitor", "screen"],
    computer: ["computer", "laptop", "desktop", "pc"],
    furniture: ["furniture", "couch", "sofa", "bed", "table", "cabinet"],
    tires: ["tire", "wheel"],
    brakes: ["brake"],
    battery: ["battery"],
    "boat-engine": ["boat", "marine", "watercraft", "jet ski"],
    printer: ["printer", "copier", "scanner"],
    desk: ["desk", "workstation"],
    chair: ["chair", "seat"],
  };

  function findIconForName(name: string): string {
    const lower = name.toLowerCase();
    // Check aliases first
    for (const [key, aliases] of Object.entries(iconAliases)) {
      if (aliases.some((a) => lower.includes(a) || a.includes(lower))) {
        return key;
      }
    }
    // Fall back to label matching
    const match = ITEM_PRESETS.find((p) =>
      p.label.toLowerCase().includes(lower) || lower.includes(p.label.toLowerCase())
    );
    return match?.key || "custom";
  }

  function addCustom(iconOverride?: string) {
    if (!customName.trim()) return;
    const icon = iconOverride || findIconForName(customName.trim());
    setCustomItems((prev) => [...prev, { name: customName.trim(), icon }]);
    setCustomName("");
    setShowCustom(false);
  }

  function removeCustom(index: number) {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalCount = selected.size + customItems.length;

  async function handleAdd() {
    if (totalCount === 0) return;
    setAdding(true);
    const items: { name: string; icon: string }[] = [];
    for (const key of selected) {
      const preset = presets.find((p) => p.key === key);
      if (preset) items.push({ name: preset.label, icon: preset.key });
    }
    items.push(...customItems);
    await onAdd(items);
    setAdding(false);
  }

  return (
    <>
      <p className="text-lg font-bold dark:text-white mb-2">Set up {spaceName}</p>
      <p className="text-sm text-gray-400 mb-5">Select the assets this property has</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {presets.map((preset) => {
          const isSelected = selected.has(preset.key);
          return (
            <button key={preset.key} onClick={() => togglePreset(preset.key)}
              className={`rounded-2xl p-4 text-left no-min-size transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 shadow-md"
                  : "bg-white dark:bg-[#1a2332] shadow-md hover:shadow-lg active:scale-95"
              }`}>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="w-10 h-10 mb-2" dangerouslySetInnerHTML={{ __html: preset.svg }} />
              <p className="text-sm font-semibold dark:text-white">{preset.label}</p>
            </button>
          );
        })}

        {/* Custom items already added */}
        {customItems.map((item, i) => {
          const preset = item.icon !== "custom" ? getItemPreset(item.icon) : null;
          return (
            <div key={`custom-${i}`} className="rounded-2xl p-4 text-left bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 shadow-md relative">
              <button onClick={() => removeCustom(i)} className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center cursor-pointer">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {preset ? (
                <div className="w-10 h-10 mb-2" dangerouslySetInnerHTML={{ __html: preset.svg }} />
              ) : (
                <div className="w-10 h-10 mb-2" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 64 64" fill="none"><path d="M10 20a4 4 0 014-4h12l4 4h20a4 4 0 014 4v24a4 4 0 01-4 4H14a4 4 0 01-4-4V20z" fill="#94a3b8"/><path d="M10 24h44v24a4 4 0 01-4 4H14a4 4 0 01-4-4V24z" fill="#7e8a9a"/></svg>` }} />
              )}
              <p className="text-sm font-semibold dark:text-white">{item.name}</p>
            </div>
          );
        })}

        {/* Add custom button / form */}
        {showCustom ? (
          <CustomAssetForm
            customName={customName}
            onNameChange={setCustomName}
            onAdd={addCustom}
            onCancel={() => { setShowCustom(false); setCustomName(""); }}
            findIcon={findIconForName}
          />
        ) : (
          <button onClick={() => setShowCustom(true)}
            className="rounded-2xl p-4 text-left bg-white dark:bg-[#1a2332] shadow-md hover:shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer no-min-size active:scale-95">
            <div className="w-10 h-10 mb-2" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 64 64" fill="none"><path d="M10 20a4 4 0 014-4h12l4 4h20a4 4 0 014 4v24a4 4 0 01-4 4H14a4 4 0 01-4-4V20z" fill="#cbd5e1"/><path d="M10 24h44v24a4 4 0 01-4 4H14a4 4 0 01-4-4V24z" fill="#b0bec5"/></svg>` }} />
            <p className="text-sm font-semibold text-gray-400">Custom...</p>
          </button>
        )}
      </div>

      {/* Add button */}
      {totalCount > 0 && (
        <button onClick={handleAdd} disabled={adding}
          className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all font-semibold text-sm shadow-lg shadow-blue-500/25 cursor-pointer">
          {adding ? "Adding..." : `Add ${totalCount} Asset${totalCount !== 1 ? "s" : ""}`}
        </button>
      )}
    </>
  );
}

// Helper component for unit cards that loads its own item count
function UnitCard({ unit, onSelect, onRename, onDelete, canEdit }: {
  unit: Unit;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  canEdit?: boolean;
}) {
  const [assetCount, setAssetCount] = useState(0);

  useEffect(() => {
    getItemsForUnit(unit.id).then((items) => setAssetCount(items.length));
  }, [unit.id]);

  return (
    <div onClick={onSelect}
      className="group card rounded-2xl p-4 text-left active:scale-[0.97] transition-all hover:shadow-lg cursor-pointer no-min-size relative">
      {canEdit && (
        <div className="absolute top-2 right-2 z-10">
          <ContextMenu items={[
            { label: "Rename", icon: "rename", onClick: onRename },
            { label: "Delete", icon: "delete", danger: true, onClick: onDelete },
          ]} />
        </div>
      )}
      <span className="text-3xl mb-2 block">🚪</span>
      <p className="font-bold text-sm dark:text-white truncate">{unit.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{assetCount} asset{assetCount !== 1 ? "s" : ""}</p>
    </div>
  );
}
