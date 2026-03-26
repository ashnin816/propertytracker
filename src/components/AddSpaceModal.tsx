"use client";

import { useState, useEffect, useRef } from "react";
import { SPACE_ICONS, getSpaceColors } from "@/lib/presets";

interface AddSpaceModalProps {
  onAdd: (name: string, icon: string) => void | Promise<void>;
  onClose: () => void;
}

export default function AddSpaceModal({ onAdd, onClose }: AddSpaceModalProps) {
  const [selectedIcon, setSelectedIcon] = useState("residential");
  const [name, setName] = useState("");
  const [userEdited, setUserEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = SPACE_ICONS.find((i) => i.key === selectedIcon) || SPACE_ICONS[0];
  const colors = getSpaceColors(selectedIcon);

  useEffect(() => {
    if (!userEdited) {
      setName(selected.defaultName);
    }
  }, [selectedIcon, selected.defaultName, userEdited]);

  function handleIconSelect(key: string) {
    setSelectedIcon(key);
    // Focus the name input after picking an icon
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    setUserEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    await onAdd(name.trim(), selectedIcon);
    setSubmitting(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with selected icon preview */}
        <div className={`${selected.key !== "other" ? "bg-gradient-to-br from-blue-50 to-white" : "bg-gray-50"} px-6 pt-6 pb-4 text-center`}>
          <div
            className={`w-16 h-16 mx-auto mb-3 ${colors.iconColor}`}
            dangerouslySetInnerHTML={{ __html: selected.svg }}
          />
          <h2 className="text-xl font-bold">Add a Property</h2>
          <p className="text-sm text-gray-400 mt-1">Select property type and name it</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Icon picker */}
          <div className="py-4">
            <div className="grid grid-cols-4 gap-2">
              {SPACE_ICONS.map((icon) => {
                const iconColors = getSpaceColors(icon.key);
                const isSelected = selectedIcon === icon.key;
                return (
                  <button
                    key={icon.key}
                    type="button"
                    onClick={() => handleIconSelect(icon.key)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? "bg-blue-50 ring-2 ring-blue-500 scale-105"
                        : "hover:bg-gray-50 active:scale-95"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 ${isSelected ? iconColors.iconColor : "text-gray-400"} transition-colors`}
                      dangerouslySetInnerHTML={{ __html: icon.svg }}
                    />
                    <span className={`text-[10px] leading-tight ${isSelected ? "text-blue-600 font-semibold" : "text-gray-400"} transition-colors`}>
                      {icon.label}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-scale-in">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name input */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder={selected.placeholder}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
            >
              {submitting ? "Adding..." : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
