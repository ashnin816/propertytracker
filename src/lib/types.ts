export interface Space {
  id: string;
  name: string;
  icon: string; // icon key from SPACE_ICONS
  createdAt: string;
}

export interface Unit {
  id: string;
  spaceId: string;
  name: string;
  createdAt: string;
}

export interface Item {
  id: string;
  spaceId: string;
  unitId?: string; // optional — items can belong to a unit or directly to a space
  name: string;
  icon: string; // icon key from ITEM_PRESETS, or "custom"
  photoUrl: string | null; // base64 data URL for custom photos
  createdAt: string;
}

export interface InboxDocument {
  id: string;
  orgId: string;
  senderEmail: string;
  senderName: string | null;
  subject: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  extractedText: string | null;
  suggestedSpaceId: string | null;
  suggestedItemId: string | null;
  suggestedMatchReason: string | null;
  suggestedSpaceName?: string;
  suggestedItemName?: string;
  status: "pending" | "assigned" | "dismissed";
  createdAt: string;
}

export interface Document {
  id: string;
  itemId: string;
  name: string;
  fileUrl: string; // base64 data URL
  fileType: string;
  extractedText?: string; // OCR text from images
  details?: Record<string, string>; // Structured AI analysis (type, expiration, amount, etc.)
  ocrStatus?: "pending" | "processing" | "done" | "failed";
  createdAt: string;
}
