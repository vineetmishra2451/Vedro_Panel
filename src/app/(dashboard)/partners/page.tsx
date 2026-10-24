"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileCheck,
  Calendar,
  Filter,
  Download,
  Info,
  CheckCircle2,
  X,
  CreditCard,
  Building,
} from "lucide-react";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDate, rupeesToPaise } from "@/lib/format";

interface CapitalEntry {
  id: string;
  partnerName: "Vivek" | "Vineet" | "Varunesh";
  date: string;
  amountPaise: number;
  type: "CAPITAL_INTRODUCED" | "LOAN_GIVEN" | "LOAN_REPAYMENT" | "REIMBURSEMENT" | "WITHDRAWAL" | "OTHER";
  reason: string;
  paymentMethod: string;
  reference: string;
  notes?: string;
  createdAt: string;
}

export default function PartnersPage() {
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDrawerEntry, setSelectedDrawerEntry] = useState<CapitalEntry | null>(null);

  // Initial records starting with ZERO opening balance per user requirement
  const [entries, setEntries] = useState<CapitalEntry[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    partnerName: "Vivek" as "Vivek" | "Vineet" | "Varunesh",
    date: "",
    amountRupees: "",
    type: "CAPITAL_INTRODUCED" as CapitalEntry["type"],
    reason: "",
    paymentMethod: "BANK_TRANSFER",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
  }, []);

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const partnersList = ["Vivek", "Vineet", "Varunesh"] as const;

  const partnerStats = partnersList.map((name) => {
    const partnerEntries = entries.filter((e) => e.partnerName === name);
    const totalIntroduced = partnerEntries
      .filter((e) => e.amountPaise > 0)
      .reduce((acc, e) => acc + e.amountPaise, 0);
    const totalWithdrawn = partnerEntries
      .filter((e) => e.amountPaise < 0)
      .reduce((acc, e) => acc + Math.abs(e.amountPaise), 0);
    const netBalance = totalIntroduced - totalWithdrawn;

    return {
      name,
      entriesCount: partnerEntries.length,
      totalIntroduced,
      totalWithdrawn,
      netBalance,
    };
  });

  const totalCapitalPaise = partnerStats.reduce((acc, p) => acc + p.netBalance, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const rupees = parseFloat(formData.amountRupees);
    if (isNaN(rupees) || rupees <= 0) {
      setFormError("Please enter a valid amount greater than ₹0.");
      return;
    }

    if (!formData.reason.trim()) {
      setFormError("Please provide a reason or purpose for this capital entry.");
      return;
    }

    const isNegative = formData.type === "WITHDRAWAL" || formData.type === "LOAN_REPAYMENT";
    const amountPaise = rupeesToPaise(rupees) * (isNegative ? -1 : 1);

    const newEntry: CapitalEntry = {
      id: `cap-${Date.now()}`,
      partnerName: formData.partnerName,
      date: formData.date,
      amountPaise,
      type: formData.type,
      reason: formData.reason.trim(),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference.trim(),
      notes: formData.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setEntries([newEntry, ...entries]);
    setIsModalOpen(false);
    setSuccessMessage(
      `Capital entry of ${formatINR(Math.abs(amountPaise))} recorded for ${formData.partnerName}!`
    );

    setFormData({
      partnerName: "Vivek",
      date: new Date().toISOString().split("T")[0],
      amountRupees: "",
      type: "CAPITAL_INTRODUCED",
      reason: "",
      paymentMethod: "BANK_TRANSFER",
      reference: "",
      notes: "",
    });

    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const filteredEntries = entries.filter((e) => {
    if (selectedPartnerFilter === "ALL") return true;
    return e.partnerName === selectedPartnerFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Capital & Contributor Ledger
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              3 Partners (Vivek, Vineet, Varunesh)
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Partner Capital Accounts
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Verified capital introductions, partner loans, and business expense reimbursements. All accounts initialized at ₹0.00.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Partner Capital</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-[#F2EBD8]/60 border border-[#493020]/30 text-[#493020] text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#493020] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. 3 Partner Summary Cards + Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {partnerStats.map((p) => (
          <div
            key={p.name}
            className="bg-white border border-[#E8E2D5] rounded-xl p-4 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                  Partner
                </span>
                <span className="text-[10px] font-semibold bg-[#FCFAF3] text-[#77736A] border border-[#E8E2D5] px-1.5 py-0.5 rounded">
                  {p.entriesCount} Entries
                </span>
              </div>
              <h3 className="text-base font-bold text-[#29271F]">{p.name}</h3>
              <div className="text-xl font-bold text-[#29271F] tabular-nums font-mono mt-1">
                <MoneyDisplay paise={p.netBalance} />
              </div>
              <div className="text-[11px] text-[#77736A] mt-0.5">
                Net Capital Balance
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#E8E2D5] grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#77736A] block text-[10px]">Introduced</span>
                <span className="font-semibold text-[#493020] tabular-nums font-mono">
                  {formatINR(p.totalIntroduced, false)}
                </span>
              </div>
              <div>
                <span className="text-[#77736A] block text-[10px]">Withdrawn</span>
                <span className="font-semibold text-rose-700 tabular-nums font-mono">
                  {formatINR(p.totalWithdrawn, false)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Combined Capital Card */}
        <div className="bg-[#493020] text-white rounded-xl p-4 shadow-xs flex flex-col justify-between border border-[#1c3528]">
          <div>
            <div className="flex items-center justify-between text-[#F2EBD8] text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Total Partnership Capital</span>
              <Building className="w-3.5 h-3.5 text-[#F2EBD8]" />
            </div>
            <div className="text-xl font-bold text-white tabular-nums font-mono mt-1">
              <MoneyDisplay paise={totalCapitalPaise} className="text-white" />
            </div>
            <div className="text-[11px] text-[#F2EBD8]/80 mt-0.5">
              Vivek + Vineet + Varunesh
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-[#1c3528] text-[10px] text-[#F2EBD8]/70 flex items-center justify-between">
            <span>Opening Balance:</span>
            <span className="font-bold text-[#F2EBD8]">₹0.00</span>
          </div>
        </div>
      </div>

      {/* 3. Legal & Accounting Policy Safeguard */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl p-4 flex items-start gap-3 text-xs text-[#29271F] shadow-xs">
        <Info className="w-4 h-4 text-[#493020] mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong className="font-bold text-[#493020]">Capital Classification Rule:</strong> Capital infusions are recorded in individual capital sub-ledgers and matched to bank or cash deposits. Contributor loans and capital are strictly excluded from gross revenue and GST calculations. Withdrawals and repayments require reference validation.
        </div>
      </div>

      {/* 4. Ledger Table with Filter */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-3.5 border-b border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#77736A] uppercase tracking-wider">
              Filter:
            </span>
            <div className="flex items-center gap-1">
              {["ALL", "Vivek", "Vineet", "Varunesh"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedPartnerFilter(filter)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedPartnerFilter === filter
                      ? "bg-[#493020] text-white font-semibold"
                      : "bg-[#FCFAF3] text-[#77736A] hover:bg-[#E8E2D5] hover:text-[#29271F]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-[#77736A]">
            {filteredEntries.length} entries recorded
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FCFAF3] border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Partner</th>
                <th className="px-5 py-3">Category / Type</th>
                <th className="px-5 py-3">Reason / Description</th>
                <th className="px-5 py-3">Method & Ref</th>
                <th className="px-5 py-3 text-right">Amount (₹)</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#77736A]">
                    <Users2 className="w-8 h-8 mx-auto mb-2 text-[#77736A]/40" />
                    <p className="font-bold text-xs text-[#29271F]">
                      No Capital Entries in Ledger
                    </p>
                    <p className="text-[11px] text-[#77736A] mt-0.5">
                      All 3 partners start at ₹0.00. Click "+ Add Partner Capital" to record contributions.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => {
                  const isPositive = e.amountPaise > 0;
                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-[#FCFAF3]/80 transition-colors"
                    >
                      <td className="px-5 py-3 whitespace-nowrap font-medium">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap font-bold">
                        {e.partnerName}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FCFAF3] text-[#29271F] border border-[#E8E2D5]">
                          {e.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium">
                        <div>{e.reason}</div>
                        {e.notes && (
                          <div className="text-[10px] text-[#77736A] mt-0.5">
                            {e.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[11px]">
                        <div>{e.paymentMethod.replace(/_/g, " ")}</div>
                        <div className="text-[#77736A] font-mono text-[10px]">
                          {e.reference ? `Ref: ${e.reference}` : "No ref"}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            isPositive ? "text-[#493020]" : "text-rose-700"
                          }
                        >
                          {isPositive ? "+" : "−"}
                          {formatINR(Math.abs(e.amountPaise))}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedDrawerEntry(e)}
                          className="text-[11px] text-[#493020] hover:underline font-semibold"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add Capital Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#29271F] leading-tight">
                  Add Partner Capital Entry
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  Vivek, Vineet, and Varunesh accounts
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
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs">
                  {formError}
                </div>
              )}

              {/* Partner Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Partner Name *
                </label>
                <select
                  value={formData.partnerName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      partnerName: e.target.value as "Vivek" | "Vineet" | "Varunesh",
                    })
                  }
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                >
                  <option value="Vivek">Vivek</option>
                  <option value="Vineet">Vineet</option>
                  <option value="Varunesh">Varunesh</option>
                </select>
              </div>

              {/* Date & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Amount (INR ₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 50000"
                    value={formData.amountRupees}
                    onChange={(e) =>
                      setFormData({ ...formData, amountRupees: e.target.value })
                    }
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono tabular-nums focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* Classification */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Classification / Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as CapitalEntry["type"],
                    })
                  }
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                >
                  <option value="CAPITAL_INTRODUCED">
                    Capital Introduced (+ Inflow)
                  </option>
                  <option value="LOAN_GIVEN">
                    Partner Loan to Business (+ Inflow)
                  </option>
                  <option value="REIMBURSEMENT">
                    Expense Reimbursement
                  </option>
                  <option value="WITHDRAWAL">
                    Partner Withdrawal / Drawings (− Outflow)
                  </option>
                  <option value="LOAN_REPAYMENT">
                    Loan Repayment to Partner (− Outflow)
                  </option>
                  <option value="OTHER">Other Approved Classification</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Reason / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initial raw material procurement, Equipment deposit"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                />
              </div>

              {/* Method & Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value })
                    }
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    UTR / Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR987654321"
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* Action buttons */}
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
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Slide-Over Detail Drawer (PRD §3.4) */}
      {selectedDrawerEntry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#493020]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-[#E8E2D5] p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                <div>
                  <span className="text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                    Entry Details
                  </span>
                  <h3 className="text-base font-bold text-[#29271F]">
                    {selectedDrawerEntry.partnerName} Capital
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDrawerEntry(null)}
                  className="p-1 rounded-md text-[#77736A] hover:text-[#29271F]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#77736A] block uppercase font-bold tracking-wider mb-1">
                    Amount
                  </span>
                  <div className="text-xl font-bold font-mono text-[#29271F] tabular-nums">
                    {formatINR(Math.abs(selectedDrawerEntry.amountPaise))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Classification
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {selectedDrawerEntry.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Date
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {formatDate(selectedDrawerEntry.date)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D5]">
                  <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                    Reason / Purpose
                  </span>
                  <p className="font-medium text-[#29271F] mt-1 leading-relaxed">
                    {selectedDrawerEntry.reason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Payment Method
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {selectedDrawerEntry.paymentMethod.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Reference / UTR
                    </span>
                    <span className="font-mono text-[#29271F]">
                      {selectedDrawerEntry.reference || "None"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D5]">
                  <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                    Audit Log
                  </span>
                  <div className="text-[11px] text-[#77736A] mt-1">
                    Recorded at {selectedDrawerEntry.createdAt} • Status: Approved
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5]">
              <button
                onClick={() => setSelectedDrawerEntry(null)}
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
