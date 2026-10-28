"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Loader2,
  UserPlus,
  Pencil,
  Trash2,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Award,
  Sparkles,
  Flame,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatDate, formatINR } from "@/lib/format";
import { getCachedData, setCachedData } from "@/lib/cache";

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

interface PartnerRecord {
  id: string;
  name: string;
}

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDrawerCustomer, setSelectedDrawerCustomer] = useState<CustomerRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [partners, setPartners] = useState<PartnerRecord[]>([
    { id: "partner-vivek", name: "Vivek" },
    { id: "partner-vineet", name: "Vineet" },
    { id: "partner-varunesh", name: "Varunesh" },
  ]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Customer State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    city: "Mumbai",
    source: "Retail Walk-in",
    notes: "",
  });
  const [editFormError, setEditFormError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Delete Customer State
  const [deleteConfirmCustomer, setDeleteConfirmCustomer] = useState<CustomerRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Customer Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbackMetrics, setFeedbackMetrics] = useState<any>(null);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  const loadFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      const res = await fetch("/api/feedback?limit=100");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        setFeedbackMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleCopyFeedbackLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/feedback`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Mumbai",
    source: "Retail Walk-in",
    referralPartner: "Vivek",
    referralCustomerName: "",
    notes: "",
  });

  const [formError, setFormError] = useState("");

  const openEditModal = (cust: CustomerRecord) => {
    setEditingCustomer(cust);
    setEditFormData({
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      email: cust.email || "",
      city: cust.city || "Mumbai",
      source: cust.source,
      notes: cust.notes || "",
    });
    setEditFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError("");

    if (!editFormData.name.trim()) {
      setEditFormError("Customer name is required.");
      return;
    }
    if (!editFormData.phone.trim()) {
      setEditFormError("Customer phone number is required.");
      return;
    }

    setIsEditing(true);
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to update customer");
      }

      const data = await res.json();
      const updatedCustomer = data.customer;

      const updatedList = customers.map((c) =>
        c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
      );
      setCustomers(updatedList);
      setCachedData("customers", updatedList);

      if (selectedDrawerCustomer?.id === updatedCustomer.id) {
        setSelectedDrawerCustomer({ ...selectedDrawerCustomer, ...updatedCustomer });
      }

      setIsEditModalOpen(false);
      setSuccessMessage(`Customer "${updatedCustomer.name}" updated successfully!`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error("Edit customer error:", err);
      setEditFormError(err.message || "Failed to update customer");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirmCustomer) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers?id=${deleteConfirmCustomer.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to delete customer");
      }

      const updatedList = customers.filter((c) => c.id !== deleteConfirmCustomer.id);
      setCustomers(updatedList);
      setCachedData("customers", updatedList);

      if (selectedDrawerCustomer?.id === deleteConfirmCustomer.id) {
        setSelectedDrawerCustomer(null);
      }

      const deletedName = deleteConfirmCustomer.name;
      setDeleteConfirmCustomer(null);
      setSuccessMessage(`Customer "${deletedName}" deleted successfully.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error("Delete customer error:", err);
      alert(err.message || "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchCustomers = async () => {
    // 1. Immediately hydrate from cache for zero-delay UI rendering
    const cachedCustomers = getCachedData<CustomerRecord[]>("customers");
    const cachedPartners = getCachedData<PartnerRecord[]>("partners");

    if (cachedCustomers && Array.isArray(cachedCustomers) && cachedCustomers.length > 0) {
      setCustomers(cachedCustomers);
      setLoading(false);
    }
    if (cachedPartners && Array.isArray(cachedPartners) && cachedPartners.length > 0) {
      setPartners(cachedPartners);
    }

    try {
      if (!cachedCustomers || cachedCustomers.length === 0) {
        setLoading(true);
      }
      const res = await fetch("/api/customers?limit=100");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.customers)) {
          setCustomers(data.customers);
          setCachedData("customers", data.customers);
        }
        if (Array.isArray(data.partners) && data.partners.length > 0) {
          setPartners(data.partners);
          setCachedData("partners", data.partners);
        }
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (formData.source === "Customer Referral" && !formData.referralCustomerName.trim()) {
      setFormError("Please select or enter the referring customer.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          referralType:
            formData.source === "Partner Referral"
              ? "PARTNER"
              : formData.source === "Customer Referral"
              ? "CUSTOMER"
              : "NONE",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save customer");
      }

      const data = await res.json();
      const savedCustomer: CustomerRecord = data.customer;

      setCustomers((prev) => {
        const updated = [
          savedCustomer,
          ...prev.filter((c) => c.id !== savedCustomer.id && c.phone !== savedCustomer.phone),
        ];
        setCachedData("customers", updated);
        return updated;
      });
      setIsModalOpen(false);
      setSuccessMessage(`Customer "${savedCustomer.name}" saved to directory successfully!`);

      setFormData({
        name: "",
        phone: "",
        email: "",
        city: "Mumbai",
        source: "Retail Walk-in",
        referralPartner: partners[0]?.name || "Vivek",
        referralCustomerName: "",
        notes: "",
      });

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error("Save customer error:", err);
      setFormError(err?.message || "Could not save customer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      c.source.toLowerCase().includes(q)
    );
  });

  // Calculate dynamic KPIs
  const totalOrdersCount = customers.reduce((acc, c) => acc + c.orderCount, 0);
  const totalNetSpendPaise = customers.reduce((acc, c) => acc + c.totalSpentPaise, 0);
  const aovPaise = totalOrdersCount > 0 ? Math.round(totalNetSpendPaise / totalOrdersCount) : 0;
  const repeatCustomersCount = customers.filter((c) => c.orderCount > 1).length;
  const repeatRate =
    customers.length > 0 ? Math.round((repeatCustomersCount / customers.length) * 100) : 0;

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
              Permission-Controlled PII & Referrals
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Customer Management
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Maintain customer contacts, partner/customer referral attribution, order frequencies, and net spend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyFeedbackLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#493020] bg-[#FCFAF3] hover:bg-[#F2EBD8] border border-[#E8E2D5] rounded-lg transition-colors shadow-xs active:scale-95"
            title="Copy public feedback link to share on WhatsApp or SMS"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#77736A]" />
                <span>Copy Feedback Link</span>
              </>
            )}
          </button>

          <Link
            href="/feedback"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#493020] bg-white hover:bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg transition-colors shadow-xs"
            title="Open customer-facing feedback form in a new tab"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#E4BF22]" />
            <span>Open Feedback Form</span>
            <ExternalLink className="w-3 h-3 text-[#77736A]" />
          </Link>

          <button
            onClick={() => {
              setIsFeedbackModalOpen(true);
              loadFeedbacks();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#493020] bg-white hover:bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg transition-colors shadow-xs"
            title="View customer quality ratings & feedback submissions"
          >
            <Award className="w-3.5 h-3.5 text-[#E4BF22]" />
            <span>Feedbacks {feedbacks.length > 0 ? `(${feedbacks.length})` : ""}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Customer</span>
          </button>
        </div>
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
          subtext="Verified in database"
        />
        <KpiCard
          title="Average Order Value (AOV)"
          value={aovPaise}
          format="currency"
          status="actual"
          subtext="Net sales ÷ completed orders"
        />
        <KpiCard
          title="Repeat Purchase Rate"
          value={null}
          textValue={`${repeatRate}%`}
          status="actual"
          subtext={`${repeatCustomersCount} customers with >1 order`}
        />
      </div>

      {/* 3. Table & Filter */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#77736A] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer name, phone, referral, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg pl-8 pr-3 py-1.5 text-[#29271F] placeholder:text-[#77736A]/70 focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22] w-72"
            />
          </div>

          <div className="text-[11px] text-[#77736A]">
            Showing {filteredCustomers.length} registered customers
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#77736A]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2.5 text-[#E4BF22]" />
            <p className="text-xs font-semibold text-[#493020]">Loading customers from database...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-[#77736A]">
            <UserCheck className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
            <h4 className="font-bold text-[#29271F] text-sm">No Customers in Directory</h4>
            <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
              Click "+ Add Customer" to create direct customer accounts or record walk-in client details with referral attribution.
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
                  <th className="px-5 py-3">Acquisition Source / Referral</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3 text-right">Total Spent (₹)</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
                {filteredCustomers.map((cust) => {
                  const isReferral = cust.source.toLowerCase().includes("referral");
                  return (
                    <tr key={cust.id} className="hover:bg-[#FCFAF3]/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold">{cust.name}</td>
                      <td className="px-5 py-3.5 text-[#77736A] font-mono text-[11px]">
                        <div>{cust.phone}</div>
                        {cust.email && <div className="text-[10px]">{cust.email}</div>}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{cust.city || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isReferral
                              ? "bg-[#F2EBD8]/70 text-[#493020] border-[#493020]/25 font-bold"
                              : "bg-[#FCFAF3] text-[#29271F] border-[#E8E2D5]"
                          }`}
                        >
                          {cust.source}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">{cust.orderCount}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums">
                        <MoneyDisplay paise={cust.totalSpentPaise} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedDrawerCustomer(cust)}
                            className="px-2 py-1 text-[11px] font-semibold text-[#493020] hover:bg-[#F2EBD8]/60 rounded transition-colors"
                            title="View Full Profile"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1 text-[#77736A] hover:text-[#493020] hover:bg-[#F2EBD8]/80 rounded transition-colors"
                            title="Edit Customer Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmCustomer(cust)}
                            className="p-1 text-[#77736A] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#29271F] leading-tight">
                  Add New Customer
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  Register contact details and partner/customer referral source
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
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="Retail Walk-in">Retail Walk-in / Direct</option>
                    <option value="Website (D2C)">Website (D2C)</option>
                    <option value="B2B Wholesale">B2B Wholesale Partner</option>
                    <option value="Instagram / Meta Ad">Instagram / Meta Ad</option>
                    <option value="Partner Referral">Partner Referral (Vivek, Vineet, Varunesh)</option>
                    <option value="Customer Referral">Customer Referral (from Directory)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Referral Sub-Option: Partner */}
              {formData.source === "Partner Referral" && (
                <div className="bg-[#FCFAF3] p-3 rounded-lg border border-[#E8E2D5] space-y-1">
                  <label className="block text-[11px] font-bold text-[#493020] uppercase tracking-wider">
                    Select Referring Partner *
                  </label>
                  <select
                    value={formData.referralPartner}
                    onChange={(e) => setFormData({ ...formData, referralPartner: e.target.value })}
                    className="w-full text-xs bg-white border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[#77736A] mt-0.5">
                    Associates customer acquisition directly with the selected co-founding partner.
                  </p>
                </div>
              )}

              {/* Dynamic Referral Sub-Option: Customer */}
              {formData.source === "Customer Referral" && (
                <div className="bg-[#FCFAF3] p-3 rounded-lg border border-[#E8E2D5] space-y-1">
                  <label className="block text-[11px] font-bold text-[#493020] uppercase tracking-wider">
                    Select Referring Customer (from Current Customer List) *
                  </label>
                  {customers.length > 0 ? (
                    <select
                      value={formData.referralCustomerName}
                      onChange={(e) =>
                        setFormData({ ...formData, referralCustomerName: e.target.value })
                      }
                      className="w-full text-xs bg-white border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                    >
                      <option value="">-- Choose Referring Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={`${c.name} (${c.phone})`}>
                          {c.name} — {c.phone}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Existing Customer Name & Phone"
                      value={formData.referralCustomerName}
                      onChange={(e) =>
                        setFormData({ ...formData, referralCustomerName: e.target.value })
                      }
                      className="w-full text-xs bg-white border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                    />
                  )}
                  <p className="text-[10px] text-[#77736A] mt-0.5">
                    Select the existing client from your directory who referred this new customer.
                  </p>
                </div>
              )}

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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Saving Customer..." : "Save Customer"}</span>
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
                    Acquisition Channel / Referral
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-semibold bg-[#FCFAF3] text-[#29271F] border border-[#E8E2D5]">
                    {selectedDrawerCustomer.source}
                  </span>
                </div>

                {selectedDrawerCustomer.notes && (
                  <div className="pt-3 border-t border-[#E8E2D5]">
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Notes / Remarks
                    </span>
                    <p className="text-[11px] text-[#77736A] mt-1 leading-relaxed">
                      {selectedDrawerCustomer.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEditModal(selectedDrawerCustomer)}
                  className="w-full py-2 text-xs font-semibold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] rounded-lg transition-colors border border-[#493020]/20 flex items-center justify-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => setDeleteConfirmCustomer(selectedDrawerCustomer)}
                  className="w-full py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
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

      {/* Edit Customer Modal */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#29271F] leading-tight">
                  Edit Customer Details
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  Update contact, city, referral source, or account notes
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#77736A] hover:text-[#29271F] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 mt-4">
              {editFormError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
                  {editFormError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@example.com"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
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
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Source / Channel
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Retail Walk-in, Website D2C"
                    value={editFormData.source}
                    onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Customer Notes / Preferences
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Prefers 1L A2 Ghee, calls on WhatsApp before ordering"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#77736A] hover:text-[#29271F] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {isEditing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditing ? "Saving Changes..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteConfirmCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-[#E8E2D5]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#29271F]">
                  Delete Customer?
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-xs text-[#29271F] leading-relaxed mb-4">
              Are you sure you want to delete <strong>{deleteConfirmCustomer.name}</strong> (
              <span className="font-mono">{deleteConfirmCustomer.phone}</span>)?
              Any past orders will remain intact with unlinked customer attribution.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E2D5]">
              <button
                type="button"
                onClick={() => setDeleteConfirmCustomer(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-[#77736A] hover:text-[#29271F] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete Customer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Feedback Responses Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E2D5] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E8E2D5] flex items-center justify-between bg-[#FCFAF3]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E4BF22]/20 border border-[#E4BF22]/40 flex items-center justify-center text-[#493020]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#493020]">
                    Vedro Mustard Oil Customer Feedback
                  </h3>
                  <p className="text-xs text-[#77736A]">
                    Customer ratings across aroma, quality, taste, texture, packaging, and repurchase intent
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/feedback"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#493020] bg-white border border-[#E8E2D5] rounded-lg hover:bg-[#F2EBD8]"
                >
                  <span>Open Form</span>
                  <ExternalLink className="w-3 h-3 text-[#77736A]" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="p-1.5 text-[#77736A] hover:text-[#29271F] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics Ribbon */}
            {feedbackMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FDFBF7] border-b border-[#E8E2D5]">
                <div className="bg-white p-3 rounded-xl border border-[#E8E2D5]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#77736A]">Total Responses</div>
                  <div className="text-xl font-bold text-[#493020] mt-0.5">{feedbackMetrics.totalResponses || 0}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E8E2D5]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#77736A]">Quality CSAT</div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">{feedbackMetrics.csatPercent || 0}%</div>
                  <div className="text-[10px] text-[#77736A]">Rated Excellent / Good</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E8E2D5]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#77736A]">Repurchase Intent</div>
                  <div className="text-xl font-bold text-[#E4BF22] mt-0.5">{feedbackMetrics.loyaltyPercent || 0}%</div>
                  <div className="text-[10px] text-[#77736A]">Definitely / Probably</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E8E2D5]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#77736A]">No Issues Rate</div>
                  <div className="text-xl font-bold text-blue-700 mt-0.5">
                    {feedbackMetrics.totalResponses > 0
                      ? Math.round(((feedbackMetrics.issueCounts?.["No issues"] || 0) / feedbackMetrics.totalResponses) * 100)
                      : 100}%
                  </div>
                  <div className="text-[10px] text-[#77736A]">Flawless Experience</div>
                </div>
              </div>
            )}

            {/* Submissions List */}
            <div className="p-5 overflow-y-auto space-y-4 divide-y divide-[#F0EBE1] flex-1">
              {loadingFeedbacks ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#77736A]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E4BF22]" />
                  <span>Loading feedback responses...</span>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FCFAF3] border border-[#E8E2D5] flex items-center justify-center mx-auto text-[#77736A]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-[#493020]">No Customer Feedback Submitted Yet</p>
                  <p className="text-xs text-[#77736A] max-w-sm mx-auto">
                    Share the feedback form link with your customers or print the QR code on bottle labels.
                  </p>
                  <button
                    onClick={handleCopyFeedbackLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Feedback Link
                  </button>
                </div>
              ) : (
                feedbacks.map((item: any) => (
                  <div key={item.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#493020] text-sm">
                          {item.customerName || "Anonymous Customer"}
                        </span>
                        {item.customerPhone && (
                          <span className="text-[#77736A] font-mono text-xs">({item.customerPhone})</span>
                        )}
                        {item.city && (
                          <span className="bg-[#FCFAF3] text-[#77736A] px-2 py-0.5 rounded border border-[#E8E2D5] text-[10px]">
                            {item.city}
                          </span>
                        )}
                      </div>
                      <span className="text-[#77736A] text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Ratings Badges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-[#FCFAF3] p-2 rounded-lg border border-[#E8E2D5]">
                        <span className="text-[10px] text-[#77736A] block">1. Overall Quality</span>
                        <span className={`font-bold ${item.overallQuality === "Excellent" || item.overallQuality === "Good" ? "text-emerald-700" : "text-amber-700"}`}>
                          {item.overallQuality}
                        </span>
                      </div>
                      <div className="bg-[#FCFAF3] p-2 rounded-lg border border-[#E8E2D5]">
                        <span className="text-[10px] text-[#77736A] block">2. Natural Aroma</span>
                        <span className="font-bold text-[#493020]">{item.naturalAroma}</span>
                      </div>
                      <div className="bg-[#FCFAF3] p-2 rounded-lg border border-[#E8E2D5]">
                        <span className="text-[10px] text-[#77736A] block">3. Taste & Flavour</span>
                        <span className="font-bold text-[#493020]">{item.tasteAndFlavour}</span>
                      </div>
                      <div className="bg-[#FCFAF3] p-2 rounded-lg border border-[#E8E2D5]">
                        <span className="text-[10px] text-[#77736A] block">4. Colour & Texture</span>
                        <span className="font-bold text-[#493020]">{item.colourTexture}</span>
                      </div>
                      <div className="bg-[#FCFAF3] p-2 rounded-lg border border-[#E8E2D5]">
                        <span className="text-[10px] text-[#77736A] block">5. Cooking Performance</span>
                        <span className="font-bold text-[#493020]">{item.cookingPerformance}</span>
                      </div>
                      <div className="bg-[#FCFAF3] p-2 rounded-lg border border-[#E8E2D5]">
                        <span className="text-[10px] text-[#77736A] block">6. Packaging Quality</span>
                        <span className="font-bold text-[#493020]">{item.packagingQuality}</span>
                      </div>
                      <div className="bg-[#FCFAF3] p-2 rounded-lg border border-[#E8E2D5]">
                        <span className="text-[10px] text-[#77736A] block">7. Issues Noticed</span>
                        <span className={`font-bold ${item.issuesNoticed === "No issues" ? "text-emerald-700" : "text-rose-700"}`}>
                          {item.issuesNoticed}
                        </span>
                      </div>
                      <div className="bg-[#FCFAF3] p-2 rounded-lg border border-[#E8E2D5]">
                        <span className="text-[10px] text-[#77736A] block">8. Repurchase / Recommend</span>
                        <span className="font-bold text-[#E4BF22]">{item.repurchaseRecommend}</span>
                      </div>
                    </div>

                    {/* Issue Details or Comments if present */}
                    {(item.issuesDetails || item.additionalComments) && (
                      <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#E4BF22]/30 text-xs space-y-1">
                        {item.issuesDetails && (
                          <div>
                            <strong className="text-rose-800">Issue Note:</strong> {item.issuesDetails}
                          </div>
                        )}
                        {item.additionalComments && (
                          <div>
                            <strong className="text-[#493020]">Customer Note:</strong> {item.additionalComments}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E8E2D5] bg-[#FCFAF3] flex items-center justify-between">
              <span className="text-xs text-[#77736A]">
                Showing {feedbacks.length} feedback response{feedbacks.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#493020] bg-white border border-[#E8E2D5] hover:bg-[#F2EBD8] rounded-xl shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
