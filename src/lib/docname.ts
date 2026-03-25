/**
 * Smart document naming from OCR text.
 * Parses extracted text for common patterns and generates a meaningful name.
 */

// Common store/company names to look for
const KNOWN_STORES = [
  "Home Depot", "Lowe's", "Lowes", "Walmart", "Target", "Costco", "Amazon",
  "Best Buy", "IKEA", "Ace Hardware", "Menards", "Sears",
  "Apple", "Samsung", "LG", "Whirlpool", "GE", "Maytag", "Bosch", "KitchenAid",
  "State Farm", "Allstate", "Geico", "Progressive", "Liberty Mutual",
  "AT&T", "Verizon", "Comcast", "Xfinity",
  "AutoZone", "O'Reilly", "Jiffy Lube", "Valvoline",
  "Home Warranty", "American Home Shield",
];

// Document type keywords
const DOC_TYPES: [string[], string][] = [
  [["warranty", "warrantee", "limited warranty", "coverage"], "Warranty"],
  [["receipt", "transaction", "purchase", "paid", "total due", "subtotal"], "Receipt"],
  [["invoice", "bill to", "amount due", "due date"], "Invoice"],
  [["insurance", "policy", "policyholder", "coverage", "premium"], "Insurance Policy"],
  [["manual", "instruction", "user guide", "operating"], "Manual"],
  [["contract", "agreement", "terms", "party", "hereby"], "Contract"],
  [["estimate", "quote", "proposal", "quoted price"], "Estimate"],
  [["inspection", "inspector", "condition", "findings"], "Inspection Report"],
  [["registration", "registered", "registration number"], "Registration"],
  [["lease", "tenant", "landlord", "rent", "occupancy"], "Lease"],
  [["certificate", "certification", "certified"], "Certificate"],
  [["permit", "building permit", "authorized"], "Permit"],
];

function findAmount(text: string): string | null {
  // Look for dollar amounts
  const amountMatch = text.match(/\$\s?[\d,]+\.?\d{0,2}/g);
  if (amountMatch) {
    // Return the largest amount (likely the total)
    const amounts = amountMatch.map((a) => parseFloat(a.replace(/[$,\s]/g, "")));
    const maxAmount = Math.max(...amounts);
    if (maxAmount > 0 && maxAmount < 1000000) {
      return `$${maxAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
  return null;
}

function findDate(text: string): string | null {
  // Common date formats
  const patterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{2,4}/i,
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{2,4}/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
}

function findStore(text: string): string | null {
  const lower = text.toLowerCase();
  for (const store of KNOWN_STORES) {
    if (lower.includes(store.toLowerCase())) {
      return store;
    }
  }
  return null;
}

function findDocType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keywords, type] of DOC_TYPES) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return type;
      }
    }
  }
  return null;
}

export function generateDocumentName(extractedText: string, originalName: string): string | null {
  if (!extractedText || extractedText.length < 10) return null;

  const store = findStore(extractedText);
  const docType = findDocType(extractedText);
  const amount = findAmount(extractedText);
  const date = findDate(extractedText);

  const parts: string[] = [];

  // Build name from most specific to least
  if (store) parts.push(store);
  if (docType) parts.push(docType);
  if (amount) parts.push(amount);
  if (date && parts.length < 3) parts.push(date);

  // Only suggest if we found something meaningful
  if (parts.length === 0) return null;

  // If no patterns found, try to use the first meaningful line of text
  if (parts.length === 0) {
    const lines = extractedText.split("\n").map((l) => l.trim()).filter((l) => l.length > 3 && l.length < 60);
    const firstLine = lines[0];
    if (firstLine) {
      parts.push(firstLine);
    }
  }

  if (parts.length === 0) return null;

  // Skip renaming only if the original name looks intentionally descriptive
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, "");
  const realWords = nameWithoutExt.match(/[a-zA-Z]{3,}/g);
  const isDescriptive = realWords && realWords.length >= 3;
  if (isDescriptive) return null;

  return parts.join(" - ");
}
