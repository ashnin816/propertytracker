"use client";

import { Item } from "@/lib/types";
import { getItemPreset } from "@/lib/presets";
import { getCustomIcon } from "@/lib/icons";

interface ItemPickerProps {
  items: Item[];
  onSelect: (itemId: string) => void;
  onCancel: () => void;
}

export default function ItemPicker({ items, onSelect, onCancel }: ItemPickerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold dark:text-white">Which item is this for?</h2>
          <p className="text-sm text-gray-400 mt-0.5">Select where to attach the document</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {items.map((item) => {
            const preset = item.icon !== "custom" && !item.icon.startsWith("icon-") ? getItemPreset(item.icon) : null;
            const ci = item.icon.startsWith("icon-") ? getCustomIcon(item.icon) : null;
            const svg = preset?.svg || ci?.svg || null;
            const emoji = preset?.emoji || null;

            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-colors text-left no-min-size cursor-pointer"
              >
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : svg ? (
                  <div className="w-10 h-10 flex-shrink-0" dangerouslySetInnerHTML={{ __html: svg }} />
                ) : (
                  <span className="text-2xl flex-shrink-0">{emoji || "📦"}</span>
                )}
                <p className="text-sm font-medium dark:text-gray-200 truncate">{item.name}</p>
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm no-min-size"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
