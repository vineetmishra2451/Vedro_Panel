"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  AlertCircle,
  FileCheck2,
  Layers,
  FileText,
} from "lucide-react";

export default function ReportsGstPage() {
  const [activeReport, setActiveReport] = useState<"gstr1" | "gstr2" | "pnl" | "inventory">("gstr1");

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Statutory & Tax Summaries
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              Invoice-Traceable CGST, SGST & IGST
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Reports & GST Compliance
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Exportable tax summaries (GSTR-1, GSTR-2 ITC), P&L statement, and stock valuation reports.
          </p>
        </div>

        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#29271F] bg-white border border-[#E8E2D5] hover:bg-[#FCFAF3] rounded-lg transition-colors shadow-xs">
          <Download className="w-3.5 h-3.5 text-[#77736A]" />
          <span>Export CSV / XLSX</span>
        </button>
      </div>

      {/* 2. Report Selection Tabs */}
      <div className="flex border-b border-[#E8E2D5] gap-6 text-xs">
        <button
          onClick={() => setActiveReport("gstr1")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeReport === "gstr1"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Outward Sales (GSTR-1 Format)
        </button>
        <button
          onClick={() => setActiveReport("gstr2")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeReport === "gstr2"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Inward Purchases & ITC (GSTR-2 Format)
        </button>
        <button
          onClick={() => setActiveReport("pnl")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeReport === "pnl"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Profit & Loss Statement (P&L)
        </button>
        <button
          onClick={() => setActiveReport("inventory")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeReport === "inventory"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Inventory Valuation & Aging
        </button>
      </div>

      {/* 4. Report View Container */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
          <div>
            <h3 className="font-bold text-[#29271F] text-sm">
              {activeReport === "gstr1" && "GSTR-1 Outward Supply Breakdown"}
              {activeReport === "gstr2" && "GSTR-2 Input Tax Credit (ITC) Summary"}
              {activeReport === "pnl" && "Profit & Loss Statement — FY 2026–27"}
              {activeReport === "inventory" && "Stock Valuation by Product SKU"}
            </h3>
            <p className="text-[11px] text-[#77736A] mt-0.5">
              Vedro Food Products • GSTIN: 27AAAAA0000A1Z5 • Maharashtra State
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#FCFAF3] text-[#77736A] border border-[#E8E2D5] rounded">
            0 Records
          </span>
        </div>

        <div className="py-12 text-center text-[#77736A]">
          <FileSpreadsheet className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
          <p className="font-bold text-[#29271F] text-xs">No Records for Current Tax Period</p>
          <p className="text-[11px] text-[#77736A] mt-0.5 max-w-sm mx-auto leading-relaxed">
            As transactions, invoices, and supplier bills are entered, tax components with CGST, SGST, IGST, and HSN codes will be compiled automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
