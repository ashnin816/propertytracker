"use client";

import { useEffect, useRef, useState } from "react";

const PDFJS_VERSION = "4.9.155";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

async function loadPdfJs(): Promise<typeof pdfjsLib> {
  if (pdfjsLib) return pdfjsLib;
  if (typeof window === "undefined") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).pdfjsLib) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfjsLib = (window as any).pdfjsLib;
    return pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const moduleScript = document.createElement("script");
    moduleScript.type = "module";
    moduleScript.textContent = `
      import * as pdfjsLib from "${PDFJS_CDN}/pdf.min.mjs";
      window.pdfjsLib = pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "${PDFJS_CDN}/pdf.worker.min.mjs";
      window.dispatchEvent(new Event("pdfjsLoaded"));
    `;

    window.addEventListener("pdfjsLoaded", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfjsLib = (window as any).pdfjsLib;
      resolve(pdfjsLib);
    }, { once: true });

    setTimeout(() => reject(new Error("pdf.js load timeout")), 10000);
    document.head.appendChild(moduleScript);
  });
}

interface PdfViewerProps {
  dataUrl: string;
}

export default function PdfViewer({ dataUrl }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const pdfjs = await loadPdfJs();
        if (!pdfjs || cancelled) return;

        let pdfData: Uint8Array | string;
        if (dataUrl.startsWith("data:")) {
          // Base64 data URL
          const base64 = dataUrl.split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          pdfData = bytes;
        } else {
          // Remote URL — fetch the bytes
          const res = await fetch(dataUrl);
          const buffer = await res.arrayBuffer();
          pdfData = new Uint8Array(buffer);
        }

        const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const maxPages = Math.min(pdf.numPages, 5);

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.borderRadius = "8px";
          if (i > 1) canvas.style.marginTop = "12px";

          const ctx = canvas.getContext("2d");
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
          }

          if (!cancelled && container) {
            container.appendChild(canvas);
          }
        }

        setLoading(false);
      } catch (e) {
        console.error("PDF render failed:", e);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [dataUrl]);

  if (error) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm mb-3">Unable to preview this PDF</p>
        <a
          href={dataUrl}
          download="document.pdf"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Download PDF
        </a>
      </div>
    );
  }

  return (
    <div>
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="ml-3 text-sm text-gray-400">Loading PDF...</span>
        </div>
      )}
      <div ref={containerRef} />
      {!loading && pageCount > 5 && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Showing first 5 of {pageCount} pages
        </p>
      )}
    </div>
  );
}
