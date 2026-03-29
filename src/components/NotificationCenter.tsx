"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface NotificationItem {
  id: string;
  type: "expiring" | "inbox" | "insurance";
  title: string;
  subtitle: string;
  urgency?: "critical" | "warning" | "notice" | "info";
  action: () => void;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
}

function getUrgencyStyles(urgency?: string) {
  switch (urgency) {
    case "critical":
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40";
    case "warning":
      return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40";
    case "notice":
      return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40";
    default:
      return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40";
  }
}

function getUrgencyDot(urgency?: string) {
  switch (urgency) {
    case "critical":
      return "bg-red-500";
    case "warning":
      return "bg-amber-500";
    case "notice":
      return "bg-yellow-500";
    default:
      return "bg-blue-500";
  }
}

function getIcon(type: string) {
  switch (type) {
    case "expiring":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "inbox":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      );
    case "insurance":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function NotificationCenter({ notifications }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const count = notifications.length;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const rect = bellRef.current?.getBoundingClientRect();

  // Group notifications by type
  const expiring = notifications.filter((n) => n.type === "expiring");
  const inbox = notifications.filter((n) => n.type === "inbox");
  const insurance = notifications.filter((n) => n.type === "insurance");

  return (
    <>
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className={`relative p-1.5 rounded-lg transition-colors no-min-size cursor-pointer ${
          open
            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && rect && createPortal(
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
          <div
            ref={dropdownRef}
            className="fixed max-h-[28rem] bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-200/60 dark:border-gray-700 z-[201] overflow-hidden animate-scale-in flex flex-col"
            style={{
              top: rect.bottom + 8,
              right: Math.max(8, window.innerWidth - rect.right),
              left: window.innerWidth < 400 ? 8 : undefined,
              width: window.innerWidth < 400 ? undefined : 320,
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h3 className="text-sm font-semibold dark:text-white">Notifications</h3>
              {count > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{count} item{count !== 1 ? "s" : ""} need attention</p>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {count === 0 ? (
                <div className="px-4 py-10 text-center">
                  <svg className="w-10 h-10 mx-auto text-gray-200 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-500">All clear</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">No items need your attention</p>
                </div>
              ) : (
                <div className="py-1">
                  {/* Expiring documents */}
                  {expiring.length > 0 && (
                    <div>
                      <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Expiring Documents</p>
                      {expiring.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { n.action(); setOpen(false); }}
                          className={`w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer border-l-2 ${getUrgencyStyles(n.urgency)} mx-0`}
                        >
                          <div className={`mt-0.5 flex-shrink-0 ${
                            n.urgency === "critical" ? "text-red-500" :
                            n.urgency === "warning" ? "text-amber-500" :
                            n.urgency === "notice" ? "text-yellow-600 dark:text-yellow-400" :
                            "text-blue-500"
                          }`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium dark:text-gray-200 truncate">{n.title}</p>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getUrgencyDot(n.urgency)}`} />
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{n.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inbox */}
                  {inbox.length > 0 && (
                    <div>
                      <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Inbox</p>
                      {inbox.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { n.action(); setOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                        >
                          <div className="text-blue-500 flex-shrink-0">{getIcon(n.type)}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium dark:text-gray-200">{n.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Missing insurance */}
                  {insurance.length > 0 && (
                    <div>
                      <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Missing Coverage</p>
                      {insurance.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { n.action(); setOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                        >
                          <div className="text-amber-500 flex-shrink-0">{getIcon(n.type)}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium dark:text-gray-200">{n.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
