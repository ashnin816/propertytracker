"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { authFetch } from "@/lib/supabase";

interface InsightsData {
  counts: { properties: number; units: number; assets: number; documents: number };
  expiring: { docId: string; docName: string; spaceName: string; itemName: string; expiryDate: string; daysRemaining: number }[];
  typeCounts: Record<string, number>;
  missingInsurance: string[];
  missingWarranty: { spaceName: string; itemName: string }[];
}

export default function InsightsPanel() {
  const { user } = useAuth();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.orgId) {
      authFetch(`/api/insights?org_id=${user.orgId}`)
        .then((res) => res.json())
        .then((d) => { if (d.counts) setData(d); })
        .finally(() => setLoading(false));
    }
  }, [user?.orgId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const totalTypes = Object.values(data.typeCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      {/* Header + email hint */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold dark:text-white">Portfolio Insights</h1>
          <p className="text-sm text-gray-400 mt-1">AI-powered overview of your properties</p>
        </div>
        {user?.orgSlug && (
          <button onClick={() => navigator.clipboard.writeText(`${user.orgSlug}@inbound.propertytrackerplus.com`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[11px] font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer flex-shrink-0"
            title="Click to copy email address">
            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {user.orgSlug}@inbound.propertytrackerplus.com
            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Properties", value: data.counts.properties, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "blue" },
          { label: "Units", value: data.counts.units, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "violet" },
          { label: "Assets", value: data.counts.assets, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "emerald" },
          { label: "Documents", value: data.counts.documents, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "amber" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
                <svg className={`w-5 h-5 text-${stat.color}-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Expiring Soon */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold dark:text-white">Expiring Soon</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Warranties, contracts, and policies expiring in 90 days</p>
            </div>
            {data.expiring.length > 0 && (
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">{data.expiring.length} items</span>
            )}
          </div>
          {data.expiring.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">Nothing expiring soon</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {data.expiring.map((item) => (
                <div key={item.docId} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.daysRemaining <= 30 ? "bg-red-500" : item.daysRemaining <= 60 ? "bg-amber-500" : "bg-yellow-400"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium dark:text-gray-200 truncate">{item.docName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.spaceName} → {item.itemName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${
                      item.daysRemaining <= 30 ? "text-red-600 dark:text-red-400" : item.daysRemaining <= 60 ? "text-amber-600 dark:text-amber-400" : "text-yellow-600 dark:text-yellow-400"
                    }`}>{item.daysRemaining}d</p>
                    <p className="text-[10px] text-gray-400">{new Date(item.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Types */}
        <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold dark:text-white">Document Types</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{totalTypes} classified documents</p>
          </div>
          {totalTypes === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No classified documents yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {Object.entries(data.typeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct = Math.round((count / totalTypes) * 100);
                  const colors: Record<string, string> = {
                    Warranty: "bg-blue-500", Receipt: "bg-emerald-500", Invoice: "bg-amber-500",
                    Insurance: "bg-violet-500", Lease: "bg-rose-500", Manual: "bg-cyan-500",
                    Contract: "bg-indigo-500", Inspection: "bg-orange-500", Certificate: "bg-teal-500",
                    Permit: "bg-pink-500", Estimate: "bg-lime-500",
                  };
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium dark:text-gray-300">{type}</span>
                        <span className="text-[11px] text-gray-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[type] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Missing Insurance */}
      {data.missingInsurance.length > 0 && (
        <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-bold dark:text-white">No Insurance on File</h2>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto italic">Based on AI analysis of uploaded documents</span>
          </div>
          <div className="p-5">
            <div className="space-y-1.5">
              {data.missingInsurance.map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
