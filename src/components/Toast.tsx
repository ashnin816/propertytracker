"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "error";
  action?: { label: string; onClick: () => void };
  exiting: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: Toast["type"], action?: Toast["action"]) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success", action?: Toast["action"]) => {
    const id = crypto.randomUUID();
    const duration = action ? 5000 : 2500;
    setToasts((prev) => [...prev, { id, message, type, action, exiting: false }]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    }, duration);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration + 500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto transition-all duration-500 ease-out ${
              t.exiting
                ? "opacity-0 translate-x-8 scale-95"
                : "opacity-100 translate-x-0 scale-100"
            }`}
            style={{ animation: t.exiting ? undefined : "toast-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 px-4 py-3.5 flex items-center gap-3 min-w-[220px] max-w-[380px] backdrop-blur-xl">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                t.type === "success"
                  ? "bg-emerald-100 dark:bg-emerald-500/20"
                  : t.type === "error"
                  ? "bg-red-100 dark:bg-red-500/20"
                  : "bg-blue-100 dark:bg-blue-500/20"
              }`}>
                {t.type === "success" ? (
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : t.type === "error" ? (
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 min-w-0 truncate">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action!.onClick();
                    setToasts((prev) => prev.filter((x) => x.id !== t.id));
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex-shrink-0 no-min-size px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  {t.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
