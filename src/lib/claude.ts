const API_KEY_STORAGE = "hometracker_claude_key";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE);
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export interface AnalysisResult {
  name: string | null;
  extractedText: string;
  details: Record<string, string>;
}

export async function analyzeDocument(
  fileDataUrl: string,
  mimeType: string
): Promise<AnalysisResult> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No API key");

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  // For PDFs, extract text first with pdf.js then send text to Claude
  const dataToSend = fileDataUrl;
  let sendMimeType = mimeType;

  if (isPdf) {
    // We'll send the extracted text instead of the raw PDF
    // PDF text extraction happens before this function is called
    sendMimeType = "text/plain";
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageData: dataToSend,
      mimeType: isImage ? sendMimeType : "text/plain",
      apiKey,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error("Analysis API error:", response.status, errBody);
    throw new Error(`Analysis failed: ${response.status}`);
  }

  const result = await response.json();
  console.log("Claude analysis result:", result);

  return {
    name: result.name || null,
    extractedText: result.extractedText || "",
    details: result.details || {},
  };
}
