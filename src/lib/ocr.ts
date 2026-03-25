import Tesseract from "tesseract.js";

const PDFJS_VERSION = "4.9.155";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (typeof window === "undefined") return null;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).pdfjsLib) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.mjs`;
      resolve(pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = `${PDFJS_CDN}/pdf.min.mjs`;
    script.type = "module";

    // For module scripts, use a different approach
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

export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  try {
    const { data } = await Tesseract.recognize(imageDataUrl, "eng", {
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
    });
    // Clean up common OCR artifacts
    const cleaned = data.text
      .replace(/[^\x20-\x7E\n\r\t]/g, "") // Strip non-ASCII
      .replace(/\n{3,}/g, "\n\n") // Collapse excessive newlines
      .trim();
    return cleaned;
  } catch {
    return "";
  }
}

export async function extractTextFromPdf(pdfDataUrl: string): Promise<string> {
  try {
    const pdfjs = await loadPdfJs();
    if (!pdfjs) return "";

    // Convert data URL to array buffer
    const base64 = pdfDataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const allText: string[] = [];
    const pageCount = Math.min(pdf.numPages, 10);

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = textContent.items
        .map((item: { str?: string }) => item.str || "")
        .join(" ")
        .trim();

      if (pageText.length > 20) {
        allText.push(pageText);
      } else {
        // Render to canvas and OCR
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgDataUrl = canvas.toDataURL("image/png");
          const ocrText = await extractTextFromImage(imgDataUrl);
          if (ocrText) allText.push(ocrText);
        }
      }
    }

    return allText.join("\n\n").trim();
  } catch (e) {
    console.error("PDF extraction failed:", e);
    return "";
  }
}

export async function extractText(fileDataUrl: string, fileType: string): Promise<string> {
  if (fileType === "application/pdf") {
    return extractTextFromPdf(fileDataUrl);
  }
  if (fileType.startsWith("image/")) {
    return extractTextFromImage(fileDataUrl);
  }
  return "";
}

export function isExtractable(fileType: string): boolean {
  return fileType.startsWith("image/") || fileType === "application/pdf";
}

/**
 * Extract text from key pages only (first 3 + last page) for Claude analysis.
 * Returns less text but covers the most important parts of the document.
 */
export async function extractSmartPages(pdfDataUrl: string): Promise<string> {
  try {
    const pdfjs = await loadPdfJs();
    if (!pdfjs) return "";

    const base64 = pdfDataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const totalPages = pdf.numPages;

    // Determine which pages to extract: first 3 + last page
    const pagesToExtract = new Set<number>();
    for (let i = 1; i <= Math.min(3, totalPages); i++) {
      pagesToExtract.add(i);
    }
    if (totalPages > 3) {
      pagesToExtract.add(totalPages);
    }

    const allText: string[] = [];

    for (const pageNum of Array.from(pagesToExtract).sort((a, b) => a - b)) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str || "")
        .join(" ")
        .trim();

      if (pageText.length > 5) {
        const label = pageNum === totalPages && totalPages > 3 ? `[Last Page - ${pageNum}]` : `[Page ${pageNum}]`;
        allText.push(`${label}\n${pageText}`);
      } else {
        // If text layer is empty, OCR the page
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await (page as unknown as { render(p: { canvasContext: CanvasRenderingContext2D; viewport: unknown }): { promise: Promise<void> } })
            .render({ canvasContext: ctx, viewport }).promise;
          const imgDataUrl = canvas.toDataURL("image/png");
          const ocrText = await extractTextFromImage(imgDataUrl);
          if (ocrText) {
            const label = pageNum === totalPages && totalPages > 3 ? `[Last Page - ${pageNum}]` : `[Page ${pageNum}]`;
            allText.push(`${label}\n${ocrText}`);
          }
        }
      }
    }

    const result = allText.join("\n\n").trim();
    if (totalPages > 4) {
      return `[Document has ${totalPages} pages. Showing pages 1-3 and last page.]\n\n${result}`;
    }
    return result;
  } catch (e) {
    console.error("Smart page extraction failed:", e);
    return "";
  }
}
