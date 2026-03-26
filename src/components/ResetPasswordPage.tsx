"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/auth";

interface ResetPasswordPageProps {
  user: UserProfile;
  onComplete: () => void;
}

export default function ResetPasswordPage({ user, onComplete }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", userId: user.id, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onComplete();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-[#0c1222] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold dark:text-white mb-1">Set Your Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {user.name}. Please create a new password to continue.</p>
        </div>

        <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-800 p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="Min 6 characters"
                  minLength={6}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  minLength={6}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-[#0c1222] dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs text-red-600 dark:text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={saving || !password || !confirm}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm cursor-pointer"
            >
              {saving ? "Setting password..." : "Set Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
