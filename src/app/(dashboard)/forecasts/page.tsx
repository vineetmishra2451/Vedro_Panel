"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Plus,
  Compass,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  IndianRupee,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";

export default function ForecastsPage() {
  const [activeScenario, setActiveScenario] = useState("BASE");

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              12-Month Projections
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              Forecasts Never Overwrite Actuals
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Financial Forecasts & Cash Runway
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Model volume scaling, COGS ratios, ad spend growth, GST timing, and monthly partner capital runway.
          </p>
        </div>

        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Custom Scenario</span>
        </button>
      </div>

      {/* 2. Scenario Selector */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-3 shadow-xs flex items-center gap-3">
        <span className="text-[11px] font-bold text-[#77736A] uppercase tracking-wider ml-1">
          Scenario:
        </span>
        <div className="flex items-center gap-2">
          {[
            { id: "CONSERVATIVE", label: "Conservative (5% MoM)" },
            { id: "BASE", label: "Base Case (15% MoM)" },
            { id: "AGGRESSIVE", label: "Aggressive (30% MoM)" },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveScenario(sc.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeScenario === sc.id
                  ? "bg-[#493020] text-white font-semibold"
                  : "bg-[#FCFAF3] text-[#77736A] hover:bg-[#E8E2D5] hover:text-[#29271F]"
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Forecast KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          title="12M Projected Revenue"
          value={0}
          format="currency"
          status="forecast"
          subtext="Net of returns & discounts"
          icon={<IndianRupee className="w-4 h-4" />}
        />
        <KpiCard
          title="Projected Net Cash Burn"
          value={0}
          format="currency"
          status="forecast"
          subtext="Operating costs + working capital"
        />
        <KpiCard
          title="Break-even Sales Level"
          value={null}
          textValue="₹0 / month"
          status="forecast"
          subtext="Fixed costs ÷ margin ratio"
        />
        <KpiCard
          title="Projected Cash Runway"
          value={null}
          textValue="Neutral (₹0 Burn)"
          status="forecast"
          subtext="Available cash ÷ monthly burn"
        />
      </div>

      {/* 5. Forecast Details */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-[#29271F] font-bold text-sm mb-1.5">
          <Compass className="w-4 h-4 text-[#493020]" />
          <span>Working Capital Timing Assumptions</span>
        </div>
        <p className="text-xs text-[#77736A] max-w-2xl leading-relaxed">
          Vedro cash flow forecasting accounts for collection lag: D2C payment gateway settlement (T+2 days), marketplace disbursements (T+7 to T+14 days), offline wholesale terms (30 days), and quarterly GST liability settlement.
        </p>
      </div>
    </div>
  );
}
