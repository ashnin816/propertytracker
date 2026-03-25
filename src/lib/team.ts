export type Role = "owner" | "manager" | "technician" | "tenant";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string; // initials color
  propertyIds: string[]; // assigned properties (empty = all for owner)
  unitId?: string; // for tenants
  createdAt: string;
}

const TEAM_KEY = "propertytracker_team";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-500",
];

function getTeam(): TeamMember[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TEAM_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTeam(team: TeamMember[]) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export function getAllMembers(): TeamMember[] {
  return getTeam().sort((a, b) => {
    const order: Record<Role, number> = { owner: 0, manager: 1, technician: 2, tenant: 3 };
    return order[a.role] - order[b.role];
  });
}

export function getMembersForProperty(propertyId: string): TeamMember[] {
  return getTeam().filter(
    (m) => m.role === "owner" || m.propertyIds.includes(propertyId)
  );
}

export function addMember(name: string, email: string, role: Role, propertyIds: string[], unitId?: string): TeamMember {
  const team = getTeam();
  const member: TeamMember = {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    avatar: AVATAR_COLORS[team.length % AVATAR_COLORS.length],
    propertyIds,
    unitId,
    createdAt: new Date().toISOString(),
  };
  team.push(member);
  saveTeam(team);
  return member;
}

export function removeMember(id: string) {
  const team = getTeam().filter((m) => m.id !== id);
  saveTeam(team);
}

export function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  technician: "Technician",
  tenant: "Tenant",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full access to everything",
  manager: "Manage assigned properties",
  technician: "View & upload docs for assigned properties",
  tenant: "View their unit only",
};

export function loadDemoTeam() {
  if (getTeam().length > 0) return;
  addMember("You", "you@company.com", "owner", []);
  addMember("Sarah Chen", "sarah@company.com", "manager", []);
  addMember("Mike Johnson", "mike@company.com", "technician", []);
}
