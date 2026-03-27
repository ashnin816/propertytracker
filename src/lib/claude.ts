import { authFetch } from "./supabase";

export interface AnalysisResult {
  name: string | null;
  extractedText: string;
  details: Record<string, string>;
}

export async function analyzeDocument(
  fileDataUrl: string,
  mimeType: string
): Promise<AnalysisResult> {
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  const dataToSend = fileDataUrl;
  let sendMimeType = mimeType;

  if (isPdf) {
    sendMimeType = "text/plain";
  }

  const response = await authFetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageData: dataToSend,
      mimeType: isImage ? sendMimeType : "text/plain",
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error("Analysis API error:", response.status, errBody);
    throw new Error(`Analysis failed: ${response.status}`);
  }

  const result = await response.json();

  return {
    name: result.name || null,
    extractedText: result.extractedText || "",
    details: result.details || {},
  };
}
