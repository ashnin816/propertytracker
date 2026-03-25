/**
 * Parse key details from extracted text for display in document rows.
 * No API call — just regex parsing of already-extracted text.
 */

export interface DocDetails {
  type?: string;
  amount?: string;
  date?: string;
  expiry?: string;
}

const DOC_TYPES: [string[], string][] = [
  [["warranty", "warrantee"], "Warranty"],
  [["receipt", "purchase", "transaction", "paid"], "Receipt"],
  [["invoice", "bill to", "amount due"], "Invoice"],
  [["insurance", "policy", "policyholder"], "Insurance"],
  [["lease", "tenant", "landlord", "rent"], "Lease"],
  [["manual", "instruction", "user guide"], "Manual"],
  [["contract", "agreement", "service contract"], "Contract"],
  [["inspection", "inspector"], "Inspection"],
  [["certificate", "certification"], "Certificate"],
  [["permit"], "Permit"],
  [["estimate", "quote"], "Estimate"],
];

export function parseDocDetails(text: string | undefined): DocDetails | null {
  if (!text || text.length < 10) return null;
  const lower = text.toLowerCase();
  const details: DocDetails = {};

  // Document type
  for (const [keywords, type] of DOC_TYPES) {
    if (keywords.some((k) => lower.includes(k))) {
      details.type = type;
      break;
    }
  }

  // Dollar amount (largest)
  const amounts = text.match(/\$\s?[\d,]+\.?\d{0,2}/g);
  if (amounts) {
    const values = amounts.map((a) => parseFloat(a.replace(/[$,\s]/g, "")));
    const max = Math.max(...values);
    if (max > 0 && max < 1000000) {
      details.amount = `$${max.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  // Expiry date
  const expiryMatch = lower.match(/(?:expir|valid until|expires?)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s*\d{2,4})/i);
  if (expiryMatch) {
    details.expiry = expiryMatch[1].trim();
  }

  // General date
  if (!details.expiry) {
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) details.date = dateMatch[1];
  }

  return Object.keys(details).length > 0 ? details : null;
}
