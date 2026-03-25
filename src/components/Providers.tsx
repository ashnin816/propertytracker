"use client";

import { ReactNode } from "react";
import { ToastProvider } from "./Toast";
import { ThemeProvider } from "./ThemeProvider";
import PageTransition from "./PageTransition";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PageTransition>{children}</PageTransition>
      </ToastProvider>
    </ThemeProvider>
  );
}
