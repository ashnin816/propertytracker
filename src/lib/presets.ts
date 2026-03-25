export interface SpaceIcon {
  key: string;
  label: string;
  emoji: string;
  svg: string;
  defaultName: string;
  placeholder: string;
}

export interface ItemPreset {
  key: string;
  label: string;
  emoji: string;
  svg: string;
  category: string;
  spaceTypes: string[]; // which space types this preset appears in
}

// Premium space icons — filled colorful style
export const SPACE_ICONS: SpaceIcon[] = [
  {
    key: "residential",
    label: "Residential",
    emoji: "🏠",
    defaultName: "",
    placeholder: "e.g. 123 Oak Street",
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L2 22h6v20a3 3 0 003 3h26a3 3 0 003-3V22h6L24 4z" fill="#3B82F6"/>
      <path d="M24 4L2 22h6v2L24 9l16 15v-2h6L24 4z" fill="#60A5FA"/>
      <rect x="19" y="27" width="10" height="18" rx="2" fill="white" opacity="0.3"/>
      <circle cx="27" cy="36" r="1" fill="white" opacity="0.5"/>
    </svg>`,
  },
  {
    key: "multifamily",
    label: "Multi-Family",
    emoji: "🏢",
    defaultName: "",
    placeholder: "e.g. Parkview Apartments",
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="32" height="40" rx="3" fill="#6366F1"/>
      <rect x="8" y="4" width="32" height="8" rx="3" fill="#818CF8"/>
      <rect x="14" y="16" width="6" height="5" rx="1" fill="white" opacity="0.3"/>
      <rect x="28" y="16" width="6" height="5" rx="1" fill="white" opacity="0.3"/>
      <rect x="14" y="25" width="6" height="5" rx="1" fill="white" opacity="0.25"/>
      <rect x="28" y="25" width="6" height="5" rx="1" fill="white" opacity="0.25"/>
      <rect x="20" y="34" width="8" height="10" rx="1" fill="white" opacity="0.35"/>
    </svg>`,
  },
  {
    key: "commercial",
    label: "Commercial",
    emoji: "🏪",
    defaultName: "",
    placeholder: "e.g. Downtown Office Plaza",
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="36" height="34" rx="3" fill="#64748B"/>
      <rect x="6" y="10" width="36" height="8" rx="3" fill="#94A3B8"/>
      <rect x="12" y="22" width="8" height="6" rx="1" fill="white" opacity="0.3"/>
      <rect x="28" y="22" width="8" height="6" rx="1" fill="white" opacity="0.3"/>
      <rect x="18" y="34" width="12" height="10" rx="1" fill="white" opacity="0.35"/>
      <rect x="12" y="32" width="8" height="4" rx="1" fill="white" opacity="0.2"/>
      <rect x="28" y="32" width="8" height="4" rx="1" fill="white" opacity="0.2"/>
    </svg>`,
  },
  {
    key: "rental",
    label: "Rental",
    emoji: "🔑",
    defaultName: "",
    placeholder: "e.g. 456 Elm St Rental",
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L4 20h6v20a2 2 0 002 2h24a2 2 0 002-2V20h6L24 4z" fill="#F59E0B"/>
      <path d="M24 4L4 20h6v2L24 9l14 13v-2h6L24 4z" fill="#FBBF24"/>
      <rect x="16" y="26" width="7" height="16" rx="1" fill="white" opacity="0.3"/>
      <rect x="25" y="26" width="7" height="16" rx="1" fill="white" opacity="0.3"/>
      <rect x="16" y="26" width="16" height="7" rx="1" fill="white" opacity="0.15"/>
    </svg>`,
  },
  {
    key: "industrial",
    label: "Industrial",
    emoji: "🏭",
    defaultName: "",
    placeholder: "e.g. Warehouse District",
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="18" width="40" height="26" rx="3" fill="#F97316"/>
      <rect x="4" y="18" width="40" height="6" rx="3" fill="#FB923C"/>
      <rect x="8" y="4" width="8" height="14" rx="2" fill="#EA580C"/>
      <rect x="20" y="8" width="8" height="10" rx="2" fill="#EA580C"/>
      <rect x="32" y="6" width="8" height="12" rx="2" fill="#EA580C"/>
      <rect x="10" y="28" width="10" height="8" rx="1" fill="white" opacity="0.25"/>
      <rect x="28" y="28" width="10" height="8" rx="1" fill="white" opacity="0.25"/>
      <rect x="18" y="36" width="12" height="8" rx="1" fill="white" opacity="0.3"/>
    </svg>`,
  },
  {
    key: "hoa",
    label: "HOA / Community",
    emoji: "🏘️",
    defaultName: "",
    placeholder: "e.g. Sunset Ridge HOA",
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 20L4 28h4v14a2 2 0 002 2h8a2 2 0 002-2V28h4L14 20z" fill="#06B6D4"/>
      <path d="M34 16L24 24h4v18a2 2 0 002 2h8a2 2 0 002-2V24h4L34 16z" fill="#0891B2"/>
      <rect x="11" y="32" width="6" height="8" rx="1" fill="white" opacity="0.3"/>
      <rect x="31" y="28" width="6" height="10" rx="1" fill="white" opacity="0.3"/>
      <rect x="4" y="42" width="40" height="2" rx="1" fill="#0E7490"/>
    </svg>`,
  },
  {
    key: "mixed",
    label: "Mixed Use",
    emoji: "🏗️",
    defaultName: "",
    placeholder: "e.g. Main St Mixed Use",
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="28" height="38" rx="3" fill="#8B5CF6"/>
      <rect x="10" y="6" width="28" height="6" rx="3" fill="#A78BFA"/>
      <rect x="15" y="16" width="6" height="4" rx="1" fill="white" opacity="0.3"/>
      <rect x="27" y="16" width="6" height="4" rx="1" fill="white" opacity="0.3"/>
      <rect x="15" y="24" width="6" height="4" rx="1" fill="white" opacity="0.25"/>
      <rect x="27" y="24" width="6" height="4" rx="1" fill="white" opacity="0.25"/>
      <rect x="15" y="32" width="6" height="4" rx="1" fill="white" opacity="0.2"/>
      <rect x="27" y="32" width="6" height="4" rx="1" fill="white" opacity="0.2"/>
    </svg>`,
  },
  {
    key: "other",
    label: "Other",
    emoji: "📦",
    defaultName: "",
    placeholder: "e.g. Storage Facility, Land",
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="32" height="32" rx="6" fill="#6B7280"/>
      <rect x="8" y="8" width="32" height="10" rx="6" fill="#9CA3AF"/>
      <path d="M24 18v22" stroke="white" stroke-width="2" opacity="0.2"/>
      <path d="M8 24h32" stroke="white" stroke-width="2" opacity="0.2"/>
      <circle cx="24" cy="18" r="3" fill="white" opacity="0.3"/>
    </svg>`,
  },
];

