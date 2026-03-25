"use client";

import { useState } from "react";
import { Role, ROLE_LABELS, ROLE_DESCRIPTIONS, addMember } from "@/lib/team";
import { Space } from "@/lib/types";

interface InviteModalProps {
  spaces: Space[];
  onInvite: () => void;
  onClose: () => void;
}

const ROLES: Role[] = ["manager", "technician", "tenant"];

export default function InviteModal({ spaces, onInvite, onClose }: InviteModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("manager");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    addMember(name.trim(), email.trim(), role, selectedProperties);
    onInvite();
  }

  function toggleProperty(id: string) {
    setSelectedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold dark:text-white">Invite Team Member</h2>
          <p className="text-sm text-gray-400 mt-1">Add someone to your organization</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-min-size" />
            </div>
          </div>

          {/* Role picker */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Role</label>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all no-min-size cursor-pointer ${
                    role === r ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    role === r ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}>
                    {r === "manager" && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    {r === "technician" && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    {r === "tenant" && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" /></svg>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{ROLE_LABELS[r]}</p>
                    <p className="text-[10px] text-gray-400">{ROLE_DESCRIPTIONS[r]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Property assignment */}
          {role !== "tenant" && spaces.length > 0 && (
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Assign to Properties</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {spaces.map((space) => (
                  <label key={space.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer no-min-size">
                    <input type="checkbox" checked={selectedProperties.includes(space.id)} onChange={() => toggleProperty(space.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 no-min-size" />
                    <span className="text-xs font-medium dark:text-gray-200">{space.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c1222] active:scale-[0.98] transition-all font-medium text-sm no-min-size cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || !email.trim()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm no-min-size cursor-pointer">
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
