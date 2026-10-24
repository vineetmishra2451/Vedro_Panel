import React from "react";
import { formatINR, formatCompactINR } from "@/lib/format";

interface MoneyDisplayProps {
  paise: number | null | undefined;
  compact?: boolean;
  className?: string;
  colored?: boolean;
}

export function MoneyDisplay({
  paise,
  compact = false,
  className = "",
  colored = false,
}: MoneyDisplayProps) {
  const isNegative = (paise ?? 0) < 0;
  const isZero = (paise ?? 0) === 0;

  let colorClass = "text-[#252B27]";
  if (colored) {
    if (isNegative) colorClass = "text-rose-700 font-semibold";
    else if (!isZero) colorClass = "text-[#244333] font-semibold";
    else colorClass = "text-[#68736C]";
  }

  const text = compact ? formatCompactINR(paise) : formatINR(paise);

  return (
    <span className={`tabular-nums font-mono ${colorClass} ${className}`}>
      {text}
    </span>
  );
}
