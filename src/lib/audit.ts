import { prisma } from "@/lib/prisma";

export interface LogAuditParams {
  companyId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  ipAddress?: string;
}

/**
 * Record an immutable audit log entry in the database.
 */
export async function logAudit(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        before: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
        after: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Don't crash main transaction on audit log failure in non-strict scenarios,
    // but in production it's logged to console/monitoring.
  }
}
