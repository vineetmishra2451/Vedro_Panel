import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PERMISSIONS: Record<string, Role[]> = {
  // Finance
  "finance:read": ["ADMIN", "FINANCE", "APPROVER", "VIEWER", "PARTNER"],
  "finance:write": ["ADMIN", "FINANCE"],
  "finance:approve": ["ADMIN", "APPROVER"],
  "finance:post": ["ADMIN", "APPROVER"],

  // Partners
  "partners:read": ["ADMIN", "FINANCE", "PARTNER", "APPROVER", "VIEWER"],
  "partners:write": ["ADMIN", "FINANCE", "PARTNER"],
  "partners:approve": ["ADMIN", "APPROVER"],

  // Sales & Orders
  "sales:read": ["ADMIN", "FINANCE", "OPERATIONS", "MARKETING", "VIEWER", "PARTNER"],
  "sales:write": ["ADMIN", "OPERATIONS", "FINANCE"],

  // Inventory & Products
  "inventory:read": ["ADMIN", "OPERATIONS", "FINANCE", "VIEWER", "PARTNER"],
  "inventory:write": ["ADMIN", "OPERATIONS"],
  "inventory:adjust": ["ADMIN", "OPERATIONS", "APPROVER"],

  // Marketing & Campaigns
  "marketing:read": ["ADMIN", "MARKETING", "FINANCE", "VIEWER", "PARTNER"],
  "marketing:write": ["ADMIN", "MARKETING"],

  // Assets & Equipment
  "assets:read": ["ADMIN", "OPERATIONS", "FINANCE", "VIEWER", "PARTNER"],
  "assets:write": ["ADMIN", "OPERATIONS", "FINANCE"],

  // Customers
  "customers:read": ["ADMIN", "OPERATIONS", "FINANCE", "MARKETING", "PARTNER"],
  "customers:export": ["ADMIN"],

  // Forecasts
  "forecasts:read": ["ADMIN", "FINANCE", "PARTNER", "VIEWER"],
  "forecasts:write": ["ADMIN", "FINANCE"],

  // Imports
  "imports:read": ["ADMIN", "FINANCE", "OPERATIONS", "MARKETING"],
  "imports:write": ["ADMIN", "FINANCE", "OPERATIONS", "MARKETING"],
  "imports:approve": ["ADMIN", "APPROVER"],

  // Settings & Audit
  "settings:read": ["ADMIN", "FINANCE", "PARTNER"],
  "settings:write": ["ADMIN"],
  "audit:read": ["ADMIN"],
};

/**
 * Check if a role has the specified permission
 */
export function hasPermission(role: Role, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Server-side check for user permissions within a company
 */
export async function verifyUserPermission(
  userId: string,
  companyId: string,
  permission: string
): Promise<{ allowed: boolean; role?: Role; error?: string }> {
  const membership = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!membership || !membership.isActive) {
    return { allowed: false, error: "Not an active member of this organization." };
  }

  const allowed = hasPermission(membership.role, permission);
  if (!allowed) {
    return {
      allowed: false,
      role: membership.role,
      error: `Permission '${permission}' denied for role ${membership.role}.`,
    };
  }

  return { allowed: true, role: membership.role };
}
