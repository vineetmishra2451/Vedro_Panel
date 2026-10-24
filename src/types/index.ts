import { Role, TransactionStatus, OrderStatus, ReturnStatus, MovementType, PartnerTxnType, AssetStatus } from "@prisma/client";

export type MetricStatus = "actual" | "forecast" | "estimated" | "incomplete";

export interface KpiCardData {
  title: string;
  value: number | null;
  format: "currency" | "percentage" | "number" | "units" | "ratio";
  status: MetricStatus;
  trend?: {
    value: number;
    period: string;
    isPositive?: boolean;
  };
  drillDownHref?: string;
  subtext?: string;
}

export interface PartnerSummary {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  totalContributedPaise: number;
  totalWithdrawnPaise: number;
  netCapitalBalancePaise: number;
  entryCount: number;
  lastContributionDate?: Date | null;
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  channelId?: string;
  productId?: string;
  status?: string;
  search?: string;
}
