"use client";

import { useState } from "react";
import { ITEM_PRESETS, getPresetsForSpaceType } from "@/lib/presets";

interface Asset {
  name: string;
  icon: string;
}

interface Template {
  key: string;
  name: string;
  emoji: string;
  description: string;
  assets: Asset[];
}

const TEMPLATES: Template[] = [
  {
    key: "standard",
    name: "Standard Apartment",
    emoji: "🏠",
    description: "Common residential appliances",
    assets: [
      { name: "Refrigerator", icon: "refrigerator" },
      { name: "Oven / Stove", icon: "oven" },
      { name: "Dishwasher", icon: "dishwasher" },
      { name: "HVAC", icon: "hvac" },
      { name: "Washer/Dryer", icon: "washer" },
    ],
  },
  {
    key: "furnished",
    name: "Furnished Unit",
    emoji: "🛋️",
    description: "All appliances + furniture",
    assets: [
      { name: "Refrigerator", icon: "refrigerator" },
      { name: "Oven / Stove", icon: "oven" },
      { name: "Dishwasher", icon: "dishwasher" },
      { name: "HVAC", icon: "hvac" },
      { name: "Washer/Dryer", icon: "washer" },
      { name: "Furniture", icon: "furniture" },
      { name: "TV", icon: "tv" },
    ],
  },
  {
    key: "commercial",
    name: "Commercial Suite",
    emoji: "🏢",
    description: "Office/commercial essentials",
    assets: [
      { name: "HVAC", icon: "hvac" },
      { name: "Electrical", icon: "electrical" },
      { name: "Fire System", icon: "fire-system" },
    ],
  },
  {
    key: "empty",
    name: "Empty",
    emoji: "📦",
    description: "Just the units, no assets",
    assets: [],
  },
];

interface BulkUnitsModalProps {
  spaceType?: string;
  onSubmit: (units: string[], template: { assets: Asset[] } | null) => void | Promise<void>;
  onClose: () => void;
}

export default function BulkUnitsModal({ spaceType, onSubmit, onClose }: BulkUnitsModalProps) {
  const [prefix, setPrefix] = useState("Unit ");
  const [startNum, setStartNum] = useState("101");
  const [endNum, setEndNum] = useState("110");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("standard");
  const [customAssets, setCustomAssets] = useState<Asset[] | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const start = parseInt(startNum) || 0;
  const end = parseInt(endNum) || 0;
  const count = end >= start ? end - start + 1 : 0;
  const isValid = count > 0 && count <= 200;

  const currentTemplate = TEMPLATES.find((t) => t.key === selectedTemplate);
  const activeAssets = customAssets !== null ? customAssets : (currentTemplate?.assets || []);

  function selectTemplate(key: string) {
    setSelectedTemplate(key);
    setCustomAssets(null); // Reset customization when switching templates
  }

  function removeAsset(index: number) {
    const assets = [...activeAssets];
    assets.splice(index, 1);
    setCustomAssets(assets);
  }

  function addAsset(asset: Asset) {
    // Don't add duplicates
    if (activeAssets.some((a) => a.icon === asset.icon && a.name === asset.name)) return;
    setCustomAssets([...activeAssets, asset]);
    setShowAssetPicker(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    const unitNames: string[] = [];
    for (let i = start; i <= end; i++) {
      unitNames.push(`${prefix}${i}`);
    }

    setSubmitting(true);
    await onSubmit(unitNames, activeAssets.length > 0 ? { assets: activeAssets } : null);
    setSubmitting(false);
  }

  // Available presets for adding
  const availablePresets = spaceType
    ? getPresetsForSpaceType(spaceType).filter((p) => !activeAssets.some((a) => a.icon === p.key))
    : ITEM_PRESETS.filter((p) => !activeAssets.some((a) => a.icon === p.key));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-xl font-bold dark:text-white">Add Units</h2>
          <p className="text-sm text-gray-400 mt-1">Create multiple units at once</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <form id="bulk-form" onSubmit={handleSubmit}>
            {/* Unit range */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit Range</label>
              <div className="flex items-center gap-2">
                <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Prefix"
                  className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
                <input type="number" value={startNum} onChange={(e) => setStartNum(e.target.value)} placeholder="Start" autoFocus
                  className="w-20 border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size text-center" />
                <span className="text-gray-400 text-sm">to</span>
                <input type="number" value={endNum} onChange={(e) => setEndNum(e.target.value)} placeholder="End"
                  className="w-20 border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size text-center" />
              </div>
              {isValid && (
                <p className="text-xs text-gray-400 mt-2">
                  Will create <span className="font-semibold text-blue-600">{count}</span> units: {prefix}{start} — {prefix}{end}
                </p>
              )}
              {count > 200 && <p className="text-xs text-red-500 mt-2">Maximum 200 units at a time</p>}
            </div>

            {/* Template picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Starting Template</label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.key} type="button" onClick={() => selectTemplate(t.key)}
                    className={`p-3 rounded-xl text-left transition-all no-min-size cursor-pointer ${
                      selectedTemplate === t.key
                        ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500"
                        : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}>
                    <span className="text-xl mb-1 block">{t.emoji}</span>
                    <p className="text-xs font-semibold dark:text-white">{t.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable asset list */}
            {selectedTemplate !== "empty" && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assets per Unit
                  {customAssets !== null && (
                    <button type="button" onClick={() => setCustomAssets(null)}
                      className="ml-2 text-[10px] text-blue-500 font-normal hover:text-blue-600 no-min-size cursor-pointer">
                      Reset to default
                    </button>
                  )}
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2 space-y-1">
                  {activeAssets.map((asset, i) => (
                    <div key={`${asset.icon}-${i}`} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#1a2332] rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{ITEM_PRESETS.find((p) => p.key === asset.icon)?.emoji || "📦"}</span>
                        <span className="text-xs font-medium dark:text-gray-200">{asset.name}</span>
                      </div>
                      <button type="button" onClick={() => removeAsset(i)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors no-min-size cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add asset button */}
                  {!showAssetPicker ? (
                    <button type="button" onClick={() => setShowAssetPicker(true)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors no-min-size cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Asset
                    </button>
                  ) : (
                    <div className="p-2 bg-white dark:bg-[#1a2332] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">Pick an asset</span>
                        <button type="button" onClick={() => setShowAssetPicker(false)}
                          className="text-[10px] text-gray-400 hover:text-gray-600 no-min-size cursor-pointer">Cancel</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                        {availablePresets.slice(0, 15).map((preset) => (
                          <button key={preset.key} type="button" onClick={() => addAsset({ name: preset.label, icon: preset.key })}
                            className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors no-min-size cursor-pointer">
                            <span className="text-lg">{preset.emoji}</span>
                            <span className="text-[9px] text-gray-500 text-center leading-tight truncate w-full">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {isValid && activeAssets.length > 0 && (
              <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {count} units × {activeAssets.length} assets = <span className="font-bold">{count * activeAssets.length} total assets</span>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Actions — fixed at bottom */}
        <div className="px-6 pb-6 pt-3 flex gap-3 flex-shrink-0 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm no-min-size cursor-pointer">
            Cancel
          </button>
          <button type="submit" form="bulk-form" disabled={!isValid || submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm no-min-size cursor-pointer">
            {submitting ? "Creating..." : `Create ${isValid ? count : 0} Units`}
          </button>
        </div>
      </div>
    </div>
  );
}