// Premium item icons — filled colorful with detail
export const ITEM_PRESETS: ItemPreset[] = [
  // Property
  {
    key: "unit",
    label: "Unit",
    emoji: "🚪",
    category: "Property",
    spaceTypes: ["multifamily", "rental", "hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="6" width="36" height="52" rx="4" fill="#3B82F6"/>
      <rect x="14" y="6" width="36" height="10" rx="4" fill="#2563EB"/>
      <rect x="20" y="20" width="24" height="32" rx="3" fill="#60A5FA" opacity="0.4"/>
      <circle cx="40" cy="36" r="2.5" fill="white" opacity="0.6"/>
      <rect x="26" y="10" width="12" height="4" rx="1" fill="white" opacity="0.3"/>
    </svg>`,
  },
  {
    key: "common-area",
    label: "Common Area",
    emoji: "🏛️",
    category: "Property",
    spaceTypes: ["multifamily", "hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="20" width="48" height="36" rx="3" fill="#6366F1"/>
      <path d="M8 20L32 6l24 14H8z" fill="#818CF8"/>
      <rect x="14" y="28" width="8" height="20" rx="2" fill="white" opacity="0.25"/>
      <rect x="28" y="28" width="8" height="20" rx="2" fill="white" opacity="0.25"/>
      <rect x="42" y="28" width="8" height="20" rx="2" fill="white" opacity="0.25"/>
      <rect x="8" y="52" width="48" height="4" rx="1" fill="#4F46E5"/>
    </svg>`,
  },
  {
    key: "parking",
    label: "Parking",
    emoji: "🅿️",
    category: "Property",
    spaceTypes: ["multifamily", "commercial", "mixed", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="48" height="48" rx="8" fill="#6B7280"/>
      <rect x="8" y="8" width="48" height="10" rx="8" fill="#9CA3AF"/>
      <text x="32" y="46" text-anchor="middle" font-family="Arial" font-size="30" font-weight="bold" fill="white" opacity="0.7">P</text>
    </svg>`,
  },
  {
    key: "elevator",
    label: "Elevator",
    emoji: "🛗",
    category: "Property",
    spaceTypes: ["multifamily", "commercial", "mixed", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="4" width="40" height="56" rx="4" fill="#475569"/>
      <rect x="12" y="4" width="40" height="10" rx="4" fill="#64748B"/>
      <rect x="18" y="18" width="12" height="36" rx="2" fill="#334155"/>
      <rect x="34" y="18" width="12" height="36" rx="2" fill="#334155"/>
      <path d="M24 28l-4 6h8z" fill="white" opacity="0.4"/>
      <path d="M40 36l4-6h-8z" fill="white" opacity="0.4"/>
      <circle cx="32" cy="9" r="3" fill="#FDE68A" opacity="0.6"/>
    </svg>`,
  },
  {
    key: "fire-system",
    label: "Fire System",
    emoji: "🧯",
    category: "Safety",
    spaceTypes: ["residential", "multifamily", "commercial", "industrial", "hoa", "mixed", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="16" width="24" height="40" rx="6" fill="#EF4444"/>
      <rect x="20" y="16" width="24" height="10" rx="6" fill="#DC2626"/>
      <rect x="26" y="8" width="12" height="8" rx="2" fill="#B91C1C"/>
      <rect x="30" y="4" width="4" height="6" rx="1" fill="#991B1B"/>
      <rect x="24" y="32" width="16" height="4" rx="2" fill="white" opacity="0.3"/>
      <circle cx="32" cy="44" r="4" fill="white" opacity="0.2"/>
    </svg>`,
  },
  {
    key: "security",
    label: "Security",
    emoji: "🔒",
    category: "Safety",
    spaceTypes: ["residential", "multifamily", "commercial", "industrial", "hoa", "mixed", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="26" width="36" height="30" rx="5" fill="#6B7280"/>
      <rect x="14" y="26" width="36" height="8" rx="5" fill="#9CA3AF"/>
      <path d="M22 26V18a10 10 0 0120 0v8" fill="none" stroke="#6B7280" stroke-width="5" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="5" fill="#374151"/>
      <rect x="30" y="42" width="4" height="8" rx="1" fill="#374151"/>
    </svg>`,
  },
  // Kitchen
  {
    key: "dishwasher",
    label: "Dishwasher",
    emoji: "🍽️",
    category: "Kitchen",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="4" width="40" height="56" rx="6" fill="#F97316"/>
      <rect x="12" y="4" width="40" height="14" rx="6" fill="#EA580C"/>
      <circle cx="32" cy="11" r="3" fill="white" opacity="0.6"/>
      <circle cx="22" cy="11" r="2" fill="white" opacity="0.3"/>
      <circle cx="32" cy="40" r="13" fill="white" opacity="0.2"/>
      <circle cx="32" cy="40" r="7" fill="white" opacity="0.25"/>
    </svg>`,
  },
  {
    key: "refrigerator",
    label: "Refrigerator",
    emoji: "🧊",
    category: "Kitchen",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="4" width="36" height="56" rx="5" fill="#EF4444"/>
      <rect x="14" y="4" width="36" height="24" rx="5" fill="#DC2626"/>
      <rect x="14" y="28" width="36" height="32" rx="5" fill="#EF4444"/>
      <rect x="42" y="12" width="3" height="10" rx="1.5" fill="white" opacity="0.4"/>
      <rect x="42" y="34" width="3" height="12" rx="1.5" fill="white" opacity="0.4"/>
      <rect x="20" y="10" width="10" height="8" rx="2" fill="white" opacity="0.15"/>
    </svg>`,
  },
  {
    key: "oven",
    label: "Oven / Stove",
    emoji: "🍳",
    category: "Kitchen",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="44" height="52" rx="5" fill="#F59E0B"/>
      <rect x="10" y="6" width="44" height="18" rx="5" fill="#D97706"/>
      <circle cx="22" cy="15" r="4" fill="#FDE68A" opacity="0.6"/>
      <circle cx="36" cy="15" r="4" fill="#FDE68A" opacity="0.6"/>
      <circle cx="48" cy="15" r="3" fill="#FDE68A" opacity="0.4"/>
      <rect x="16" y="30" width="32" height="22" rx="3" fill="white" opacity="0.2"/>
      <rect x="16" y="40" width="32" height="1" fill="white" opacity="0.15"/>
    </svg>`,
  },
  {
    key: "microwave",
    label: "Microwave",
    emoji: "♨️",
    category: "Kitchen",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="14" width="52" height="36" rx="5" fill="#FB923C"/>
      <rect x="6" y="14" width="52" height="6" rx="5" fill="#EA580C"/>
      <rect x="12" y="24" width="30" height="20" rx="3" fill="white" opacity="0.2"/>
      <circle cx="50" cy="30" r="3" fill="white" opacity="0.5"/>
      <circle cx="50" cy="38" r="2" fill="white" opacity="0.35"/>
    </svg>`,
  },
  // Laundry
  {
    key: "washer",
    label: "Washing Machine",
    emoji: "🫧",
    category: "Laundry",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="4" width="40" height="56" rx="6" fill="#3B82F6"/>
      <rect x="12" y="4" width="40" height="14" rx="6" fill="#2563EB"/>
      <circle cx="20" cy="11" r="3" fill="white" opacity="0.5"/>
      <rect x="34" y="9" width="12" height="4" rx="2" fill="white" opacity="0.3"/>
      <circle cx="32" cy="40" r="15" fill="white" opacity="0.15"/>
      <circle cx="32" cy="40" r="10" fill="white" opacity="0.15"/>
      <path d="M24 37c4 6 12 6 16 0" fill="#93C5FD" opacity="0.4"/>
    </svg>`,
  },
  {
    key: "dryer",
    label: "Dryer",
    emoji: "💨",
    category: "Laundry",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="4" width="40" height="56" rx="6" fill="#60A5FA"/>
      <rect x="12" y="4" width="40" height="14" rx="6" fill="#3B82F6"/>
      <circle cx="44" cy="11" r="3" fill="white" opacity="0.5"/>
      <circle cx="36" cy="11" r="2" fill="white" opacity="0.3"/>
      <circle cx="32" cy="40" r="15" fill="white" opacity="0.15"/>
      <rect x="24" y="34" width="16" height="3" rx="1.5" fill="white" opacity="0.3" transform="rotate(-15 32 35.5)"/>
      <rect x="24" y="40" width="16" height="3" rx="1.5" fill="white" opacity="0.25" transform="rotate(10 32 41.5)"/>
      <rect x="24" y="46" width="16" height="3" rx="1.5" fill="white" opacity="0.2" transform="rotate(-10 32 47.5)"/>
    </svg>`,
  },
  // Climate
  {
    key: "hvac",
    label: "HVAC / AC",
    emoji: "🌡️",
    category: "Climate",
    spaceTypes: ["residential", "multifamily", "commercial", "industrial", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="52" height="26" rx="5" fill="#14B8A6"/>
      <rect x="6" y="10" width="52" height="8" rx="5" fill="#0D9488"/>
      <rect x="10" y="30" width="44" height="4" rx="2" fill="white" opacity="0.3"/>
      <circle cx="50" cy="18" r="2" fill="white" opacity="0.5"/>
      <path d="M22 42v6l-4 4" fill="none" stroke="#14B8A6" stroke-width="3" stroke-linecap="round"/>
      <path d="M32 42v8l-4 4" fill="none" stroke="#14B8A6" stroke-width="3" stroke-linecap="round"/>
      <path d="M42 42v6l-4 4" fill="none" stroke="#14B8A6" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    key: "water-heater",
    label: "Water Heater",
    emoji: "🚿",
    category: "Climate",
    spaceTypes: ["residential", "multifamily", "commercial", "industrial", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="8" width="28" height="44" rx="14" fill="#0891B2"/>
      <rect x="18" y="8" width="28" height="14" rx="14" fill="#06B6D4"/>
      <circle cx="32" cy="38" r="6" fill="white" opacity="0.2"/>
      <circle cx="32" cy="38" r="2.5" fill="white" opacity="0.4"/>
      <path d="M29 18c0-4 6-4 6-8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
      <path d="M29 26c0-4 6-4 6-8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
      <rect x="24" y="52" width="4" height="6" rx="1" fill="#0891B2"/>
      <rect x="36" y="52" width="4" height="6" rx="1" fill="#0891B2"/>
    </svg>`,
  },
  // Outdoor
  {
    key: "lawnmower",
    label: "Lawn Mower",
    emoji: "🏡",
    category: "Outdoor",
    spaceTypes: ["residential", "industrial", "hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="18" width="38" height="18" rx="4" fill="#22C55E"/>
      <rect x="12" y="18" width="38" height="6" rx="4" fill="#16A34A"/>
      <path d="M30 18V10a2 2 0 012-2h8" fill="none" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/>
      <circle cx="18" cy="44" r="7" fill="#15803D"/>
      <circle cx="18" cy="44" r="3" fill="#22C55E"/>
      <circle cx="46" cy="44" r="7" fill="#15803D"/>
      <circle cx="46" cy="44" r="3" fill="#22C55E"/>
      <rect x="22" y="24" width="10" height="4" rx="1" fill="white" opacity="0.25"/>
    </svg>`,
  },
  {
    key: "grill",
    label: "Grill",
    emoji: "🥩",
    category: "Outdoor",
    spaceTypes: ["residential", "industrial", "hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="26" rx="20" ry="8" fill="#15803D"/>
      <path d="M12 26c0 10 9 16 20 16s20-6 20-16" fill="#166534"/>
      <ellipse cx="32" cy="26" rx="20" ry="8" fill="#22C55E"/>
      <rect x="20" y="24" width="4" height="4" rx="1" fill="white" opacity="0.3"/>
      <rect x="30" y="24" width="4" height="4" rx="1" fill="white" opacity="0.3"/>
      <rect x="40" y="24" width="4" height="4" rx="1" fill="white" opacity="0.3"/>
      <rect x="22" y="42" width="3" height="14" rx="1" fill="#15803D"/>
      <rect x="39" y="42" width="3" height="14" rx="1" fill="#15803D"/>
      <rect x="18" y="54" width="28" height="3" rx="1" fill="#15803D"/>
    </svg>`,
  },
  {
    key: "pool",
    label: "Pool",
    emoji: "🏊",
    category: "Outdoor",
    spaceTypes: ["residential", "industrial", "hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="48" height="36" rx="6" fill="#34D399"/>
      <rect x="8" y="16" width="48" height="36" rx="6" fill="#10B981"/>
      <path d="M8 30c6-4 12 0 18-4s12 0 18-4s8 0 12-2" fill="white" opacity="0.15"/>
      <path d="M8 38c6-4 12 0 18-4s12 0 18-4s8 0 12-2" fill="white" opacity="0.12"/>
      <path d="M8 46c6-4 12 0 18-4s12 0 18-4s8 0 12-2" fill="white" opacity="0.1"/>
      <rect x="12" y="8" width="4" height="16" rx="2" fill="#059669"/>
      <circle cx="14" cy="8" r="4" fill="#34D399"/>
    </svg>`,
  },
  {
    key: "backyard",
    label: "Backyard",
    emoji: "🌳",
    category: "Outdoor",
    spaceTypes: ["residential", "industrial", "hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="44" width="56" height="16" rx="4" fill="#86EFAC"/>
      <rect x="4" y="44" width="56" height="8" rx="4" fill="#4ADE80"/>
      <circle cx="24" cy="24" r="14" fill="#22C55E"/>
      <circle cx="18" cy="20" r="10" fill="#16A34A"/>
      <circle cx="30" cy="18" r="10" fill="#15803D"/>
      <rect x="22" y="30" width="4" height="14" rx="1" fill="#92400E"/>
      <circle cx="48" cy="32" r="8" fill="#4ADE80"/>
      <circle cx="44" cy="30" r="6" fill="#22C55E"/>
      <rect x="46" y="36" width="3" height="8" rx="1" fill="#92400E"/>
    </svg>`,
  },
  {
    key: "frontlawn",
    label: "Front Lawn",
    emoji: "🏡",
    category: "Outdoor",
    spaceTypes: ["residential", "industrial", "hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="40" width="56" height="20" rx="4" fill="#86EFAC"/>
      <rect x="4" y="40" width="56" height="10" rx="4" fill="#4ADE80"/>
      <rect x="20" y="18" width="24" height="22" rx="2" fill="#93C5FD"/>
      <path d="M16 22L32 10l16 12" fill="#3B82F6"/>
      <rect x="28" y="28" width="8" height="12" rx="1" fill="#60A5FA"/>
      <path d="M10 44c3-2 6 0 9-2s6 0 9-2 6 0 9-2 6 0 9-2 6 0 8-1" stroke="#22C55E" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
    </svg>`,
  },
  // Electronics
  {
    key: "tv",
    label: "TV",
    emoji: "📺",
    category: "Electronics",
    spaceTypes: ["residential", "multifamily", "commercial", "rental", "mixed", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="56" height="34" rx="4" fill="#7C3AED"/>
      <rect x="8" y="14" width="48" height="26" rx="2" fill="#1E1B4B" opacity="0.6"/>
      <rect x="8" y="14" width="48" height="26" rx="2" fill="#A78BFA" opacity="0.15"/>
      <rect x="24" y="44" width="4" height="8" fill="#7C3AED"/>
      <rect x="36" y="44" width="4" height="8" fill="#7C3AED"/>
      <rect x="18" y="52" width="28" height="3" rx="1.5" fill="#6D28D9"/>
      <circle cx="52" cy="38" r="1.5" fill="#C4B5FD" opacity="0.5"/>
    </svg>`,
  },
  {
    key: "computer",
    label: "Computer",
    emoji: "💻",
    category: "Electronics",
    spaceTypes: ["residential", "multifamily", "commercial", "rental", "mixed", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="48" height="30" rx="4" fill="#6D28D9"/>
      <rect x="12" y="12" width="40" height="22" rx="2" fill="#1E1B4B" opacity="0.5"/>
      <rect x="12" y="12" width="40" height="22" rx="2" fill="#A78BFA" opacity="0.1"/>
      <rect x="26" y="38" width="12" height="6" fill="#7C3AED"/>
      <rect x="20" y="44" width="24" height="4" rx="2" fill="#6D28D9"/>
      <circle cx="32" cy="36" r="1.5" fill="#C4B5FD" opacity="0.5"/>
    </svg>`,
  },
  // Home
  {
    key: "furniture",
    label: "Furniture",
    emoji: "🛋️",
    category: "Home",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 20v-6a5 5 0 015-5h26a5 5 0 015 5v6" fill="#F472B6"/>
      <rect x="8" y="20" width="48" height="18" rx="4" fill="#EC4899"/>
      <rect x="8" y="20" width="48" height="6" rx="4" fill="#DB2777"/>
      <rect x="4" y="20" width="6" height="22" rx="3" fill="#BE185D"/>
      <rect x="54" y="20" width="6" height="22" rx="3" fill="#BE185D"/>
      <rect x="14" y="38" width="4" height="10" rx="1" fill="#9D174D"/>
      <rect x="46" y="38" width="4" height="10" rx="1" fill="#9D174D"/>
    </svg>`,
  },
  {
    key: "roof",
    label: "Roof",
    emoji: "🏗️",
    category: "Home",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 30L32 8l28 22H4z" fill="#F43F5E"/>
      <path d="M4 30L32 8l28 22H4z" fill="#E11D48"/>
      <path d="M32 8L4 30h56L32 8z" fill="#FB7185"/>
      <rect x="12" y="30" width="40" height="26" rx="2" fill="#E11D48"/>
      <rect x="26" y="38" width="12" height="18" rx="2" fill="white" opacity="0.2"/>
      <rect x="14" y="34" width="8" height="8" rx="1" fill="white" opacity="0.15"/>
      <rect x="42" y="34" width="8" height="8" rx="1" fill="white" opacity="0.15"/>
    </svg>`,
  },
  {
    key: "plumbing",
    label: "Plumbing",
    emoji: "🪠",
    category: "Home",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="20" width="28" height="12" rx="4" fill="#EC4899"/>
      <rect x="24" y="6" width="16" height="14" rx="2" fill="#F472B6"/>
      <rect x="26" y="32" width="4" height="20" rx="2" fill="#DB2777"/>
      <path d="M30 52c0 0 0 6 8 6" fill="none" stroke="#DB2777" stroke-width="4" stroke-linecap="round"/>
      <rect x="34" y="32" width="4" height="12" rx="2" fill="#DB2777"/>
      <circle cx="28" cy="42" r="3" fill="#F9A8D4" opacity="0.5"/>
    </svg>`,
  },
  {
    key: "electrical",
    label: "Electrical",
    emoji: "⚡",
    category: "Home",
    spaceTypes: ["residential", "multifamily", "rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 4L18 32h14L16 60l34-34H34L46 4H38z" fill="#F59E0B"/>
      <path d="M38 4L18 32h14L16 60l34-34H34L46 4H38z" fill="#FBBF24"/>
      <path d="M38 4H46L34 26h16L16 60l16-28H18L38 4z" fill="#F59E0B"/>
    </svg>`,
  },
  // Vehicle
  {
    key: "engine",
    label: "Engine",
    emoji: "🔧",
    category: "Vehicle",
    spaceTypes: ["commercial", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="14" width="40" height="36" rx="5" fill="#64748B"/>
      <rect x="12" y="14" width="40" height="8" rx="5" fill="#475569"/>
      <circle cx="32" cy="34" r="12" fill="#334155"/>
      <circle cx="32" cy="34" r="6" fill="#94A3B8"/>
      <circle cx="32" cy="34" r="2" fill="#CBD5E1"/>
      <rect x="4" y="22" width="8" height="6" rx="2" fill="#475569"/>
      <rect x="52" y="22" width="8" height="6" rx="2" fill="#475569"/>
      <rect x="4" y="36" width="8" height="6" rx="2" fill="#475569"/>
      <rect x="52" y="36" width="8" height="6" rx="2" fill="#475569"/>
    </svg>`,
  },
  {
    key: "tires",
    label: "Tires",
    emoji: "🛞",
    category: "Vehicle",
    spaceTypes: ["commercial", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="26" fill="#334155"/>
      <circle cx="32" cy="32" r="20" fill="#1E293B"/>
      <circle cx="32" cy="32" r="8" fill="#64748B"/>
      <circle cx="32" cy="32" r="3" fill="#94A3B8"/>
      <rect x="30" y="6" width="4" height="10" rx="1" fill="#475569"/>
      <rect x="30" y="48" width="4" height="10" rx="1" fill="#475569"/>
      <rect x="6" y="30" width="10" height="4" rx="1" fill="#475569"/>
      <rect x="48" y="30" width="10" height="4" rx="1" fill="#475569"/>
    </svg>`,
  },
  {
    key: "brakes",
    label: "Brakes",
    emoji: "🛑",
    category: "Vehicle",
    spaceTypes: ["commercial", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="24" fill="#475569"/>
      <circle cx="32" cy="32" r="18" fill="#64748B"/>
      <circle cx="32" cy="32" r="18" fill="#94A3B8" opacity="0.3"/>
      <rect x="28" y="12" width="8" height="18" rx="3" fill="#EF4444"/>
      <rect x="28" y="12" width="8" height="6" rx="3" fill="#DC2626"/>
      <circle cx="32" cy="32" r="6" fill="#334155"/>
      <circle cx="32" cy="32" r="2.5" fill="#64748B"/>
    </svg>`,
  },
  {
    key: "insurance",
    label: "Insurance",
    emoji: "🛡️",
    category: "Vehicle",
    spaceTypes: ["commercial", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 16v18c0 14 10 22 24 26 14-4 24-12 24-26V16L32 4z" fill="#64748B"/>
      <path d="M32 4L8 16v4l24-12 24 12v-4L32 4z" fill="#94A3B8"/>
      <path d="M24 34l6 6 12-14" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
    </svg>`,
  },
  {
    key: "oil-change",
    label: "Oil & Fluids",
    emoji: "🛢️",
    category: "Vehicle",
    spaceTypes: ["commercial", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 6c-10 14-18 20-18 30a18 18 0 0036 0c0-10-8-16-18-30z" fill="#475569"/>
      <path d="M32 6c-10 14-18 20-18 30a18 18 0 0036 0c0-10-8-16-18-30z" fill="#64748B"/>
      <path d="M32 16c-6 10-12 14-12 22a12 12 0 0024 0c0-8-6-12-12-22z" fill="#334155" opacity="0.5"/>
      <path d="M24 40c0-5 4-8 8-14" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
    </svg>`,
  },
  {
    key: "battery",
    label: "Battery",
    emoji: "🔋",
    category: "Vehicle",
    spaceTypes: ["commercial", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="18" width="44" height="34" rx="5" fill="#64748B"/>
      <rect x="10" y="18" width="44" height="8" rx="5" fill="#475569"/>
      <rect x="20" y="12" width="8" height="6" rx="2" fill="#EF4444"/>
      <rect x="36" y="12" width="8" height="6" rx="2" fill="#334155"/>
      <path d="M28 38h8" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
      <path d="M32 34v8" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },
  {
    key: "registration",
    label: "Registration",
    emoji: "📋",
    category: "Vehicle",
    spaceTypes: ["commercial", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="6" width="40" height="52" rx="5" fill="#94A3B8"/>
      <rect x="12" y="6" width="40" height="12" rx="5" fill="#64748B"/>
      <rect x="18" y="10" width="28" height="4" rx="1" fill="white" opacity="0.3"/>
      <rect x="18" y="24" width="22" height="4" rx="1" fill="white" opacity="0.2"/>
      <rect x="18" y="32" width="26" height="4" rx="1" fill="white" opacity="0.18"/>
      <rect x="18" y="40" width="18" height="4" rx="1" fill="white" opacity="0.15"/>
      <rect x="18" y="48" width="14" height="4" rx="1" fill="white" opacity="0.12"/>
    </svg>`,
  },
  // Office
  {
    key: "desk",
    label: "Desk",
    emoji: "🪑",
    category: "Office Equipment",
    spaceTypes: ["mixed", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="22" width="52" height="8" rx="3" fill="#8B5CF6"/>
      <rect x="6" y="22" width="52" height="3" rx="3" fill="#7C3AED"/>
      <rect x="10" y="30" width="5" height="22" rx="1" fill="#6D28D9"/>
      <rect x="49" y="30" width="5" height="22" rx="1" fill="#6D28D9"/>
      <rect x="36" y="32" width="16" height="14" rx="2" fill="#7C3AED"/>
      <rect x="36" y="32" width="16" height="4" rx="2" fill="#6D28D9"/>
      <rect x="36" y="40" width="16" height="2" fill="#6D28D9" opacity="0.3"/>
    </svg>`,
  },
  {
    key: "printer",
    label: "Printer",
    emoji: "🖨️",
    category: "Office Equipment",
    spaceTypes: ["mixed", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="20" width="48" height="22" rx="4" fill="#7C3AED"/>
      <rect x="8" y="20" width="48" height="6" rx="4" fill="#6D28D9"/>
      <rect x="16" y="8" width="32" height="12" rx="3" fill="#A78BFA"/>
      <rect x="16" y="42" width="32" height="14" rx="3" fill="#DDD6FE"/>
      <rect x="22" y="48" width="20" height="3" rx="1" fill="#8B5CF6" opacity="0.3"/>
      <circle cx="48" cy="28" r="2.5" fill="#C4B5FD" opacity="0.6"/>
    </svg>`,
  },
  {
    key: "chair",
    label: "Chair",
    emoji: "💺",
    category: "Office Equipment",
    spaceTypes: ["mixed", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8h24v22H20z" fill="#A78BFA"/>
      <path d="M20 8h24v6H20z" fill="#8B5CF6"/>
      <rect x="16" y="30" width="32" height="6" rx="3" fill="#7C3AED"/>
      <rect x="30" y="36" width="4" height="14" rx="1" fill="#6D28D9"/>
      <path d="M18 54h28" stroke="#6D28D9" stroke-width="4" stroke-linecap="round"/>
      <circle cx="20" cy="54" r="3" fill="#8B5CF6"/>
      <circle cx="44" cy="54" r="3" fill="#8B5CF6"/>
      <circle cx="32" cy="54" r="3" fill="#7C3AED"/>
    </svg>`,
  },
  // Rental Property
  {
    key: "lease",
    label: "Lease",
    emoji: "📝",
    category: "Rental",
    spaceTypes: ["rental", "multifamily", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="4" width="40" height="56" rx="5" fill="#F59E0B"/>
      <rect x="12" y="4" width="40" height="12" rx="5" fill="#D97706"/>
      <rect x="18" y="8" width="28" height="4" rx="1" fill="white" opacity="0.4"/>
      <rect x="18" y="22" width="24" height="3" rx="1" fill="white" opacity="0.25"/>
      <rect x="18" y="29" width="28" height="3" rx="1" fill="white" opacity="0.2"/>
      <rect x="18" y="36" width="20" height="3" rx="1" fill="white" opacity="0.18"/>
      <path d="M30 46l5 5 9-9" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
    </svg>`,
  },
  {
    key: "tenant",
    label: "Tenant Info",
    emoji: "👤",
    category: "Rental",
    spaceTypes: ["rental", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="22" r="12" fill="#FBBF24"/>
      <circle cx="32" cy="22" r="12" fill="#F59E0B"/>
      <circle cx="32" cy="20" r="6" fill="#FDE68A" opacity="0.5"/>
      <path d="M12 56c0-12 9-20 20-20s20 8 20 20" fill="#D97706"/>
      <path d="M12 56c0-12 9-20 20-20s20 8 20 20" fill="#F59E0B" opacity="0.7"/>
    </svg>`,
  },
  {
    key: "deposit",
    label: "Deposit",
    emoji: "💰",
    category: "Rental",
    spaceTypes: ["rental", "multifamily", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="24" fill="#F59E0B"/>
      <circle cx="32" cy="32" r="24" fill="#D97706"/>
      <circle cx="32" cy="32" r="20" fill="#F59E0B"/>
      <circle cx="32" cy="32" r="16" fill="#FBBF24" opacity="0.4"/>
      <text x="32" y="40" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="white" opacity="0.7">$</text>
    </svg>`,
  },
  {
    key: "inspection",
    label: "Inspection",
    emoji: "🔍",
    category: "Rental",
    spaceTypes: ["rental", "residential", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="4" width="36" height="52" rx="5" fill="#FBBF24"/>
      <rect x="14" y="4" width="36" height="10" rx="5" fill="#F59E0B"/>
      <rect x="22" y="0" width="20" height="10" rx="4" fill="#D97706"/>
      <rect x="26" y="2" width="12" height="6" rx="2" fill="#FBBF24"/>
      <path d="M24 28l5 5 10-10" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
      <rect x="22" y="40" width="20" height="3" rx="1" fill="white" opacity="0.25"/>
      <rect x="22" y="47" width="14" height="3" rx="1" fill="white" opacity="0.2"/>
    </svg>`,
  },
  // Boat
  {
    key: "boat-engine",
    label: "Engine",
    emoji: "⚙️",
    category: "Marine",
    spaceTypes: ["hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="14" width="40" height="36" rx="5" fill="#06B6D4"/>
      <rect x="12" y="14" width="40" height="8" rx="5" fill="#0891B2"/>
      <circle cx="32" cy="34" r="12" fill="#0E7490"/>
      <circle cx="32" cy="34" r="6" fill="#22D3EE" opacity="0.5"/>
      <circle cx="32" cy="34" r="2" fill="white" opacity="0.5"/>
      <rect x="4" y="22" width="8" height="6" rx="2" fill="#0891B2"/>
      <rect x="52" y="22" width="8" height="6" rx="2" fill="#0891B2"/>
      <rect x="4" y="36" width="8" height="6" rx="2" fill="#0891B2"/>
      <rect x="52" y="36" width="8" height="6" rx="2" fill="#0891B2"/>
    </svg>`,
  },
  {
    key: "boat-registration",
    label: "Registration",
    emoji: "📋",
    category: "Marine",
    spaceTypes: ["hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="6" width="40" height="52" rx="5" fill="#06B6D4"/>
      <rect x="12" y="6" width="40" height="12" rx="5" fill="#0891B2"/>
      <rect x="18" y="10" width="28" height="4" rx="1" fill="white" opacity="0.35"/>
      <rect x="18" y="24" width="22" height="3" rx="1" fill="white" opacity="0.25"/>
      <rect x="18" y="31" width="26" height="3" rx="1" fill="white" opacity="0.2"/>
      <path d="M18 42c4-3 8 0 12-3s8 0 12-3" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
      <path d="M18 48c4-3 8 0 12-3s8 0 12-3" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.2"/>
    </svg>`,
  },
  {
    key: "boat-insurance",
    label: "Insurance",
    emoji: "🛡️",
    category: "Marine",
    spaceTypes: ["hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 16v18c0 14 10 22 24 26 14-4 24-12 24-26V16L32 4z" fill="#06B6D4"/>
      <path d="M32 4L8 16v4l24-12 24 12v-4L32 4z" fill="#22D3EE"/>
      <path d="M24 32l6 6 12-14" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
    </svg>`,
  },
  {
    key: "hull",
    label: "Hull",
    emoji: "🚢",
    category: "Marine",
    spaceTypes: ["hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 24h48l-6 18c-2 4-6 6-10 6H24c-4 0-8-2-10-6L8 24z" fill="#0891B2"/>
      <path d="M8 24h48v6H8z" fill="#06B6D4"/>
      <rect x="14" y="14" width="36" height="10" rx="3" fill="#22D3EE"/>
      <rect x="20" y="28" width="4" height="8" rx="1" fill="white" opacity="0.2"/>
      <rect x="30" y="28" width="4" height="8" rx="1" fill="white" opacity="0.2"/>
      <rect x="40" y="28" width="4" height="8" rx="1" fill="white" opacity="0.2"/>
    </svg>`,
  },
  {
    key: "trailer",
    label: "Trailer",
    emoji: "🚛",
    category: "Marine",
    spaceTypes: ["hoa", "other"],
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30h40l4-10H14L10 30z" fill="#22D3EE"/>
      <rect x="6" y="30" width="48" height="6" rx="2" fill="#06B6D4"/>
      <circle cx="20" cy="42" r="6" fill="#0E7490"/>
      <circle cx="20" cy="42" r="3" fill="#22D3EE"/>
      <circle cx="44" cy="42" r="6" fill="#0E7490"/>
      <circle cx="44" cy="42" r="3" fill="#22D3EE"/>
      <rect x="54" y="31" width="8" height="4" rx="1" fill="#0891B2"/>
    </svg>`,
  },
];

export const CATEGORY_COLORS: Record<string, { bg: string; icon: string; badge: string; cardGradient: string }> = {
  Property:           { bg: "bg-blue-50",    icon: "text-blue-600",    badge: "bg-blue-100 text-blue-700",   cardGradient: "from-blue-400 to-blue-600" },
  Safety:             { bg: "bg-red-50",     icon: "text-red-600",     badge: "bg-red-100 text-red-700",     cardGradient: "from-red-400 to-red-600" },
  Kitchen:            { bg: "bg-amber-50",   icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700",  cardGradient: "from-amber-400 to-amber-600" },
  Laundry:            { bg: "bg-sky-50",     icon: "text-sky-600",     badge: "bg-sky-100 text-sky-700",      cardGradient: "from-sky-400 to-sky-600" },
  Climate:            { bg: "bg-teal-50",    icon: "text-teal-600",    badge: "bg-teal-100 text-teal-700",    cardGradient: "from-teal-400 to-teal-600" },
  Outdoor:            { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700", cardGradient: "from-emerald-400 to-emerald-600" },
  Electronics:        { bg: "bg-violet-50",  icon: "text-violet-600",  badge: "bg-violet-100 text-violet-700", cardGradient: "from-violet-400 to-violet-600" },
  Home:               { bg: "bg-rose-50",    icon: "text-rose-600",    badge: "bg-rose-100 text-rose-700",    cardGradient: "from-rose-400 to-rose-600" },
  Vehicle:            { bg: "bg-slate-50",   icon: "text-slate-600",   badge: "bg-slate-100 text-slate-700",  cardGradient: "from-slate-500 to-slate-700" },
  "Office Equipment": { bg: "bg-purple-50",  icon: "text-purple-600",  badge: "bg-purple-100 text-purple-700", cardGradient: "from-purple-400 to-purple-600" },
  Rental:             { bg: "bg-amber-50",   icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700",  cardGradient: "from-amber-400 to-amber-600" },
  Marine:             { bg: "bg-cyan-50",    icon: "text-cyan-600",    badge: "bg-cyan-100 text-cyan-700",    cardGradient: "from-cyan-400 to-cyan-600" },
};

const DEFAULT_COLORS = { bg: "bg-gray-50", icon: "text-gray-500", badge: "bg-gray-100 text-gray-600", cardGradient: "from-gray-400 to-gray-600" };

export function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category] || DEFAULT_COLORS;
}

export const SPACE_COLORS: Record<string, { accent: string; iconColor: string; gradient: string; cardGradient: string }> = {
  residential: { accent: "bg-blue-500",    iconColor: "text-blue-600",   gradient: "from-blue-500 to-blue-600",     cardGradient: "from-blue-500 to-blue-700" },
  multifamily: { accent: "bg-indigo-500",  iconColor: "text-indigo-600", gradient: "from-indigo-500 to-indigo-600", cardGradient: "from-indigo-500 to-indigo-700" },
  commercial:  { accent: "bg-slate-500",   iconColor: "text-slate-600",  gradient: "from-slate-500 to-slate-600",   cardGradient: "from-slate-600 to-slate-800" },
  rental:      { accent: "bg-amber-500",   iconColor: "text-amber-600",  gradient: "from-amber-500 to-amber-600",   cardGradient: "from-amber-500 to-amber-700" },
  industrial:  { accent: "bg-orange-500",  iconColor: "text-orange-600", gradient: "from-orange-500 to-orange-600", cardGradient: "from-orange-500 to-orange-700" },
  hoa:         { accent: "bg-cyan-500",    iconColor: "text-cyan-600",   gradient: "from-cyan-500 to-cyan-600",     cardGradient: "from-cyan-500 to-cyan-700" },
  mixed:       { accent: "bg-purple-500",  iconColor: "text-purple-600", gradient: "from-purple-500 to-purple-600", cardGradient: "from-purple-500 to-purple-700" },
  other:       { accent: "bg-gray-400",    iconColor: "text-gray-500",   gradient: "from-gray-400 to-gray-500",     cardGradient: "from-gray-500 to-gray-700" },
};

export function getSpaceColors(key: string) {
  return SPACE_COLORS[key] || SPACE_COLORS.other;
}

export function getSpaceIcon(key: string): SpaceIcon {
  return SPACE_ICONS.find((i) => i.key === key) || SPACE_ICONS[SPACE_ICONS.length - 1];
}

export function getItemPreset(key: string): ItemPreset | undefined {
  return ITEM_PRESETS.find((p) => p.key === key);
}

const UNIT_PROPERTY_TYPES = ["multifamily", "commercial", "hoa", "mixed", "industrial"];

export function hasUnits(spaceType: string): boolean {
  return UNIT_PROPERTY_TYPES.includes(spaceType);
}

export function getPresetsForSpaceType(spaceType: string): ItemPreset[] {
  return ITEM_PRESETS.filter((p) => p.spaceTypes.includes(spaceType));
}
