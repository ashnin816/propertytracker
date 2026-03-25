"use client";

import { useAuth } from "@/components/AuthProvider";
import LoginPage from "@/components/LoginPage";
import SuperAdminPanel from "@/components/SuperAdminPanel";
import AppLayout from "@/components/AppLayout";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-[#0c1222]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === "super_admin") {
    return <SuperAdminPanel />;
  }

  return <AppLayout />;
}
