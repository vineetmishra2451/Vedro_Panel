"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  RotateCcw,
  Store,
  Globe,
  FileText,
  Search,
  Filter,
  Download,
  AlertCircle,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDate, rupeesToPaise } from "@/lib/format";

interface OrderRecord {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  channel: string;
  itemDescription: string;
  quantity: number;
  unitPricePaise: number;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  paymentMode: string;
  paymentStatus: "PAID" | "PENDING";
  fulfillmentStatus: "FULFILLED" | "CONFIRMED";
  notes?: string;
}

const VEDRO_CATALOG_OPTIONS = [
  // Ghee
  { sku: "VED-GHEE-250ML", name: "Pure A2 Desi Cow Bilona Ghee 250ml", price: 399, gst: 12 },
  { sku: "VED-GHEE-500ML", name: "Pure A2 Desi Cow Bilona Ghee 500ml", price: 749, gst: 12 },
  { sku: "VED-GHEE-1LTR", name: "Pure A2 Desi Cow Bilona Ghee 1 Litre", price: 1449, gst: 12 },
  // Mustard Oil
  { sku: "VED-OIL-300ML", name: "Cold-Pressed Mustard Oil 300ml", price: 89, gst: 5 },
  { sku: "VED-OIL-500ML", name: "Cold-Pressed Mustard Oil 500ml", price: 139, gst: 5 },
  { sku: "VED-OIL-1LTR", name: "Cold-Pressed Mustard Oil 1 Litre", price: 249, gst: 5 },
  { sku: "VED-OIL-2LTR", name: "Cold-Pressed Mustard Oil 2 Litre", price: 479, gst: 5 },
  { sku: "VED-OIL-5LTR", name: "Cold-Pressed Mustard Oil 5 Litre", price: 1149, gst: 5 },
  // Jaggery
  { sku: "VED-JAG-500GM", name: "Natural Organic Jaggery 500g", price: 69, gst: 5 },
  { sku: "VED-JAG-1KG", name: "Natural Organic Jaggery 1kg", price: 125, gst: 5 },
];

