"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { getDocument } from "@/lib/supabase-storage";
import { Document } from "@/lib/types";
import DocumentPreview from "./DocumentPreview";

interface DocContext {
  id: string;
  itemId: string;
  spaceId: string;
  name: string;
  spaceName: string;
  itemName: string;
  text: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AskAIProps {
  documents: DocContext[];
  onClose: () => void;
  onNavigateToItem?: (spaceId: string, itemId: string) => void;
}

export default function AskAI({ documents, onClose, onNavigateToItem }: AskAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, documents }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || data.error || "Something went wrong." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to get a response. Please try again." }]);
    }

    setLoading(false);
  }

  // Parse message content and make document references clickable
  function renderContent(content: string): ReactNode {
    // Match patterns like (from "Document Name") or (from "Document Name")
    const parts: ReactNode[] = [];
    const regex = /\(from [""]([^""]+)[""]\)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      const docName = match[1];
      const doc = documents.find((d) => d.name.toLowerCase() === docName.toLowerCase());

      if (doc) {
        parts.push(
          <button
            key={match.index}
            onClick={() => {
              getDocument(doc.id).then((fullDoc) => {
                if (fullDoc) setPreviewDoc(fullDoc);
              });
            }}
            className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 underline underline-offset-2 no-min-size cursor-pointer"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {docName}
          </button>
        );
      } else {
        parts.push(<span key={match.index} className="text-violet-400">(from &ldquo;{docName}&rdquo;)</span>);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  }

  const docCount = documents.filter((d) => d.text).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:bottom-20 lg:left-3 lg:right-auto z-50 lg:w-80" style={{ animation: "chat-pop-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      <div className="rounded-t-2xl lg:rounded-2xl flex flex-col overflow-hidden shadow-[0_-4px_40px_rgba(124,58,237,0.15),0_-2px_12px_rgba(0,0,0,0.08)] lg:shadow-[0_8px_40px_rgba(124,58,237,0.15),0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_40px_rgba(124,58,237,0.25),0_-2px_12px_rgba(0,0,0,0.3)] lg:dark:shadow-[0_8px_40px_rgba(124,58,237,0.25),0_2px_12px_rgba(0,0,0,0.3)]" style={{ height: "min(440px, 80vh)" }}>

        {/* Header — gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-white">Ask PropertyTracker</p>
              <p className="text-[10px] text-white/60">{docCount} docs indexed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors no-min-size cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white dark:bg-[#1a2332]">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="font-semibold text-sm dark:text-white mb-1">Ask anything</p>
              <p className="text-[11px] text-gray-400 mb-4">Search across all your documents with AI</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {["When does my warranty expire?", "How much did I spend?", "What's my policy number?"].map((q) => (
                  <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-[10px] px-2.5 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors no-min-size cursor-pointer font-medium">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 no-min-size">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              )}
              <div className={`max-w-[80%] px-3 py-2.5 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-sm"
                  : "bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-md"
              }`}>
                <div className="whitespace-pre-wrap">{msg.role === "assistant" ? renderContent(msg.content) : msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 no-min-size">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input — clean white footer */}
        <form onSubmit={handleSubmit} className="px-3 py-3 bg-white dark:bg-[#1a2332] border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-1.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your documents..."
              className="flex-1 bg-transparent text-xs outline-none no-min-size dark:text-white placeholder-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center hover:from-violet-600 hover:to-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-violet-500/25 active:scale-90 transition-all duration-200 no-min-size cursor-pointer flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {previewDoc && (
        <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}
