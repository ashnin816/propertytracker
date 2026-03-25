"use client";

import { useState, useRef } from "react";
import { ITEM_PRESETS, getPresetsForSpaceType, getCategoryColors } from "@/lib/presets";
import { compressImage, isImageDataUrl } from "@/lib/compress";
import IconPicker from "./IconPicker";
import { getCustomIcon } from "@/lib/icons";

interface AddItemModalProps {
  onAdd: (name: string, icon: string, photoUrl: string | null) => void;
  onClose: () => void;
  spaceType?: string;
}

export default function AddItemModal({ onAdd, onClose, spaceType }: AddItemModalProps) {
  const [view, setView] = useState<"presets" | "custom">("presets");
  const [customName, setCustomName] = useState("");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availablePresets = spaceType ? getPresetsForSpaceType(spaceType) : ITEM_PRESETS;
  const categories = [...new Set(availablePresets.map((p) => p.category))];
  const filteredPresets = searchQuery
    ? availablePresets.filter((p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availablePresets;
  const filteredCategories = categories.filter((cat) =>
    filteredPresets.some((p) => p.category === cat)
  );

  function handlePresetSelect(preset: (typeof ITEM_PRESETS)[0]) {
    onAdd(preset.label, preset.key, null);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      const compressed = isImageDataUrl(raw) ? await compressImage(raw) : raw;
      setCustomPhoto(compressed);
    };
    reader.readAsDataURL(file);
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim()) return;
    onAdd(customName.trim(), customIcon || "custom", customPhoto);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 px-4 py-12 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {view === "custom" && (
              <button
                onClick={() => setView("presets")}
                className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold">
                {view === "presets" ? "Add Asset" : "Custom Asset"}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {view === "presets"
                  ? "Choose an item or create your own"
                  : "Add a custom asset"}
              </p>
            </div>
          </div>
        </div>

        {view === "presets" ? (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              {/* Search */}
              <div className="mb-4 px-6">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Preset grid by category */}
              {filteredCategories.map((category) => {
                const colors = getCategoryColors(category);
                return (
                  <div key={category} className="mb-5 px-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {filteredPresets
                        .filter((p) => p.category === category)
                        .map((preset) => (
                          <button
                            key={preset.key}
                            onClick={() => handlePresetSelect(preset)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 ${colors.bg} hover:shadow-md active:scale-95 transition-all duration-150`}
                          >
                            <div
                              className={`w-11 h-11 ${colors.icon}`}
                              dangerouslySetInnerHTML={{ __html: preset.svg }}
                            />
                            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                              {preset.label}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })}

              {filteredCategories.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-400 px-6">
                  <p className="text-sm mb-3">No items match &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    onClick={() => {
                      setCustomName(searchQuery);
                      setSearchQuery("");
                      setView("custom");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add &ldquo;{searchQuery}&rdquo; as a custom asset
                  </button>
                </div>
              )}

              {/* Custom item card at the end */}
              {!searchQuery && (
                <div className="mb-2 px-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Custom
                  </h3>
                  <button
                    onClick={() => setView("custom")}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 active:scale-[0.98] transition-all duration-150"
                  >
                    <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700">Add Custom Asset</p>
                      <p className="text-xs text-gray-400">Name it and optionally add a photo</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Cancel */}
            <div className="px-6 pb-4">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCustomSubmit} className="px-6 pb-6 space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Garage Door Opener, Window AC..."
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Visual <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                className="hidden"
              />
              {customPhoto ? (
                <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  <img src={customPhoto} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium text-sm">Change photo</span>
                  </div>
                </div>
              ) : customIcon ? (
                <div className="flex items-center gap-3">
                  {(() => {
                    const ci = getCustomIcon(customIcon);
                    return ci ? (
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${ci.color} flex items-center justify-center`}>
                        <div className="w-8 h-8 text-white" dangerouslySetInnerHTML={{ __html: ci.svg }} />
                      </div>
                    ) : null;
                  })()}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowIconPicker(true)}
                      className="text-sm text-blue-600 font-medium hover:text-blue-700">Change icon</button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={() => { setCustomIcon(null); fileInputRef.current?.click(); }}
                      className="text-sm text-gray-500 font-medium hover:text-gray-700">Use photo instead</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 active:scale-[0.98] transition-all"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium">Snap a photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 active:scale-[0.98] transition-all"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium">Choose an icon</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
              >
                Add Asset
              </button>
            </div>
          </form>
        )}
      </div>

      {showIconPicker && (
        <IconPicker
          onSelect={(key) => {
            setCustomIcon(key);
            setCustomPhoto(null);
            setShowIconPicker(false);
          }}
          onCancel={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
}
