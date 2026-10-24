import React from "react";
import { MetricStatus } from "@/types";

interface StatusBadgeProps {
  status: MetricStatus | string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  className = "",
  showDot = true,
}: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let styles = "bg-[#F2EBD8] text-[#77736A] border-[#E8E2D5]";
  let dotColor = "bg-[#77736A]";

  if (
    normalized === "actual" ||
    normalized === "posted" ||
    normalized === "completed" ||
    normalized === "active" ||
    normalized === "paid"
  ) {
    styles = "bg-[#EAF4EE] text-[#28764A] border-[#BCDDCB] font-bold";
    dotColor = "bg-[#28764A]";
  } else if (
    normalized === "forecast" ||
    normalized === "approved" ||
    normalized === "projected"
  ) {
    styles = "bg-[#FDF8E2] text-[#493020] border-[#E4BF22]/50 font-bold";
    dotColor = "bg-[#E4BF22]";
  } else if (
    normalized === "estimated" ||
    normalized === "pending" ||
    normalized === "submitted" ||
    normalized === "low stock" ||
    normalized === "unpaid"
  ) {
    styles = "bg-[#FCF4E8] text-[#A96B13] border-[#F3DBB6] font-bold";
    dotColor = "bg-[#A96B13]";
  } else if (
    normalized === "incomplete" ||
    normalized === "draft" ||
    normalized === "rejected" ||
    normalized === "cancelled" ||
    normalized === "out of stock" ||
    normalized === "overdue"
  ) {
    styles = "bg-[#FBECEB] text-[#B83C32] border-[#F4C4C0] font-bold";
    dotColor = "bg-[#B83C32]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wider ${styles} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}></span>}
      <span>{status}</span>
    </span>
  );
}
