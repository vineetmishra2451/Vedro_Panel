"use client";

import React from "react";
import {
  Megaphone,
  Plus,
  TrendingUp,
  AlertCircle,
  Upload,
  Info,
  IndianRupee,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Paid Acquisition & Attribution
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              ROAS ≠ Net Profit
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Marketing Performance
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Compare Meta & Google Ads spend against attributed revenue while keeping verified order revenue distinct.
          </p>
        </div>

        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs">
          <Upload className="w-3.5 h-3.5" />
          <span>Import Campaign Report (CSV)</span>
        </button>
      </div>

      {/* 2. Critical Safeguard Notice */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#29271F] shadow-xs">
        <Info className="w-4 h-4 text-[#493020] mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong>Attribution Safeguard:</strong> Platform-reported ad revenue and verified Vedro order revenue are kept strictly separated. ROAS = (Attributed Revenue ÷ Ad Spend). A high ROAS does not guarantee profitability once COGS, packaging, GST, and shipping are deducted.
        </div>
      </div>

      {/* 3. KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          title="Total Ad Spend"
          value={0}
          format="currency"
          status="actual"
          subtext="Meta Ads + Google Ads"
          icon={<IndianRupee className="w-4 h-4" />}
        />
        <KpiCard
          title="Platform Attributed Rev"
          value={0}
          format="currency"
          status="actual"
          subtext="7-day click attribution window"
        />
        <KpiCard
          title="Blended ROAS"
          value={0}
          format="ratio"
          status="actual"
          subtext="Target baseline: 3.5x+"
        />
        <KpiCard
          title="Customer Acq Cost (CAC)"
          value={null}
          textValue="₹0 (0 new customers)"
          status="actual"
          subtext="Ad spend ÷ verified new customers"
        />
      </div>

      {/* 4. Empty State */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-12 text-center text-[#77736A] shadow-xs">
        <Megaphone className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
        <h4 className="font-bold text-[#29271F] text-sm">No Campaigns Imported</h4>
        <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
          Upload daily campaign performance CSV files. Rows matching external campaign ID and date are automatically deduplicated.
        </p>
      </div>
    </div>
  );
}
