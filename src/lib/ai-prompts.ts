export const ANALYZE_IMAGE_PROMPT = `Analyze this document image. Return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": A concise summary of the key content (max 500 characters, not the full text).
3. "details": An object with key details:
   - "type": Document type (receipt, warranty, invoice, insurance, contract, lease, inspection, certificate, permit, estimate, manual)
   - "company": Business name
   - "amount": Dollar amount
   - "date": Relevant date
   - "product": What the document is about
   - "expiration": Expiration date if applicable

Return ONLY valid JSON, no markdown or code blocks.`;

export const ANALYZE_TEXT_PROMPT = `Analyze this document text and return a JSON object with:
1. "name": A short, descriptive name (e.g. "Home Depot Receipt - $849.99" or "HVAC Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": A concise summary of the key content (max 500 characters).
3. "details": An object with key details:
   - "type": Document type (receipt, warranty, invoice, insurance, contract, lease, inspection, certificate, permit, estimate, manual)
   - "company": Business name
   - "amount": Dollar amount
   - "date": Relevant date
   - "product": What the document is about
   - "expiration": Expiration date if applicable

Return ONLY valid JSON, no markdown or code blocks.

Document text:

`;

export const ANALYZE_PDF_PROMPT = `Analyze this PDF document. Return a JSON object with:
1. "name": A short, descriptive name (e.g. "Home Depot Receipt - $849.99" or "Roof Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": A concise summary of the key content (max 500 characters).
3. "details": An object with key details:
   - "type": Document type (receipt, warranty, invoice, insurance, contract, lease, inspection, certificate, permit, estimate, manual)
   - "company": Business name
   - "amount": Dollar amount
   - "date": Relevant date
   - "product": What the document is about
   - "expiration": Expiration date if applicable

Return ONLY valid JSON, no markdown or code blocks.`;
