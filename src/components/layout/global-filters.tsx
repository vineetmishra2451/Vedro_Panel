"use client";

import React, { useState } from "react";
import { Filter, Search, RotateCcw, Download, X } from "lucide-react";

export interface FilterState {
  dateRange: string;
  channel: string;
  statusMode: string;
  search: string;
}

interface GlobalFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
  showExport?: boolean;
  onExport?: () => void;
  filteredCount?: number;
  totalCount?: number;
}

export function GlobalFilters({
  onFilterChange,
  showExport = true,
  onExport,
  filteredCount,
  totalCount,
}: GlobalFiltersProps) {
  const [dateRange, setDateRange] = useState("ALL");
  const [channel, setChannel] = useState("ALL");
  const [statusMode, setStatusMode] = useState("ALL");
  const [search, setSearch] = useState("");

  const triggerChange = (updated: Partial<FilterState>) => {
    const next: FilterState = {
      dateRange,
      channel,
      statusMode,
      search,
      ...updated,
    };
    if (onFilterChange) {
      onFilterChange(next);
    }
  };

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange({ dateRange, channel, statusMode, search });
    }
  };

  const handleReset = () => {
    setDateRange("ALL");
    setChannel("ALL");
    setStatusMode("ALL");
    setSearch("");
    if (onFilterChange) {
      onFilterChange({
        dateRange: "ALL",
        channel: "ALL",
        statusMode: "ALL",
        search: "",
      });
    }
  };

  const isFiltered =
    dateRange !== "ALL" ||
    channel !== "ALL" ||
    statusMode !== "ALL" ||
    search.trim().length > 0;

  return (
    <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 sm:p-5 shadow-xs mb-5 space-y-3.5">
      {/* Top Row: Dropdown Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Filter Label & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#493020] uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-[#E4BF22]" />
            <span>Filters:</span>
          </div>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => {
              const val = e.target.value;
              setDateRange(val);
              triggerChange({ dateRange: val });
            }}
            className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl px-3 py-2 text-[#29271F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors cursor-pointer"
          >
            <option value="ALL">All Time</option>
            <option value="FY26-27">FY 2026–27</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_30">Last 30 Days</option>
            <option value="Q1">Q1 (Apr–Jun 2026)</option>
            <option value="Q2">Q2 (Jul–Sep 2026)</option>
            <option value="Q3">Q3 (Oct–Dec 2026)</option>
            <option value="Q4">Q4 (Jan–Mar 2027)</option>
          </select>

          {/* Channel Selector */}
          <select
            value={channel}
            onChange={(e) => {
              const val = e.target.value;
              setChannel(val);
              triggerChange({ channel: val });
            }}
            className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl px-3 py-2 text-[#29271F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors cursor-pointer"
          >
            <option value="ALL">All Channels</option>
            <option value="OFFLINE">Store / Offline</option>
            <option value="WEBSITE">Website (D2C)</option>
            <option value="AMAZON">Amazon Marketplace</option>
            <option value="FLIPKART">Flipkart</option>
            <option value="B2B">B2B Wholesale</option>
            <option value="EVENTS">Events & Pop-ups</option>
          </select>

          {/* Status Selector */}
          <select
            value={statusMode}
            onChange={(e) => {
              const val = e.target.value;
              setStatusMode(val);
              triggerChange({ statusMode: val });
            }}
            className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl px-3 py-2 text-[#29271F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid / Fulfilled</option>
            <option value="PENDING">Pending Payment</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#77736A] hover:text-[#493020] hover:bg-[#F2EBD8] border border-[#E8E2D5] rounded-xl transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span>Apply Filters</span>
          </button>

          {showExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] border border-[#E8E2D5] rounded-xl transition-colors cursor-pointer"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#493020]" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Full-Width Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-[#77736A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter orders by customer name, phone, SKU, order number, channel, or notes..."
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            triggerChange({ search: val });
          }}
          className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl pl-10 pr-9 py-2.5 text-[#29271F] placeholder:text-[#77736A]/70 focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              triggerChange({ search: "" });
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736A] hover:text-[#493020] p-1"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active Filter Counter / Reset Bar */}
      {isFiltered && typeof filteredCount === "number" && typeof totalCount === "number" && (
        <div className="flex items-center justify-between text-[11px] text-[#77736A] pt-1 border-t border-[#E8E2D5]/60">
          <span>
            Showing <strong className="text-[#493020]">{filteredCount}</strong> of{" "}
            <strong>{totalCount}</strong> recorded orders
          </span>
          <button
            onClick={handleReset}
            className="text-[#A96B13] hover:underline font-semibold"
          >
            Clear active filters
          </button>
        </div>
      )}
    </div>
  );
}
