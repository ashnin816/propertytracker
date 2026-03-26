// Email Worker — no external dependencies
// Forwards raw email to our API which handles parsing

export default {
  async fetch(request, env) {
    return new Response("Email inbound worker is running.", { status: 200 });
  },

  async email(message, env, ctx) {
    try {
      console.log("Email received from:", message.from, "to:", message.to);

      // Read raw email as base64
      const chunks = [];
      const reader = message.raw.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const rawBytes = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        rawBytes.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to base64
      let binary = "";
      for (let i = 0; i < rawBytes.byteLength; i++) {
        binary += String.fromCharCode(rawBytes[i]);
      }
      const rawBase64 = btoa(binary);

      console.log("Raw email size:", totalLength, "bytes");

      // Send raw email to our API — let the server parse it
      const apiUrl = (env.API_URL || "https://propertytracker.vercel.app") + "/api/inbound-email";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Inbound-Secret": env.INBOUND_EMAIL_SECRET,
        },
        body: JSON.stringify({
          from: message.from,
          to: message.to,
          rawEmail: rawBase64,
        }),
      });

      const result = await response.json();
      console.log("API response:", response.status, JSON.stringify(result));
    } catch (err) {
      console.error("Worker error:", err.message, err.stack);
    }
  },
};
