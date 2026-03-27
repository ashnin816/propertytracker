"use client";

import { useState } from "react";
import { SPACE_ICONS, getSpaceColors, getPresetsForSpaceType, ITEM_PRESETS, getItemPreset } from "@/lib/presets";

interface WelcomeWizardProps {
  onComplete: (spaceName: string, spaceIcon: string, assets: { name: string; icon: string }[]) => Promise<void>;
  onDismiss: () => void;
  orgName?: string;
}

export default function WelcomeWizard({ onComplete, onDismiss, orgName }: WelcomeWizardProps) {
  const [step, setStep] = useState(0);
  const [spaceIcon, setSpaceIcon] = useState("residential");
  const [spaceName, setSpaceName] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [customAssets, setCustomAssets] = useState<{ name: string; icon: string }[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedSpace = SPACE_ICONS.find((i) => i.key === spaceIcon) || SPACE_ICONS[0];
  const colors = getSpaceColors(spaceIcon);
  const presets = getPresetsForSpaceType(spaceIcon).slice(0, 12);
  const totalAssets = selectedAssets.size + customAssets.length + 1; // +1 for Property Documents

  function findIconForName(name: string): string {
    const lower = name.toLowerCase();
    const match = ITEM_PRESETS.find((p) =>
      p.label.toLowerCase().includes(lower) || lower.includes(p.label.toLowerCase())
    );
    return match?.key || "custom";
  }

  function addCustom() {
    if (!customName.trim()) return;
    const icon = findIconForName(customName.trim());
    setCustomAssets((prev) => [...prev, { name: customName.trim(), icon }]);
    setCustomName("");
    setShowCustom(false);
  }

  async function handleComplete() {
    setCreating(true);
    const assets: { name: string; icon: string }[] = [
      { name: "Property Documents", icon: "property-docs" },
    ];
    for (const key of selectedAssets) {
      const preset = presets.find((p) => p.key === key);
      if (preset) assets.push({ name: preset.label, icon: preset.key });
    }
    assets.push(...customAssets);
    await onComplete(spaceName.trim(), spaceIcon, assets);
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0c1222] z-50 flex items-center justify-center">
      <div className="w-full max-w-lg px-6">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-8 bg-blue-600" : i < step ? "w-6 bg-blue-300" : "w-6 bg-gray-200 dark:bg-gray-700"
            }`} />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 text-blue-600">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 4L2 22h6v20a3 3 0 003 3h26a3 3 0 003-3V22h6L24 4z" fill="currentColor" opacity="0.2"/>
                <path d="M24 4L2 22h6v20a3 3 0 003 3h26a3 3 0 003-3V22h6L24 4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold dark:text-white mb-3">Welcome to PropertyTracker+</h1>
            {orgName && <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">{orgName}</p>}
            <p className="text-gray-400 mb-8">Let&apos;s set up your first property in under a minute.</p>
            <button onClick={() => setStep(1)}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold text-base shadow-lg shadow-blue-500/25 cursor-pointer">
              Get Started
            </button>
            <p className="mt-4">
              <button onClick={onDismiss} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">Skip for now</button>
            </p>
          </div>
        )}

        {/* Step 1: Property Type */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold dark:text-white mb-2 text-center">What type of property?</h2>
            <p className="text-sm text-gray-400 mb-6 text-center">Select the type that best describes your property</p>
            <div className="grid grid-cols-4 gap-2 mb-8">
              {SPACE_ICONS.map((icon) => {
                const iconColors = getSpaceColors(icon.key);
                const isSelected = spaceIcon === icon.key;
                return (
                  <button key={icon.key} onClick={() => setSpaceIcon(icon.key)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all cursor-pointer ${
                      isSelected ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-105" : "hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95"
                    }`}>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-10 h-10 ${isSelected ? iconColors.iconColor : "text-gray-400"}`}
                      dangerouslySetInnerHTML={{ __html: icon.svg }} />
                    <span className={`text-[10px] font-medium ${isSelected ? "text-blue-600" : "text-gray-400"}`}>{icon.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium cursor-pointer">Back</button>
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer">Continue</button>
            </div>
          </div>
        )}

        {/* Step 2: Property Name */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 ${colors.iconColor}`}
                dangerouslySetInnerHTML={{ __html: selectedSpace.svg }} />
              <h2 className="text-2xl font-bold dark:text-white mb-2">Name your property</h2>
            </div>
            <input type="text" value={spaceName} onChange={(e) => setSpaceName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && spaceName.trim()) setStep(3); }}
              placeholder={selectedSpace.placeholder || "Enter property name..."}
              autoFocus
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#1a2332] dark:text-white rounded-xl px-5 py-4 text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-8" />
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium cursor-pointer">Back</button>
              <button onClick={() => setStep(3)} disabled={!spaceName.trim()}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Add Assets */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold dark:text-white mb-2 text-center">What assets does {spaceName} have?</h2>
            <p className="text-sm text-gray-400 mb-5 text-center">Select all that apply. You can add more later.</p>
            <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
              {/* Property Documents — always selected */}
              <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 opacity-75 relative">
                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="w-8 h-8 mb-1" dangerouslySetInnerHTML={{ __html: getItemPreset("property-docs")?.svg || "" }} />
                <p className="text-[10px] font-medium dark:text-white truncate">Property Docs</p>
              </div>

              {presets.map((preset) => {
                const isSelected = selectedAssets.has(preset.key);
                return (
                  <button key={preset.key} onClick={() => {
                    setSelectedAssets((prev) => {
                      const next = new Set(prev);
                      if (next.has(preset.key)) next.delete(preset.key); else next.add(preset.key);
                      return next;
                    });
                  }}
                    className={`rounded-xl p-3 text-left transition-all cursor-pointer relative ${
                      isSelected ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95"
                    }`}>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="w-8 h-8 mb-1" dangerouslySetInnerHTML={{ __html: preset.svg }} />
                    <p className="text-[10px] font-medium dark:text-white truncate">{preset.label}</p>
                  </button>
                );
              })}

              {/* Custom */}
              {customAssets.map((item, i) => (
                <div key={`c-${i}`} className="rounded-xl p-3 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 relative">
                  <button onClick={() => setCustomAssets((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {getItemPreset(item.icon) ? (
                    <div className="w-8 h-8 mb-1" dangerouslySetInnerHTML={{ __html: getItemPreset(item.icon)!.svg }} />
                  ) : (
                    <div className="w-8 h-8 mb-1 text-2xl">📦</div>
                  )}
                  <p className="text-[10px] font-medium dark:text-white truncate">{item.name}</p>
                </div>
              ))}

              {showCustom ? (
                <div className="rounded-xl p-3 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-blue-400">
                  <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustom(); if (e.key === "Escape") setShowCustom(false); }}
                    placeholder="Name..." autoFocus
                    className="w-full text-[10px] font-medium dark:text-white bg-transparent outline-none mb-1" />
                  <div className="flex gap-1">
                    <button onClick={addCustom} disabled={!customName.trim()} className="text-[9px] text-blue-500 cursor-pointer disabled:opacity-40">Add</button>
                    <button onClick={() => { setShowCustom(false); setCustomName(""); }} className="text-[9px] text-gray-400 cursor-pointer">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCustom(true)}
                  className="rounded-xl p-3 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 transition-colors cursor-pointer active:scale-95">
                  <div className="w-8 h-8 mb-1 flex items-center justify-center text-gray-400 text-lg">+</div>
                  <p className="text-[10px] font-medium text-gray-400">Custom</p>
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium cursor-pointer">Back</button>
              <button onClick={() => setStep(4)}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer">
                Continue ({totalAssets} asset{totalAssets !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-4">{selectedSpace.emoji}</div>
            <h2 className="text-2xl font-bold dark:text-white mb-2">You&apos;re all set!</h2>
            <p className="text-gray-400 mb-2">
              <strong className="dark:text-white">{spaceName}</strong> is ready with {totalAssets} asset{totalAssets !== 1 ? "s" : ""}.
            </p>
            <p className="text-sm text-gray-400 mb-8">Start uploading documents or email them to your inbox address.</p>
            <button onClick={handleComplete} disabled={creating}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold text-base shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-50">
              {creating ? "Setting up..." : "Start Managing →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
