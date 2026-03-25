"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, getProfile, signIn, signOut, onAuthChange, signUp, setupSuperAdmin } from "@/lib/auth";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, orgId?: string, role?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const SUPER_ADMIN_EMAIL = "asheradler@gmail.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial session
    getProfile().then((profile) => {
      setUser(profile);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = onAuthChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const profile = await getProfile();
        if (profile && profile.status === "inactive") {
          await signOut();
          setUser(null);
          return;
        }
        setUser(profile);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    await signIn(email, password);
    const profile = await getProfile();

    // Block inactive users
    if (profile && profile.status === "inactive") {
      await signOut();
      throw new Error("Your account has been deactivated. Contact your organization admin.");
    }

    // Auto-setup super admin on first login
    if (email === SUPER_ADMIN_EMAIL && profile && profile.role !== "super_admin") {
      await setupSuperAdmin();
      const updatedProfile = await getProfile();
      setUser(updatedProfile);
    } else {
      setUser(profile);
    }
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  async function register(email: string, password: string, name: string, orgId?: string, role?: string) {
    await signUp(email, password, name, orgId, role);
    // Profile is created automatically by the database trigger
    const profile = await getProfile();
    setUser(profile);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
