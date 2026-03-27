import { NextRequest, NextResponse } from "next/server";
import { getCallerProfile } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const caller = await getCallerProfile(req);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { imageData, mimeType } = await req.json();

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });
    }

    const isImage = mimeType?.startsWith("image/");

    // Detect actual MIME type from data URL header (compression may change format)
    const dataUrlMatch = imageData.match?.(/^data:(image\/[^;]+);base64,/);
    const actualMimeType = dataUrlMatch ? dataUrlMatch[1] : mimeType;

    const content = isImage
      ? [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: actualMimeType,
              data: imageData.split(",")[1], // Remove data URL prefix
            },
          },
          {
            type: "text" as const,
            text: `Analyze this document image. Return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": All readable text from the document.
3. "details": An object with any key details found, such as:
   - "store" or "company": The business name
   - "amount" or "total": Dollar amount
   - "date": Any relevant date
   - "product": What the document is about
   - "type": Document type (receipt, warranty, invoice, manual, insurance, contract, etc.)
   - "expiration": Expiration date if applicable
   - Any other relevant fields

Return ONLY valid JSON, no markdown or explanation.`,
          },
        ]
      : [
          {
            type: "text" as const,
            text: `Analyze this document text and return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": A clean summary of the key content.
3. "details": An object with any key details found, such as:
   - "store" or "company": The business name
   - "amount" or "total": Dollar amount
   - "date": Any relevant date
   - "product": What the document is about
   - "type": Document type (receipt, warranty, invoice, manual, insurance, contract, etc.)
   - "expiration": Expiration date if applicable
   - Any other relevant fields

Here is the document text:

${imageData}

Return ONLY valid JSON, no markdown or explanation.`,
          },
        ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", response.status, err);
      return NextResponse.json({ error: `API error: ${response.status}`, detail: err }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Parse the JSON response
    try {
      // Handle potential markdown code blocks
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      // If JSON parsing fails, return raw text
      return NextResponse.json({
        name: null,
        extractedText: text,
        details: {},
      });
    }
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
