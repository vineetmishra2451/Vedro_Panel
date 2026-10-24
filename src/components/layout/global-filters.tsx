"use client";

import React, { useState } from "react";
import { Filter, Search, RotateCcw, Download } from "lucide-react";

interface GlobalFiltersProps {
  onFilterChange?: (filters: any) => void;
  showExport?: boolean;
  onExport?: () => void;
}

export function GlobalFilters({
  onFilterChange,
  showExport = true,
  onExport,
}: GlobalFiltersProps) {
  const [dateRange, setDateRange] = useState("FY26-27");
  const [channel, setChannel] = useState("ALL");
  const [statusMode, setStatusMode] = useState("ACTUAL");
  const [search, setSearch] = useState("");

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange({ dateRange, channel, statusMode, search });
    }
  };

  return (
    <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 shadow-xs mb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#77736A] uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-[#493020]" />
            <span>Filters:</span>
          </div>

          {/* Date Range / FY */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl px-3 py-1.5 text-[#29271F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors"
            >
              <option value="FY26-27">FY 2026–27</option>
              <option value="Q1">Q1 (Apr–Jun 2026)</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_30">Last 30 Days</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>
          </div>

          {/* Channel */}
          <div>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl px-3 py-1.5 text-[#29271F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors"
            >
              <option value="ALL">All Channels</option>
              <option value="OFFLINE">Store / Offline</option>
              <option value="WEBSITE">Website (D2C)</option>
              <option value="AMAZON">Amazon</option>
              <option value="FLIPKART">Flipkart</option>
              <option value="B2B">B2B Wholesale</option>
            </select>
          </div>

          {/* Actual vs Forecast Data View */}
          <div>
            <select
              value={statusMode}
              onChange={(e) => setStatusMode(e.target.value)}
              className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl px-3 py-1.5 text-[#29271F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors"
            >
              <option value="ACTUAL">Actuals</option>
              <option value="ESTIMATES">Estimates</option>
              <option value="FORECAST">Forecast</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#77736A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by SKU, supplier, invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl pl-8 pr-3 py-1.5 text-[#29271F] placeholder:text-[#77736A]/70 focus:outline-none focus:ring-1 focus:ring-[#E4BF22] w-48 sm:w-56 transition-colors"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] border border-[#E8E2D5] rounded-xl transition-colors shadow-xs"
          >
            <span>Apply Filters</span>
          </button>

          {showExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#77736A] hover:text-[#493020] hover:bg-[#F2EBD8] border border-[#E8E2D5] rounded-xl transition-colors"
              title="Export Current View"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
