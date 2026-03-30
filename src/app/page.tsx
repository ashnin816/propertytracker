"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import LoginPage from "@/components/LoginPage";
import SuperAdminPanel from "@/components/SuperAdminPanel";
import AppLayout from "@/components/AppLayout";

export default function Home() {
  const { user, loading } = useAuth();
  const [viewingOrg, setViewingOrg] = useState<{ id: string; name: string } | null>(null);

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

  // Super admin viewing a tenant
  if (user.role === "super_admin" && viewingOrg) {
    return <AppLayout mirrorOrgId={viewingOrg.id} mirrorOrgName={viewingOrg.name} onExitMirror={() => setViewingOrg(null)} />;
  }

  if (user.role === "super_admin") {
    return <SuperAdminPanel onViewTenant={(id, name) => setViewingOrg({ id, name })} />;
  }

  if (user.orgStatus === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-[#0c1222] p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold dark:text-white mb-2">Account Suspended</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your organization&apos;s account has been suspended. Please contact your account manager to restore access.
          </p>
          <a href="mailto:support@propertytrackerplus.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  return <AppLayout />;
}
