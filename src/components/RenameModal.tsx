"use client";

import { useState, useEffect, useRef } from "react";

interface RenameModalProps {
  title: string;
  currentName: string;
  onRename: (newName: string) => void;
  onCancel: () => void;
}

export default function RenameModal({ title, currentName, onRename, onCancel }: RenameModalProps) {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      onRename(name.trim());
    } else {
      onCancel();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onCancel}>
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-sm animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold dark:text-white">{title}</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow no-min-size"
            autoFocus
          />
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm no-min-size cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || name.trim() === currentName}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm no-min-size cursor-pointer">
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
