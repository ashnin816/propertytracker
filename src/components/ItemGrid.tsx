"use client";

import Link from "next/link";
import { Item } from "@/lib/types";
import { getItemPreset, getCategoryColors, getPresetsForSpaceType, ItemPreset } from "@/lib/presets";
import { getCustomIcon } from "@/lib/icons";
// Note: getDocumentCountForItem is now async — counts should be passed as props
// This component is no longer used in the sidebar layout

interface ItemGridProps {
  items: Item[];
  spaceType?: string;
  onQuickAdd?: (name: string, icon: string) => void;
}

export default function ItemGrid({ items, spaceType, onQuickAdd }: ItemGridProps) {
  if (items.length === 0) {
    const presets = spaceType ? getPresetsForSpaceType(spaceType).slice(0, 8) : [];

    return (
      <div>
        <div className="text-center pt-6 pb-6">
          <p className="text-lg font-bold dark:text-white">What&apos;s in this space?</p>
          <p className="text-sm text-gray-400 mt-1">Tap to add, then upload documents</p>
        </div>

        {presets.length > 0 && onQuickAdd && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {presets.map((preset: ItemPreset) => {
              const colors = getCategoryColors(preset.category);
              return (
                <button
                  key={preset.key}
                  onClick={() => onQuickAdd(preset.label, preset.key)}
                  className={`group block rounded-2xl bg-gradient-to-br ${colors.cardGradient} p-4 active:scale-95 transition-all duration-150 shadow-md hover:shadow-lg relative overflow-hidden text-left`}
                >
                  <div className="absolute -right-3 -bottom-3 opacity-10">
                    <div className="w-20 h-20 text-white" dangerouslySetInnerHTML={{ __html: preset.svg }} />
                  </div>
                  <div className="relative z-10">
                    <div className="w-9 h-9 text-white/90 mb-2" dangerouslySetInnerHTML={{ __html: preset.svg }} />
                    <p className="text-sm font-semibold text-white">{preset.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-center text-sm text-gray-400">
          Or tap <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full text-white text-[10px] font-bold align-middle mx-0.5">+</span> for more options
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, index) => {
        const preset = item.icon !== "custom" && !item.icon.startsWith("icon-") ? getItemPreset(item.icon) : null;
        const customIcon = item.icon.startsWith("icon-") ? getCustomIcon(item.icon) : null;
        const colors = preset ? getCategoryColors(preset.category) : null;
        const cardGradient = colors?.cardGradient || customIcon?.color || "from-gray-400 to-gray-600";
        const iconSvg = preset?.svg || customIcon?.svg || null;
        const docCount: number = 0; // TODO: pass counts as props

        return (
          <Link
            key={item.id}
            href={`/item/${item.id}`}
            className={`group flex items-center rounded-2xl overflow-hidden active:scale-[0.97] transition-all duration-200 animate-fade-in-up shadow-md hover:shadow-xl bg-gradient-to-br ${cardGradient} relative`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Background watermark */}
            <div className="absolute -right-4 -bottom-4 opacity-10">
              {iconSvg && (
                <div className="w-28 h-28 text-white" dangerouslySetInnerHTML={{ __html: iconSvg }} />
              )}
            </div>

            {/* Photo thumbnail */}
            {item.photoUrl ? (
              <div className="w-24 h-24 flex-shrink-0 overflow-hidden">
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
                {iconSvg ? (
                  <div className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform duration-200"
                    dangerouslySetInnerHTML={{ __html: iconSvg }} />
                ) : (
                  <div className="w-12 h-12 text-white/60">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Text content */}
            <div className="flex-1 min-w-0 px-4 py-4 relative z-10">
              <p className="font-bold text-base text-white truncate">{item.name}</p>
              <div className="flex items-center gap-3 mt-1">
                {preset && (
                  <span className="text-xs text-white/60">{preset.category}</span>
                )}
                {docCount > 0 && (
                  <>
                    {preset && <span className="text-white/30">&middot;</span>}
                    <span className="text-xs text-white/60">
                      {docCount} doc{docCount !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Chevron */}
            <svg className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all mr-4 flex-shrink-0 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
