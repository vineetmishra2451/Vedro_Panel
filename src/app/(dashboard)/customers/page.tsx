"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Download,
  ShieldCheck,
  Users,
  X,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatDate, formatINR } from "@/lib/format";

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  source: string;
  orderCount: number;
  totalSpentPaise: number;
  createdAt: string;
  notes?: string;
}

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDrawerCustomer, setSelectedDrawerCustomer] = useState<CustomerRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Mumbai",
    source: "Retail Walk-in",
    notes: "",
  });

  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Please enter the customer's full name.");
      return;
    }

    if (!formData.phone.trim()) {
      setFormError("Please enter the customer's primary phone number.");
      return;
    }

    const newCustomer: CustomerRecord = {
      id: `cust-${Date.now()}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      city: formData.city.trim() || undefined,
      source: formData.source,
      orderCount: 0,
      totalSpentPaise: 0,
      createdAt: new Date().toISOString(),
      notes: formData.notes.trim() || undefined,
    };

    setCustomers([newCustomer, ...customers]);
    setIsModalOpen(false);
    setSuccessMessage(`Customer "${formData.name.trim()}" added to directory successfully!`);

    setFormData({
      name: "",
      phone: "",
      email: "",
      city: "Mumbai",
      source: "Retail Walk-in",
      notes: "",
    });

    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Customer Directory
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              Permission-Controlled PII & AOV
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Customer Management
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Maintain customer contacts, order frequencies, net spend, repeat retention, and acquisition channels.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-[#F2EBD8]/60 border border-[#493020]/30 text-[#493020] text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#493020] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiCard
          title="Total Customers"
          value={customers.length}
          format="number"
          status="actual"
          subtext="Verified unique phone/emails"
        />
        <KpiCard
          title="Average Order Value (AOV)"
          value={0}
          format="currency"
          status="actual"
          subtext="Net sales ÷ completed orders"
        />
        <KpiCard
          title="Repeat Purchase Rate"
          value={null}
          textValue="0%"
          status="actual"
          subtext="Customers with >1 order"
        />
      </div>

      {/* 3. Table & Filter */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#77736A] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer name, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg pl-8 pr-3 py-1.5 text-[#29271F] placeholder:text-[#77736A]/70 focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22] w-64"
            />
          </div>

          <div className="text-[11px] text-[#77736A]">
            Showing {filteredCustomers.length} registered customers
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-[#77736A]">
            <UserCheck className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
            <h4 className="font-bold text-[#29271F] text-sm">No Customers in Directory</h4>
            <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
              Click "+ Add Customer" to create direct customer accounts or record walk-in client details.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
            >
              + Add Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFAF3] border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Customer Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Acquisition Source</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3 text-right">Total Spent (₹)</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#FCFAF3]/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold">{cust.name}</td>
                    <td className="px-5 py-3.5 text-[#77736A] font-mono text-[11px]">
                      <div>{cust.phone}</div>
                      {cust.email && <div className="text-[10px]">{cust.email}</div>}
                    </td>
                    <td className="px-5 py-3.5 font-medium">{cust.city || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FCFAF3] text-[#29271F] border border-[#E8E2D5]">
                        {cust.source}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono">{cust.orderCount}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums">
                      <MoneyDisplay paise={cust.totalSpentPaise} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedDrawerCustomer(cust)}
                        className="text-[11px] font-semibold text-[#493020] hover:underline"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#29271F] leading-tight">
                  Add New Customer
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  Register customer contact and billing details
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

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9820012345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* City & Acquisition Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Pune"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Acquisition Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="Retail Walk-in">Retail Walk-in / Direct</option>
                    <option value="Website (D2C)">Website (D2C)</option>
                    <option value="B2B Wholesale">B2B Wholesale Partner</option>
                    <option value="Instagram / Meta Ad">Instagram / Meta Ad</option>
                    <option value="Referral">Partner / Customer Referral</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Notes / Billing Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Preferred delivery day, GSTIN if B2B"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                />
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Drawer */}
      {selectedDrawerCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#493020]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-[#E8E2D5] p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                <div>
                  <span className="text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                    Customer Profile
                  </span>
                  <h3 className="text-base font-bold text-[#29271F]">
                    {selectedDrawerCustomer.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDrawerCustomer(null)}
                  className="p-1 rounded-md text-[#77736A] hover:text-[#29271F]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Phone
                    </span>
                    <span className="font-mono font-semibold text-[#29271F]">
                      {selectedDrawerCustomer.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      City
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {selectedDrawerCustomer.city || "—"}
                    </span>
                  </div>
                </div>

                {selectedDrawerCustomer.email && (
                  <div className="pt-3 border-t border-[#E8E2D5]">
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Email
                    </span>
                    <span className="text-[#29271F]">{selectedDrawerCustomer.email}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Total Orders
                    </span>
                    <span className="font-mono text-base font-bold text-[#29271F]">
                      {selectedDrawerCustomer.orderCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Lifetime Spend
                    </span>
                    <span className="font-mono text-base font-bold text-[#493020]">
                      {formatINR(selectedDrawerCustomer.totalSpentPaise)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D5]">
                  <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                    Acquisition Channel
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-semibold bg-[#FCFAF3] text-[#29271F] border border-[#E8E2D5]">
                    {selectedDrawerCustomer.source}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5]">
              <button
                onClick={() => setSelectedDrawerCustomer(null)}
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
