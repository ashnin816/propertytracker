"use client";

import { useState } from "react";
import { CUSTOM_ICONS } from "@/lib/icons";

interface IconPickerProps {
  onSelect: (iconKey: string) => void;
  onCancel: () => void;
}

export default function IconPicker({ onSelect, onCancel }: IconPickerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-3">
          <h2 className="text-lg font-bold dark:text-white">Choose an Icon</h2>
          <p className="text-sm text-gray-400 mt-0.5">Pick a visual for this item</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {CUSTOM_ICONS.map((icon) => (
              <button
                key={icon.key}
                onClick={() => setSelected(icon.key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-150 ${
                  selected === icon.key
                    ? `bg-gradient-to-br ${icon.color} shadow-md scale-105`
                    : "hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95"
                }`}
              >
                <div
                  className={`w-8 h-8 ${selected === icon.key ? "text-white" : "text-gray-500 dark:text-gray-400"}`}
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />
                <span className={`text-[10px] font-medium leading-tight text-center ${
                  selected === icon.key ? "text-white/90" : "text-gray-500 dark:text-gray-400"
                }`}>
                  {icon.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
          >
            Use Icon
          </button>
        </div>
      </div>
    </div>
  );
}
