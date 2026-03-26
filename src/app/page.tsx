"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import LoginPage from "@/components/LoginPage";
import SuperAdminPanel from "@/components/SuperAdminPanel";
import AppLayout from "@/components/AppLayout";
import ResetPasswordPage from "@/components/ResetPasswordPage";
import { getProfile } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const [viewingOrg, setViewingOrg] = useState<{ id: string; name: string } | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);

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

  // Force password reset on first login
  if (user.mustResetPassword && !passwordReset) {
    return <ResetPasswordPage user={user} onComplete={async () => {
      setPasswordReset(true);
      // Refresh the profile so mustResetPassword is cleared
      const profile = await getProfile();
      if (profile) {
        // Force re-render with updated user — the AuthProvider will pick it up on next auth event
        window.location.reload();
      }
    }} />;
  }

  // Super admin viewing a tenant
  if (user.role === "super_admin" && viewingOrg) {
    return <AppLayout mirrorOrgId={viewingOrg.id} mirrorOrgName={viewingOrg.name} onExitMirror={() => setViewingOrg(null)} />;
  }

  if (user.role === "super_admin") {
    return <SuperAdminPanel onViewTenant={(id, name) => setViewingOrg({ id, name })} />;
  }

  return <AppLayout />;
}
