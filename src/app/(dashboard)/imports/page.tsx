"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  History,
  FileCheck2,
} from "lucide-react";

export default function ImportsPage() {
  const [selectedEntity, setSelectedEntity] = useState("ORDERS");

  const importEntities = [
    { id: "ORDERS", label: "Orders & Sales Invoices" },
    { id: "PRODUCTS", label: "Product Catalog & SKUs" },
    { id: "AD_PERFORMANCE", label: "Ad Performance Reports" },
    { id: "BANK", label: "Bank Statement Feeds" },
    { id: "INVENTORY", label: "Inventory Stock Counts" },
    { id: "ASSETS", label: "Equipment Purchase Invoices" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Isolated Data Staging
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              5-Step Validation & Approval Gate
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Imports & Reconciliation
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Stage historical or external CSV files through a rigorous mapping, duplicate detection, and review workflow.
          </p>
        </div>
      </div>

      {/* 2. 5-Step Pipeline Stepper */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-medium text-[#77736A] overflow-x-auto gap-4">
          <div className="flex items-center gap-2 shrink-0 text-[#493020] font-bold">
            <span className="w-5 h-5 rounded-md bg-[#493020] text-white flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Upload File</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#E8E2D5] shrink-0" />
          <div className="flex items-center gap-2 shrink-0 text-[#77736A]">
            <span className="w-5 h-5 rounded-md bg-[#FCFAF3] text-[#77736A] border border-[#E8E2D5] flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Map Fields</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#E8E2D5] shrink-0" />
          <div className="flex items-center gap-2 shrink-0 text-[#77736A]">
            <span className="w-5 h-5 rounded-md bg-[#FCFAF3] text-[#77736A] border border-[#E8E2D5] flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Preview & Validate</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#E8E2D5] shrink-0" />
          <div className="flex items-center gap-2 shrink-0 text-[#77736A]">
            <span className="w-5 h-5 rounded-md bg-[#FCFAF3] text-[#77736A] border border-[#E8E2D5] flex items-center justify-center text-[10px]">
              4
            </span>
            <span>Duplicate Check</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#E8E2D5] shrink-0" />
          <div className="flex items-center gap-2 shrink-0 text-[#77736A]">
            <span className="w-5 h-5 rounded-md bg-[#FCFAF3] text-[#77736A] border border-[#E8E2D5] flex items-center justify-center text-[10px]">
              5
            </span>
            <span>Approve & Post</span>
          </div>
        </div>
      </div>

      {/* 3. Upload Zone */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-6 shadow-xs">
        <h3 className="font-bold text-[#29271F] text-sm mb-3">
          Step 1: Select Entity Type & Select File
        </h3>

        {/* Entity Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
          {importEntities.map((ent) => (
            <button
              key={ent.id}
              onClick={() => setSelectedEntity(ent.id)}
              className={`p-2.5 text-left rounded-lg border text-xs font-medium transition-colors ${
                selectedEntity === ent.id
                  ? "border-[#493020] bg-[#F2EBD8]/40 text-[#493020] font-bold"
                  : "border-[#E8E2D5] bg-[#FCFAF3] text-[#77736A] hover:text-[#29271F]"
              }`}
            >
              {ent.label}
            </button>
          ))}
        </div>

        {/* Dropzone */}
        <div className="border border-dashed border-[#77736A]/40 hover:border-[#493020] rounded-xl p-8 text-center bg-[#FCFAF3]/40 transition-colors cursor-pointer">
          <UploadCloud className="w-10 h-10 mx-auto text-[#77736A] mb-2" />
          <p className="font-bold text-[#29271F] text-xs">
            Drop CSV or Excel file here to stage
          </p>
          <p className="text-[11px] text-[#77736A] mt-0.5">
            Preserves row numbers, raw payloads, and generates row-level validation reports
          </p>
          <button className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs">
            Browse File
          </button>
        </div>
      </div>

      {/* 4. Import History */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#E8E2D5] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-[#77736A]" />
            <h4 className="font-bold text-[#29271F]">Historical Staging Audit Trail</h4>
          </div>
          <span className="text-[#77736A] text-[11px]">0 jobs logged</span>
        </div>
        <div className="p-8 text-center text-[#77736A] text-xs">
          No import jobs staged. Staged rows preserve file hash, raw row JSON, and normalized posting references.
        </div>
      </div>
    </div>
  );
}
