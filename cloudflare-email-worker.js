// Cloudflare Email Worker — forwards emails to PropertyTracker+ API
// Deploy this in Cloudflare Workers dashboard
// Requires: postal-mime module (add via wrangler.toml or Cloudflare dashboard)
// Environment variable: INBOUND_EMAIL_SECRET (set in Worker settings)
// Environment variable: API_URL (set to https://propertytracker.vercel.app)

import PostalMime from "postal-mime";

export default {
  async email(message, env, ctx) {
    try {
      // Read the raw email
      const rawEmail = await new Response(message.raw).arrayBuffer();
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);

      // Extract attachments
      const attachments = (parsed.attachments || [])
        .filter((att) => att.content && att.filename)
        .map((att) => ({
          filename: att.filename,
          content: arrayBufferToBase64(att.content),
          contentType: att.mimeType || "application/octet-stream",
          size: att.content.byteLength,
        }));

      if (attachments.length === 0) {
        console.log("No attachments in email from:", message.from);
        return;
      }

      // POST to our API
      const apiUrl = (env.API_URL || "https://propertytracker.vercel.app") + "/api/inbound-email";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Inbound-Secret": env.INBOUND_EMAIL_SECRET,
        },
        body: JSON.stringify({
          from: message.from,
          subject: parsed.subject || "",
          attachments,
        }),
      });

      const result = await response.json();
      console.log("API response:", response.status, JSON.stringify(result));
    } catch (err) {
      console.error("Worker error:", err);
    }
  },
};

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
