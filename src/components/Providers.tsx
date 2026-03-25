"use client";

import { ReactNode } from "react";
import { ToastProvider } from "./Toast";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import PageTransition from "./PageTransition";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <PageTransition>{children}</PageTransition>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