export default function SalesOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "returns" | "channels">("orders");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<OrderRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new offline sale
  const [formData, setFormData] = useState({
    date: "",
    customerName: "",
    customerPhone: "",
    itemDescription: "",
    quantity: "1",
    unitPrice: "",
    discount: "0",
    gstRate: "5", // Default 5% for packaged food
    paymentMode: "UPI",
    paymentStatus: "PAID" as "PAID" | "PENDING",
    notes: "",
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new-order") {
        setIsModalOpen(true);
      }
    }

    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
        }
      } catch (err) {
        console.error("Failed to load orders from database:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  const channels = [
    { name: "Offline / Direct Store", type: "PHYSICAL", status: "Active", count: orders.filter(o => o.channel.includes("Offline")).length },
    { name: "Website (D2C)", type: "ONLINE", status: "Active", count: 0 },
    { name: "Amazon Marketplace", type: "MARKETPLACE", status: "Active", count: 0 },
    { name: "Flipkart Marketplace", type: "MARKETPLACE", status: "Active", count: 0 },
    { name: "B2B Wholesale", type: "B2B", status: "Active", count: 0 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const qty = parseInt(formData.quantity);
    const unitPrice = parseFloat(formData.unitPrice);

    if (isNaN(qty) || qty <= 0) {
      setFormError("Please enter a valid quantity of 1 or more.");
      return;
    }

    if (isNaN(unitPrice) || unitPrice <= 0) {
      setFormError("Please enter a valid unit price greater than ₹0.");
      return;
    }

    if (!formData.itemDescription.trim()) {
      setFormError("Please enter the product item description or SKU.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save order to database");
      }

      const data = await res.json();
      const savedOrder: OrderRecord = data.order;

      setOrders((prev) => [savedOrder, ...prev]);
      setIsModalOpen(false);
      setSuccessMessage(
        `Order ${savedOrder.orderNumber} of ${formatINR(savedOrder.totalPaise)} saved to database successfully!`
      );

      // Reset
      setFormData({
        date: new Date().toISOString().split("T")[0],
        customerName: "",
        customerPhone: "",
        itemDescription: "",
        quantity: "1",
        unitPrice: "",
        discount: "0",
        gstRate: "5",
        paymentMode: "UPI",
        paymentStatus: "PAID",
        notes: "",
      });

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error("Order submit error:", err);
      setFormError(err?.message || "Could not save order to database. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Omnichannel Commerce
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              Offline, D2C Website & Marketplaces
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Sales & Orders
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Capture offline customer orders, import marketplace settlements, and track line-item GST.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Record Offline Sale</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-[#F2EBD8]/60 border border-[#493020]/30 text-[#493020] text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#493020] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Tabs */}
      <div className="flex border-b border-[#E8E2D5] gap-6 text-xs">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "orders"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Orders & Invoices ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("returns")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "returns"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Returns & Restock Log (0)
        </button>
        <button
          onClick={() => setActiveTab("channels")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "channels"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Sales Channels ({channels.length})
        </button>
      </div>

      {activeTab === "orders" && (
        <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
          {loadingOrders ? (
            <div className="p-12 text-center text-[#77736A]">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2.5 text-[#E4BF22]" />
              <p className="text-xs font-semibold text-[#493020]">Loading orders from database...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-[#77736A]">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
              <h4 className="font-bold text-[#29271F] text-sm">No Orders Recorded Yet</h4>
              <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
                Click "+ Record Offline Sale" to add a customer sale with line items, tax, and payment details.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
              >
                + Record Offline Sale
              </button>
            </div>
          ) : (
            <div>
              {/* Mobile Orders List (< md) */}
              <div className="md:hidden divide-y divide-[#E8E2D5]">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#493020]">
                          {ord.orderNumber}
                        </span>
                        <div className="text-[11px] text-[#77736A] mt-0.5">
                          {formatDate(ord.date)} • {ord.channel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-[#493020]">
                          <MoneyDisplay paise={ord.totalPaise} />
                        </div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F2EBD8]/70 text-[#493020] border border-[#493020]/20 mt-0.5">
                          {ord.paymentMode} • {ord.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FCFAF3] p-2.5 rounded-xl border border-[#E8E2D5] text-xs">
                      <div className="font-semibold text-[#29271F] flex items-center justify-between">
                        <span>{ord.customerName}</span>
                        {ord.customerPhone && (
                          <span className="text-[10px] text-[#77736A] font-mono">
                            {ord.customerPhone}
                          </span>
                        )}
                      </div>
                      <div className="text-[#77736A] text-[11px] mt-1">
                        {ord.itemDescription} (Qty: {ord.quantity} × {formatINR(ord.unitPricePaise, false)})
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setSelectedDrawerOrder(ord)}
                        className="text-xs font-bold text-[#493020] hover:underline"
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Orders Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCFAF3] border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Order #</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Items / Qty</th>
                      <th className="px-5 py-3">Channel</th>
                      <th className="px-5 py-3">Payment</th>
                      <th className="px-5 py-3 text-right">Total (₹)</th>
                      <th className="px-5 py-3 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FCFAF3]/80 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-[#493020]">
                          {ord.orderNumber}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-[#77736A]">
                          {formatDate(ord.date)}
                        </td>
                        <td className="px-5 py-3 font-semibold">
                          <div>{ord.customerName}</div>
                          {ord.customerPhone && (
                            <div className="text-[10px] text-[#77736A] font-mono">
                              {ord.customerPhone}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium">
                          <div>{ord.itemDescription}</div>
                          <div className="text-[10px] text-[#77736A]">
                            Qty: {ord.quantity} × {formatINR(ord.unitPricePaise, false)}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FCFAF3] text-[#29271F] border border-[#E8E2D5]">
                            {ord.channel}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F2EBD8]/60 text-[#493020] border border-[#493020]/20">
                            {ord.paymentMode} • {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-sm tabular-nums">
                          <MoneyDisplay paise={ord.totalPaise} />
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => setSelectedDrawerOrder(ord)}
                            className="text-[11px] font-semibold text-[#493020] hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "returns" && (
        <div className="bg-white border border-[#E8E2D5] rounded-xl p-12 text-center text-[#77736A] shadow-xs">
          <RotateCcw className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
          <h4 className="font-bold text-[#29271F] text-sm">No Returns Logged</h4>
          <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
            Customer returns specify refund amount and restockable quantity separately.
          </p>
        </div>
      )}

      {activeTab === "channels" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {channels.map((ch) => (
            <div
              key={ch.name}
              className="bg-white border border-[#E8E2D5] rounded-xl p-4 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#493020] bg-[#F2EBD8]/60 px-2 py-0.5 rounded border border-[#493020]/20">
                  {ch.type}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#493020]"></span>
              </div>
              <h4 className="font-bold text-sm text-[#29271F]">{ch.name}</h4>
              <div className="mt-3 pt-2.5 border-t border-[#E8E2D5] flex items-center justify-between text-xs">
                <span className="text-[#77736A]">Recorded Orders</span>
                <span className="font-mono font-bold text-[#29271F]">{ch.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Offline Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#29271F] leading-tight">
                  Record Offline Sale
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  Direct retail order with GST & payment allocation
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

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Sale Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                />
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* SKU Quick Select Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Choose from Vedro SKUs (Quick Select)
                </label>
                <select
                  onChange={(e) => {
                    const sel = VEDRO_CATALOG_OPTIONS.find((o) => o.sku === e.target.value);
                    if (sel) {
                      setFormData((prev) => ({
                        ...prev,
                        itemDescription: `${sel.name} (${sel.sku})`,
                        unitPrice: sel.price.toString(),
                        gstRate: sel.gst.toString(),
                      }));
                    }
                  }}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                >
                  <option value="">-- Select SKU (Auto-fills Price & Tax) --</option>
                  <optgroup label="Pure Desi Cow Ghee (GST 12%)">
                    <option value="VED-GHEE-250ML">Pure Desi Cow Ghee 250ml — ₹399 (12% GST)</option>
                    <option value="VED-GHEE-500ML">Pure Desi Cow Ghee 500ml — ₹749 (12% GST)</option>
                    <option value="VED-GHEE-1LTR">Pure Desi Cow Ghee 1 Litre — ₹1,449 (12% GST)</option>
                  </optgroup>
                  <optgroup label="Cold-Pressed Mustard Oil (GST 5%)">
                    <option value="VED-OIL-300ML">Cold-Pressed Mustard Oil 300ml — ₹89 (5% GST)</option>
                    <option value="VED-OIL-500ML">Cold-Pressed Mustard Oil 500ml — ₹139 (5% GST)</option>
                    <option value="VED-OIL-1LTR">Cold-Pressed Mustard Oil 1 Litre — ₹249 (5% GST)</option>
                    <option value="VED-OIL-2LTR">Cold-Pressed Mustard Oil 2 Litre — ₹479 (5% GST)</option>
                    <option value="VED-OIL-5LTR">Cold-Pressed Mustard Oil 5 Litre — ₹1,149 (5% GST)</option>
                  </optgroup>
                  <optgroup label="Organic Chemical-Free Jaggery (GST 5%)">
                    <option value="VED-JAG-500GM">Natural Organic Jaggery 500g — ₹69 (5% GST)</option>
                    <option value="VED-JAG-1KG">Natural Organic Jaggery 1kg — ₹125 (5% GST)</option>
                  </optgroup>
                </select>
              </div>

              {/* Item description */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Product Item / SKU Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure A2 Desi Cow Bilona Ghee 500ml"
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                />
              </div>

              {/* Quantity & Unit Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="120"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              {/* GST Slab & Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    GST Rate
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Packaged Food)</option>
                    <option value="12">12% (Processed Food)</option>
                    <option value="18">18% (Standard / Services)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="UPI">UPI (QR / PhonePe / GPay)</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1">
                  Internal Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Store tasting promo, bulk pack discount"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                />
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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Saving Order..." : "Record Order"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedDrawerOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#493020]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-[#E8E2D5] p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                <div>
                  <span className="text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                    Order Details
                  </span>
                  <h3 className="text-base font-bold text-[#29271F]">
                    {selectedDrawerOrder.orderNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDrawerOrder(null)}
                  className="p-1 rounded-md text-[#77736A] hover:text-[#29271F]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#77736A] block uppercase font-bold tracking-wider mb-1">
                    Total Amount (Incl. GST)
                  </span>
                  <div className="text-xl font-bold font-mono text-[#29271F] tabular-nums">
                    {formatINR(selectedDrawerOrder.totalPaise)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Customer
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {selectedDrawerOrder.customerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Date
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {formatDate(selectedDrawerOrder.date)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D5]">
                  <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                    Item Purchased
                  </span>
                  <div className="font-medium text-[#29271F] mt-1">
                    {selectedDrawerOrder.itemDescription}
                  </div>
                  <div className="text-[#77736A] text-[11px] mt-0.5">
                    Qty: {selectedDrawerOrder.quantity} • Unit Price: {formatINR(selectedDrawerOrder.unitPricePaise)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E8E2D5] text-[11px]">
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Subtotal
                    </span>
                    <span className="font-mono text-[#29271F]">
                      {formatINR(selectedDrawerOrder.subtotalPaise)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Discount
                    </span>
                    <span className="font-mono text-[#29271F]">
                      {formatINR(selectedDrawerOrder.discountPaise)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      GST Tax
                    </span>
                    <span className="font-mono text-[#493020] font-bold">
                      {formatINR(selectedDrawerOrder.taxPaise)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D5]">
                  <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                    Payment Mode
                  </span>
                  <div className="font-semibold text-[#29271F] mt-0.5">
                    {selectedDrawerOrder.paymentMode} • Status: {selectedDrawerOrder.paymentStatus}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5]">
              <button
                onClick={() => setSelectedDrawerOrder(null)}
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
