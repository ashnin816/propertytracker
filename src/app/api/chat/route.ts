import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { question, documents } = await req.json();

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });
    }

    // Build context from documents
    const docContext = documents
      .map((doc: { name: string; spaceName: string; itemName: string; text: string }) =>
        `[Document: "${doc.name}" | Item: ${doc.itemName} | Space: ${doc.spaceName}]\n${doc.text}`
      )
      .join("\n\n---\n\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: `You are a helpful assistant that answers questions about the user's household documents. You have access to text extracted from their uploaded documents (receipts, warranties, invoices, insurance policies, etc.).

Answer questions based ONLY on the information in the provided documents. If the answer isn't in the documents, say so clearly.

When referencing information, cite which document it came from using the format: (from "Document Name").

Keep answers concise and helpful. Use bullet points for multiple items.`,
        messages: [
          {
            role: "user",
            content: `Here are my documents:\n\n${docContext}\n\n---\n\nMy question: ${question}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Chat API error:", response.status, err);
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const answer = data.content?.[0]?.text || "I couldn't generate an answer.";

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
