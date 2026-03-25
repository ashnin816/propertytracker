"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/auth";
import { Space } from "@/lib/types";
import TeamPanel from "./TeamPanel";

interface SettingsPageProps {
  spaces: Space[];
  user: UserProfile | null;
  theme: string;
  onToggleTheme: () => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  org_admin: "Admin",
  manager: "Manager",
  technician: "Technician",
  tenant: "Tenant",
};

type Tab = "profile" | "team" | "appearance";

export default function SettingsPage({ spaces, user, theme, onToggleTheme, onLogout }: SettingsPageProps) {
  const isAdmin = user?.role === "org_admin" || user?.role === "super_admin";
  const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
    { key: "profile", label: "Profile" },
    { key: "team", label: "Team", adminOnly: true },
    { key: "appearance", label: "Appearance" },
  ];
  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        {visibleTabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all no-min-size cursor-pointer relative ${
              activeTab === tab.key
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && user && (
        <div className="max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-bold dark:text-white">{user.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-sm font-medium dark:text-gray-200">Role</p>
                <p className="text-xs text-gray-400">{ROLE_LABELS[user.role] || user.role}</p>
              </div>
            </div>

            {user.orgName && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium dark:text-gray-200">Organization</p>
                  <p className="text-xs text-gray-400">{user.orgName}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <button onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer no-min-size">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && isAdmin && (
        <TeamPanel spaces={spaces} />
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="max-w-lg">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                {theme === "light" ? (
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium dark:text-gray-200">Theme</p>
                <p className="text-xs text-gray-400">{theme === "light" ? "Light mode" : "Dark mode"}</p>
              </div>
            </div>
            <button onClick={onToggleTheme}
              className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer no-min-size ${
                theme === "dark" ? "bg-blue-600" : "bg-gray-300"
              }`}>
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                theme === "dark" ? "translate-x-5.5" : "translate-x-0.5"
              }`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
