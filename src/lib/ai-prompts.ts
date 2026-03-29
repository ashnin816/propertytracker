export const ANALYZE_IMAGE_PROMPT = `Analyze this document image. Return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": All readable text from the document.
3. "details": An object with any key details found, such as:
   - "store" or "company": The business name
   - "amount" or "total": Dollar amount
   - "date": Any relevant date
   - "product": What the document is about
   - "type": Document type (receipt, warranty, invoice, manual, insurance, contract, permit, inspection, lease, certificate, estimate, etc.)
   - "expiration": Expiration date if applicable
   - Any other relevant fields

Return ONLY valid JSON, no markdown or explanation.`;

export const ANALYZE_TEXT_PROMPT = `Analyze this document text and return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": A clean summary of the key content.
3. "details": An object with any key details found, such as:
   - "store" or "company": The business name
   - "amount" or "total": Dollar amount
   - "date": Any relevant date
   - "product": What the document is about
   - "type": Document type (receipt, warranty, invoice, manual, insurance, contract, permit, inspection, lease, certificate, estimate, etc.)
   - "expiration": Expiration date if applicable
   - Any other relevant fields

Return ONLY valid JSON, no markdown or explanation.

Here is the document text:

`;

export const ANALYZE_PDF_PROMPT = `Analyze this PDF document. Return a JSON object with:
1. "name": A short, descriptive name for this document (e.g. "Home Depot Receipt - $849.99" or "Dishwasher Warranty - Expires 2028"). Max 60 characters.
2. "extractedText": All readable text from the document.
3. "details": An object with any key details found, such as:
   - "store" or "company": The business name
   - "amount" or "total": Dollar amount
   - "date": Any relevant date
   - "product": What the document is about
   - "type": Document type (receipt, warranty, invoice, manual, insurance, contract, permit, inspection, lease, certificate, estimate, etc.)
   - "expiration": Expiration date if applicable
   - Any other relevant fields

Return ONLY valid JSON, no markdown or explanation.`;
