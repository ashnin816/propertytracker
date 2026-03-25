"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { globalSearch, SearchResult } from "@/lib/supabase-storage";
import { getItemPreset, getCategoryColors, getSpaceIcon, getSpaceColors } from "@/lib/presets";
import { useTheme } from "./ThemeProvider";

interface Breadcrumb {
  label: string;
  href: string;
}

interface AppHeaderProps {
  breadcrumbs?: Breadcrumb[];
  hidden?: boolean;
}

export default function AppHeader({ breadcrumbs, hidden }: AppHeaderProps) {
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    globalSearch(query).then(setResults);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
    if (result.type === "space") {
      router.push(`/space/${result.id}`);
    } else if (result.type === "document" && result.itemId) {
      router.push(`/item/${result.itemId}`);
    } else {
      router.push(`/item/${result.id}`);
    }
  }

  const showResults = focused && query.length > 0;

  return (
    <header className={`sticky top-0 z-40 bg-white/90 dark:bg-[#0c1222]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Logo + Breadcrumbs row */}
        <div className="h-12 flex items-center justify-between">
          <nav className="flex items-center flex-nowrap whitespace-nowrap overflow-x-auto min-w-0">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-6 h-6 text-blue-600">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 6L4 22h6v18a2 2 0 002 2h24a2 2 0 002-2V22h6L24 6z" fill="currentColor" opacity="0.2"/>
                  <path d="M24 6L4 22h6v18a2 2 0 002 2h24a2 2 0 002-2V22h6L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-base">PropertyTracker</span>
            </Link>

            {breadcrumbs && breadcrumbs.length > 0 && breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="inline-flex items-center gap-1 ml-1">
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-sm text-gray-500">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 ml-2"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* Search bar row */}
        <div className="pb-3" ref={containerRef}>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Search spaces and items..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white dark:focus:bg-[#1a2332] focus:shadow-md focus:border-gray-300 dark:focus:border-gray-600 border border-transparent transition-all"
            />

            {/* Dropdown results */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a2332] rounded-xl shadow-xl border border-gray-200/80 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                {results.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {results.map((result) => {
                      const preset = (result.type === "item" || result.type === "document") && result.icon && result.icon !== "custom" && !result.icon.startsWith("icon-")
                        ? getItemPreset(result.icon)
                        : null;
                      const itemColors = preset ? getCategoryColors(preset.category) : null;
                      const spIcon = result.type === "space" && result.icon
                        ? getSpaceIcon(result.icon)
                        : null;
                      const spColors = result.type === "space" && result.icon
                        ? getSpaceColors(result.icon)
                        : null;

                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 transition-colors text-left"
                        >
                          {result.type === "space" && spIcon ? (
                            <div
                              className={`w-7 h-7 flex-shrink-0 ${spColors?.iconColor || "text-gray-400"}`}
                              dangerouslySetInnerHTML={{ __html: spIcon.svg }}
                            />
                          ) : result.type === "document" ? (
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          ) : preset ? (
                            <div
                              className={`w-7 h-7 flex-shrink-0 ${itemColors?.icon || "text-gray-400"}`}
                              dangerouslySetInnerHTML={{ __html: preset.svg }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate dark:text-gray-200">{result.name}</p>
                            {result.type === "document" && result.matchContext ? (
                              <p className="text-xs text-emerald-500 truncate mt-0.5">&ldquo;{result.matchContext}&rdquo;</p>
                            ) : (
                              <p className="text-xs text-gray-400 truncate">
                                {result.type === "space" ? "Space" : result.type === "document" ? `${result.itemName} · ${result.spaceName}` : result.spaceName || "Item"}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
