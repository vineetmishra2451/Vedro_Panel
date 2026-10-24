import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { formatINR, formatPercentage, formatIndianNumber } from "@/lib/format";
import { MetricStatus } from "@/types";

interface KpiCardProps {
  title: string;
  value: number | null | undefined;
  format?: "currency" | "percentage" | "number" | "ratio" | "text";
  textValue?: string;
  status?: MetricStatus;
  trend?: {
    value: number;
    period: string;
    isPositive?: boolean;
  };
  drillDownHref?: string;
  subtext?: string;
  icon?: React.ReactNode;
}

export function KpiCard({
  title,
  value,
  format = "currency",
  textValue,
  status = "actual",
  trend,
  drillDownHref,
  subtext,
  icon,
}: KpiCardProps) {
  let displayValue: string;

  if (textValue) {
    displayValue = textValue;
  } else if (value === null || value === undefined) {
    displayValue = "—";
  } else if (format === "currency") {
    displayValue = formatINR(value, false);
  } else if (format === "percentage") {
    displayValue = formatPercentage(value);
  } else if (format === "number") {
    displayValue = formatIndianNumber(value);
  } else if (format === "ratio") {
    displayValue = `${value.toFixed(2)}x`;
  } else {
    displayValue = String(value);
  }

  const content = (
    <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 shadow-xs hover:border-[#E4BF22] hover:shadow-sm transition-all duration-150 flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-[#77736A] uppercase tracking-wider truncate" title={title}>
            {title}
          </span>
          {icon && (
            <div className="text-[#77736A] group-hover:text-[#493020] transition-colors shrink-0">
              {icon}
            </div>
          )}
        </div>

        <div className="text-2xl font-bold tracking-tight text-[#493020] tabular-nums font-mono mt-1">
          {displayValue}
        </div>
      </div>

      {(trend || drillDownHref) && (
        <div className="mt-3.5 pt-2 border-t border-[#E8E2D5]/70 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1 font-semibold text-[11px]">
              {trend.isPositive !== false ? (
                <span className="text-[#28764A] flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  {trend.value}%
                </span>
              ) : (
                <span className="text-[#B83C32] flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  {trend.value}%
                </span>
              )}
              <span className="text-[#77736A] font-normal">vs {trend.period}</span>
            </div>
          ) : (
            <span />
          )}

          {drillDownHref && (
            <span className="text-[#493020] font-semibold text-[11px] inline-flex items-center gap-0.5 group-hover:text-[#A96B13] group-hover:underline transition-colors ml-auto">
              View <ExternalLink className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (drillDownHref) {
    return <Link href={drillDownHref}>{content}</Link>;
  }

  return content;
}
