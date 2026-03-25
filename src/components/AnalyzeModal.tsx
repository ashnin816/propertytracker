"use client";

import { useState, useEffect } from "react";

type Stage = "uploading" | "analyzing" | "extracting" | "naming" | "done";

interface AnalyzeModalProps {
  fileName: string;
  isImage: boolean;
  extractedText: string | null;
  suggestedName: string | null;
  stage: Stage;
  engine?: "claude" | "ocr";
  fileCount?: { current: number; total: number };
  onAccept: (name: string) => void;
  onSkip: () => void;
}

const STAGE_MESSAGES: Record<Stage, string> = {
  uploading: "Uploading document...",
  analyzing: "Analyzing document...",
  extracting: "Extracting text...",
  naming: "Generating smart name...",
  done: "Analysis complete",
};

export default function AnalyzeModal({
  fileName,
  isImage,
  extractedText,
  suggestedName,
  stage,
  engine,
  fileCount,
  onAccept,
  onSkip,
}: AnalyzeModalProps) {
  const [editName, setEditName] = useState("");
  const [visibleText, setVisibleText] = useState("");

  // Animate text appearing character by character
  useEffect(() => {
    if (!extractedText) { setVisibleText(""); return; }
    const preview = extractedText.slice(0, 200);
    let i = 0;
    setVisibleText("");
    const interval = setInterval(() => {
      i += 3;
      setVisibleText(preview.slice(0, i));
      if (i >= preview.length) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [extractedText]);

  useEffect(() => {
    if (suggestedName) setEditName(suggestedName);
  }, [suggestedName]);

  const isDone = stage === "done";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-md animate-scale-in overflow-hidden">

        {/* Header with animation */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            {/* Animated scanner icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDone ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-blue-100 dark:bg-blue-900/30"
            }`}>
              {isDone ? (
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold dark:text-white">
                  {isDone ? "Analysis Complete" : "Analyzing Document"}
                </p>
                {fileCount && fileCount.total > 1 && (
                  <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full no-min-size">
                    {fileCount.current} of {fileCount.total}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 truncate">{fileName}</p>
                {engine && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded no-min-size ${
                    engine === "claude" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                    {engine === "claude" ? "AI" : "OCR"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress steps */}
          <div className="space-y-2 mb-4">
            {(["uploading", "analyzing", "extracting", "naming"] as Stage[]).map((s) => {
              const stageIndex = ["uploading", "analyzing", "extracting", "naming", "done"].indexOf(stage);
              const thisIndex = ["uploading", "analyzing", "extracting", "naming"].indexOf(s);
              const isActive = thisIndex === stageIndex;
              const isComplete = thisIndex < stageIndex;

              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 no-min-size ${
                    isComplete ? "bg-emerald-500" : isActive ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                  }`}>
                    {isComplete ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isComplete ? "text-emerald-600 dark:text-emerald-400 font-medium" :
                    isActive ? "text-blue-600 dark:text-blue-400 font-medium" :
                    "text-gray-400"
                  }`}>
                    {STAGE_MESSAGES[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extracted text preview */}
        {visibleText && (
          <div className="px-6 pb-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Found Text</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 max-h-24 overflow-hidden relative">
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                {visibleText}{visibleText.length < (extractedText?.slice(0, 200).length || 0) ? "▊" : ""}
              </p>
              {visibleText.length >= 180 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent" />
              )}
            </div>
          </div>
        )}

        {/* Smart name suggestion */}
        {isDone && (
          <div className="px-6 pb-6">
            {suggestedName ? (
              <div>
                <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1.5">Smart Name</p>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white no-min-size"
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={onSkip}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium no-min-size">
                    Keep Original
                  </button>
                  <button onClick={() => onAccept(editName.trim() || suggestedName)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium no-min-size">
                    Use This Name
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  {extractedText ? "Text extracted and searchable. No smart name could be generated." : "No text found in this document."}
                </p>
                <button onClick={onSkip}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium no-min-size">
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
