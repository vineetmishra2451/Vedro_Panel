"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  X,
  CheckCircle2,
  Building,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatINR, formatDate, rupeesToPaise } from "@/lib/format";

interface AssetRecord {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  acquisitionCostPaise: number;
  installationCostPaise: number;
  totalCostPaise: number;
  supplierName?: string;
  invoiceNumber?: string;
  serialNumber?: string;
  location?: string;
  usefulLifeMonths: number;
  accumulatedDepreciationPaise: number;
  status: "ACTIVE" | "UNDER_MAINTENANCE" | "DISPOSED";
}

export default function EquipmentAssetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDrawerAsset, setSelectedDrawerAsset] = useState<AssetRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [assets, setAssets] = useState<AssetRecord[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "Packaging Machinery",
    purchaseDate: "",
    costRupees: "",
    installationRupees: "0",
    supplierName: "",
    invoiceNumber: "",
    serialNumber: "",
    location: "Main Production Floor",
    usefulLifeMonths: "60",
    notes: "",
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      purchaseDate: new Date().toISOString().split("T")[0],
    }));
  }, []);

  const totalGrossCostPaise = assets.reduce((acc, a) => acc + a.totalCostPaise, 0);
  const totalDepreciationPaise = assets.reduce((acc, a) => acc + a.accumulatedDepreciationPaise, 0);
  const netBookValuePaise = totalGrossCostPaise - totalDepreciationPaise;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cost = parseFloat(formData.costRupees);
    const install = parseFloat(formData.installationRupees) || 0;
    const lifeMonths = parseInt(formData.usefulLifeMonths) || 60;

    if (!formData.name.trim()) {
      setFormError("Please enter the equipment/asset name.");
      return;
    }

    if (isNaN(cost) || cost <= 0) {
      setFormError("Please enter a valid purchase cost greater than ₹0.");
      return;
    }

    const costPaise = rupeesToPaise(cost);
    const installPaise = rupeesToPaise(install);
    const totalPaise = costPaise + installPaise;

    const newAsset: AssetRecord = {
      id: `asset-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category,
      purchaseDate: formData.purchaseDate,
      acquisitionCostPaise: costPaise,
      installationCostPaise: installPaise,
      totalCostPaise: totalPaise,
      supplierName: formData.supplierName.trim() || undefined,
      invoiceNumber: formData.invoiceNumber.trim() || undefined,
      serialNumber: formData.serialNumber.trim() || undefined,
      location: formData.location.trim() || undefined,
      usefulLifeMonths: lifeMonths,
      accumulatedDepreciationPaise: 0,
      status: "ACTIVE",
    };

    setAssets([newAsset, ...assets]);
    setIsModalOpen(false);
    setSuccessMessage(`Asset "${formData.name.trim()}" registered successfully!`);

    setFormData({
      name: "",
      category: "Packaging Machinery",
      purchaseDate: new Date().toISOString().split("T")[0],
      costRupees: "",
      installationRupees: "0",
      supplierName: "",
      invoiceNumber: "",
      serialNumber: "",
      location: "Main Production Floor",
      usefulLifeMonths: "60",
      notes: "",
    });

    setTimeout(() => setSuccessMessage(""), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Fixed Asset Register
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              Capital Assets Separated from OpEx
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Equipment & Machinery
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Log processing machines, packaging equipment, warranty dates, maintenance logs, and depreciation schedules.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Register New Asset</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-[#F2EBD8]/60 border border-[#493020]/30 text-[#493020] text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#493020] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Safeguard Notice */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#29271F] shadow-xs">
        <AlertCircle className="w-4 h-4 text-[#493020] mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong>Asset Accounting Policy:</strong> Equipment purchases are capitalized on the balance sheet and depreciated over their useful economic life. Acquisition costs, payment status, and accumulated depreciation are tracked separately. Book value is never counted as cash.
        </div>
      </div>

      {/* 3. KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiCard
          title="Gross Equipment Value"
          value={totalGrossCostPaise}
          format="currency"
          status="actual"
          subtext="Purchase cost + installation charges"
        />
        <KpiCard
          title="Accumulated Depreciation"
          value={totalDepreciationPaise}
          format="currency"
          status="actual"
          subtext="Straight-line method approved"
        />
        <KpiCard
          title="Net Book Value (NBV)"
          value={netBookValuePaise}
          format="currency"
          status="actual"
          subtext="Current balance sheet valuation"
        />
      </div>

      {/* 4. Assets Table */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#E8E2D5] flex items-center justify-between text-xs font-bold text-[#77736A]">
          <span>Registered Assets & Machinery ({assets.length})</span>
          <span>Depreciation Policy: Straight Line</span>
        </div>

        {assets.length === 0 ? (
          <div className="p-12 text-center text-[#77736A]">
            <Wrench className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
            <h4 className="font-bold text-[#29271F] text-sm">No Fixed Assets Registered</h4>
            <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
              Click "+ Register New Asset" to add processing machines, packaging sealers, or equipment with invoice and warranty details.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
            >
              + Register New Asset
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFAF3] border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Asset Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Purchase Date</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3 text-right">Gross Cost (₹)</th>
                  <th className="px-5 py-3 text-right">Net Book Value (₹)</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#FCFAF3]/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold">{asset.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FCFAF3] text-[#29271F] border border-[#E8E2D5]">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#77736A] whitespace-nowrap">
                      {formatDate(asset.purchaseDate)}
                    </td>
                    <td className="px-5 py-3.5 text-[#77736A]">{asset.location || "—"}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums">
                      <MoneyDisplay paise={asset.totalCostPaise} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-[#493020] tabular-nums">
                      <MoneyDisplay paise={asset.totalCostPaise - asset.accumulatedDepreciationPaise} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#F2EBD8]/60 text-[#493020] border border-[#493020]/20">
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedDrawerAsset(asset)}
                        className="text-[11px] font-semibold text-[#493020] hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#29271F] leading-tight">
                  Register Capital Asset
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  Log equipment cost, supplier, and depreciation term
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#77736A] hover:text-[#29271F] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Asset Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Equipment / Asset Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Continuous Band Sealer (Nitrogen Flush)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                />
              </div>

              {/* Category & Purchase Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Asset Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="Packaging Machinery">Packaging Machinery</option>
                    <option value="Food Processing Equipment">Food Processing Equipment</option>
                    <option value="Storage & Warehousing">Storage & Warehousing</option>
                    <option value="Testing & Laboratory">Testing & Laboratory</option>
                    <option value="Office & IT Infrastructure">Office & IT Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* Costs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="85000"
                    value={formData.costRupees}
                    onChange={(e) => setFormData({ ...formData, costRupees: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Installation / Freight (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5000"
                    value={formData.installationRupees}
                    onChange={(e) => setFormData({ ...formData, installationRupees: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* Supplier & Invoice */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Supplier / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PackTech Machines Pvt Ltd"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Invoice # / Serial #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-904"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* Useful Life & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Depreciation Life (Months)
                  </label>
                  <input
                    type="number"
                    min="12"
                    value={formData.usefulLifeMonths}
                    onChange={(e) => setFormData({ ...formData, usefulLifeMonths: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Installation Location
                  </label>
                  <input
                    type="text"
                    placeholder="Main Floor"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#77736A] hover:text-[#29271F] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Detail Drawer */}
      {selectedDrawerAsset && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#493020]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-[#E8E2D5] p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                <div>
                  <span className="text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                    Asset Record
                  </span>
                  <h3 className="text-base font-bold text-[#29271F]">
                    {selectedDrawerAsset.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDrawerAsset(null)}
                  className="p-1 rounded-md text-[#77736A] hover:text-[#29271F]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#77736A] block uppercase font-bold tracking-wider mb-1">
                    Total Capitalized Cost
                  </span>
                  <div className="text-xl font-bold font-mono text-[#29271F] tabular-nums">
                    {formatINR(selectedDrawerAsset.totalCostPaise)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Category
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {selectedDrawerAsset.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Purchase Date
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {formatDate(selectedDrawerAsset.purchaseDate)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Useful Life
                    </span>
                    <span className="text-[#29271F] font-semibold">
                      {selectedDrawerAsset.usefulLifeMonths} Months ({(selectedDrawerAsset.usefulLifeMonths / 12).toFixed(1)} Yrs)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Location
                    </span>
                    <span className="text-[#29271F]">
                      {selectedDrawerAsset.location || "Main Facility"}
                    </span>
                  </div>
                </div>

                {selectedDrawerAsset.supplierName && (
                  <div className="pt-3 border-t border-[#E8E2D5]">
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Supplier & Invoice
                    </span>
                    <div className="text-[#29271F] font-medium mt-0.5">
                      {selectedDrawerAsset.supplierName} • {selectedDrawerAsset.invoiceNumber ? `Invoice: ${selectedDrawerAsset.invoiceNumber}` : ""}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5]">
              <button
                onClick={() => setSelectedDrawerAsset(null)}
                className="w-full py-2 text-xs font-semibold text-[#29271F] bg-[#FCFAF3] hover:bg-[#E8E2D5] rounded-lg transition-colors border border-[#E8E2D5]"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
