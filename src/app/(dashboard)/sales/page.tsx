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
  Edit2,
  Trash2,
} from "lucide-react";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDate, rupeesToPaise } from "@/lib/format";
import { getCachedData, setCachedData } from "@/lib/cache";

interface OrderRecord {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  channel: string;
  sku?: string;
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
  gstRate?: number;
  notes?: string;
  remainingStock?: number;
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  gstRate: number;
  costPricePaise: number;
  sellingPricePaise: number;
  availableStock: number;
  status: string;
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
  const [productList, setProductList] = useState<ProductItem[]>([]);
  const [customerList, setCustomerList] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [partnersList, setPartnersList] = useState<{ id: string; name: string }[]>([
    { id: "partner-vivek", name: "Vivek" },
    { id: "partner-vineet", name: "Vineet" },
    { id: "partner-varunesh", name: "Varunesh" },
  ]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Save to contacts toggle (option to not add to contacts)
  const [saveToContacts, setSaveToContacts] = useState(true);

  // Referral states for sale
  const [referralOption, setReferralOption] = useState<"NONE" | "PARTNER" | "CUSTOMER">("NONE");
  const [referralPartner, setReferralPartner] = useState("Vivek");
  const [referralCustomerName, setReferralCustomerName] = useState("");

  // Form state for new / edit offline sale
  const [formData, setFormData] = useState({
    date: "",
    customerName: "",
    customerPhone: "",
    sku: "",
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

  // Live real-time calculation for modal preview
  const liveQty = parseInt(formData.quantity) || 1;
  const liveUnitPrice = parseFloat(formData.unitPrice) || 0;
  const liveDiscount = parseFloat(formData.discount) || 0;
  const liveGstPct = isNaN(parseFloat(formData.gstRate)) ? 5 : parseFloat(formData.gstRate);
  const liveSubtotalPaise = Math.round(liveQty * liveUnitPrice * 100);
  const liveDiscountPaise = Math.round(liveDiscount * 100);
  const liveTaxablePaise = Math.max(0, liveSubtotalPaise - liveDiscountPaise);
  const liveTaxPaise = Math.round((liveTaxablePaise * liveGstPct) / 100);
  const liveTotalPaise = liveTaxablePaise + liveTaxPaise;

  // Resolve current selected product and available inventory stock
  const resolvedSku =
    formData.sku ||
    (() => {
      const match = formData.itemDescription.match(/VED-[A-Z0-9-]+/i);
      return match ? match[0].toUpperCase() : "";
    })();

  const selectedProduct = productList.find(
    (p) => p.sku.toUpperCase() === resolvedSku.toUpperCase()
  );

  const availableStock = selectedProduct ? selectedProduct.availableStock : undefined;
  const isOutOfStock = availableStock !== undefined && availableStock <= 0;
  const isStockMismatch = availableStock !== undefined && liveQty > availableStock;

  const loadData = async () => {
    // 1. Immediately hydrate from cache for zero-delay UI rendering
    const cachedOrders = getCachedData<OrderRecord[]>("orders");
    const cachedCust = getCachedData<CustomerRecord[]>("customers");
    const cachedPart = getCachedData<PartnerRecord[]>("partners");
    const cachedProds = getCachedData<any>("products");

    if (cachedOrders && Array.isArray(cachedOrders) && cachedOrders.length > 0) {
      setOrders(cachedOrders);
      setLoadingOrders(false);
    }
    if (cachedCust && Array.isArray(cachedCust) && cachedCust.length > 0) {
      setCustomerList(cachedCust);
    }
    if (cachedPart && Array.isArray(cachedPart) && cachedPart.length > 0) {
      setPartnersList(cachedPart);
    }
    if (cachedProds?.products && Array.isArray(cachedProds.products)) {
      setProductList(cachedProds.products);
    }

    try {
      if (!cachedOrders || cachedOrders.length === 0) {
        setLoadingOrders(true);
      }
      const [resOrders, resCust, resProds] = await Promise.all([
        fetch("/api/orders?limit=100"),
        fetch("/api/customers?limit=100"),
        fetch("/api/products"),
      ]);

      if (resOrders.ok) {
        const data = await resOrders.json();
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
          setCachedData("orders", data.orders);
        }
      }

      if (resCust.ok) {
        const cData = await resCust.json();
        if (Array.isArray(cData.customers)) {
          setCustomerList(cData.customers);
          setCachedData("customers", cData.customers);
        }
        if (Array.isArray(cData.partners) && cData.partners.length > 0) {
          setPartnersList(cData.partners);
          setCachedData("partners", cData.partners);
        }
      }

      if (resProds.ok) {
        const pData = await resProds.json();
        if (Array.isArray(pData.products)) {
          setProductList(pData.products);
          setCachedData("products", pData);
        }
      }
    } catch (err) {
      console.error("Failed to load orders, products, or customers from database:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new-order") {
        setEditingOrderId(null);
        setIsModalOpen(true);
      }
    }

    loadData();
  }, []);

  const channels = [
    {
      name: "Offline / Direct Store",
      type: "PHYSICAL",
      status: "Active",
      count: orders.filter((o) => o.channel.includes("Offline")).length,
    },
    { name: "Website (D2C)", type: "ONLINE", status: "Active", count: 0 },
    { name: "Amazon Marketplace", type: "MARKETPLACE", status: "Active", count: 0 },
    { name: "Flipkart Marketplace", type: "MARKETPLACE", status: "Active", count: 0 },
    { name: "B2B Wholesale", type: "B2B", status: "Active", count: 0 },
  ];

  const handleOpenCreate = () => {
    setEditingOrderId(null);
    setSaveToContacts(true);
    setReferralOption("NONE");
    setReferralCustomerName("");
    setReferralPartner(partnersList[0]?.name || "Vivek");
    setFormData({
      date: new Date().toISOString().split("T")[0],
      customerName: "",
      customerPhone: "",
      sku: "",
      itemDescription: "",
      quantity: "1",
      unitPrice: "",
      discount: "0",
      gstRate: "5",
      paymentMode: "UPI",
      paymentStatus: "PAID",
      notes: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: OrderRecord) => {
    setEditingOrderId(order.id);
    setSaveToContacts(true);
    setFormError("");

    // Calculate existing order GST rate accurately
    const taxablePaise = Math.max(0, order.subtotalPaise - order.discountPaise);
    const existingGst =
      order.gstRate !== undefined
        ? order.gstRate
        : taxablePaise > 0
        ? Math.round((order.taxPaise * 100) / taxablePaise)
        : 5;

    // Parse referral from notes if present
    let cleanedNotes = order.notes || "";
    let refOpt: "NONE" | "PARTNER" | "CUSTOMER" = "NONE";
    let refPartner = partnersList[0]?.name || "Vivek";
    let refCustName = "";

    if (cleanedNotes.includes("Referred by Partner:")) {
      refOpt = "PARTNER";
      const match = cleanedNotes.match(/\[Referred by Partner:\s*(.*?)\]/);
      if (match) {
        refPartner = match[1];
        cleanedNotes = cleanedNotes.replace(match[0], "").trim();
      }
    } else if (cleanedNotes.includes("Referred by Customer:")) {
      refOpt = "CUSTOMER";
      const match = cleanedNotes.match(/\[Referred by Customer:\s*(.*?)\]/);
      if (match) {
        refCustName = match[1];
        cleanedNotes = cleanedNotes.replace(match[0], "").trim();
      }
    }

    setReferralOption(refOpt);
    setReferralPartner(refPartner);
    setReferralCustomerName(refCustName);

    const targetSku =
      order.sku ||
      (() => {
        const match = order.itemDescription.match(/VED-[A-Z0-9-]+/i);
        return match ? match[0].toUpperCase() : "";
      })();

    setFormData({
      date: order.date,
      customerName:
        order.customerName === "Walk-in Retail Customer" ? "" : order.customerName,
      customerPhone: order.customerPhone || "",
      sku: targetSku,
      itemDescription: order.itemDescription,
      quantity: order.quantity.toString(),
      unitPrice: (order.unitPricePaise / 100).toString(),
      discount: (order.discountPaise / 100).toString(),
      gstRate: existingGst.toString(),
      paymentMode: order.paymentMode.includes("CASH")
        ? "CASH"
        : order.paymentMode.includes("CARD")
        ? "CARD"
        : "UPI",
      paymentStatus: order.paymentStatus,
      notes: cleanedNotes,
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (order: OrderRecord) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete order "${order.orderNumber}" of ${formatINR(
        order.totalPaise
      )}? This will restore ${order.quantity} units to inventory stock and adjust revenue accordingly.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/orders?id=${order.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete order");
      }

      setOrders((prev) => {
        const updated = prev.filter((o) => o.id !== order.id);
        setCachedData("orders", updated);
        return updated;
      });
      if (selectedDrawerOrder?.id === order.id) {
        setSelectedDrawerOrder(null);
      }

      // Restore product stock locally
      const orderSku =
        order.sku ||
        (() => {
          const match = order.itemDescription.match(/VED-[A-Z0-9-]+/i);
          return match ? match[0].toUpperCase() : "";
        })();

      if (orderSku) {
        setProductList((prev) => {
          const updated = prev.map((p) =>
            p.sku.toUpperCase() === orderSku.toUpperCase()
              ? { ...p, availableStock: p.availableStock + order.quantity }
              : p
          );
          const cached = getCachedData<any>("products") || {};
          setCachedData("products", { ...cached, products: updated });
          return updated;
        });
      }

      // Re-fetch products from backend to ensure 100% sync
      fetch("/api/products")
        .then((r) => r.json())
        .then((pData) => {
          if (Array.isArray(pData.products)) {
            setProductList(pData.products);
            setCachedData("products", pData);
          }
        })
        .catch(() => {});

      setSuccessMessage(`Order ${order.orderNumber} deleted. Restored ${order.quantity} units to inventory stock.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error("Delete order error:", err);
      alert(err.message || "Could not delete order. Please try again.");
    }
  };

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
      setFormError("Please enter the product item description or select a SKU.");
      return;
    }

    if (referralOption === "CUSTOMER" && !referralCustomerName.trim()) {
      setFormError("Please select or enter the referring customer.");
      return;
    }

    // ---------------------------------------------------------
    // CLIENT-SIDE REAL-TIME STOCK VALIDATION:
    // Show error notification banner if stock and sale mismatch!
    // ---------------------------------------------------------
    if (selectedProduct) {
      if (selectedProduct.availableStock <= 0) {
        setFormError(
          `Stock Mismatch Error: Product "${selectedProduct.name}" (${selectedProduct.sku}) is OUT OF STOCK (0 units available in inventory). Please restock before recording a sale.`
        );
        return;
      }
      if (qty > selectedProduct.availableStock) {
        setFormError(
          `Stock Mismatch Error: You are trying to sell ${qty} units, but only ${selectedProduct.availableStock} units of "${selectedProduct.name}" (${selectedProduct.sku}) are available in stock. Cannot complete sale.`
        );
        return;
      }
    }

    const parsedGst = parseFloat(formData.gstRate);
    const gstPct = isNaN(parsedGst) ? 5 : parsedGst;

    setIsSubmitting(true);

    try {
      const isEditing = Boolean(editingOrderId);
      const url = "/api/orders";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...(isEditing ? { id: editingOrderId } : {}),
        ...formData,
        sku: resolvedSku,
        gstRate: gstPct.toString(),
        saveToContacts,
        referralType: referralOption,
        referralPartner: referralOption === "PARTNER" ? referralPartner : undefined,
        referralCustomerName:
          referralOption === "CUSTOMER" ? referralCustomerName : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to ${isEditing ? "update" : "save"} order`);
      }

      const data = await res.json();
      const savedOrder: OrderRecord = {
        ...data.order,
        sku: resolvedSku || data.order.sku,
        gstRate: gstPct,
      };

      if (isEditing) {
        setOrders((prev) => {
          const updated = prev.map((o) => (o.id === savedOrder.id ? savedOrder : o));
          setCachedData("orders", updated);
          return updated;
        });
        if (selectedDrawerOrder?.id === savedOrder.id) {
          setSelectedDrawerOrder(savedOrder);
        }
        setSuccessMessage(`Order ${savedOrder.orderNumber} updated! Inventory stock adjusted.`);
      } else {
        setOrders((prev) => {
          const updated = [savedOrder, ...prev];
          setCachedData("orders", updated);
          return updated;
        });
        setSuccessMessage(
          `Order ${savedOrder.orderNumber} of ${formatINR(savedOrder.totalPaise)} saved! Automatically deducted ${qty} units of ${resolvedSku || "SKU"} from inventory stock.`
        );
      }

      // Automatically decrement stock in local state and cache
      if (resolvedSku) {
        setProductList((prev) => {
          const updated = prev.map((p) =>
            p.sku.toUpperCase() === resolvedSku.toUpperCase()
              ? { ...p, availableStock: Math.max(0, p.availableStock - qty) }
              : p
          );
          const cached = getCachedData<any>("products") || {};
          setCachedData("products", { ...cached, products: updated });
          return updated;
        });
      }

      // Re-fetch products and customers in background for complete live sync
      fetch("/api/products")
        .then((r) => r.json())
        .then((pData) => {
          if (Array.isArray(pData.products)) {
            setProductList(pData.products);
            setCachedData("products", pData);
          }
        })
        .catch(() => {});

      fetch("/api/customers?limit=100")
        .then((r) => r.json())
        .then((cData) => {
          if (Array.isArray(cData.customers)) {
            setCustomerList(cData.customers);
            setCachedData("customers", cData.customers);
          }
        })
        .catch(() => {});

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 6000);
    } catch (err: any) {
      console.error("Order submit error:", err);
      setFormError(err?.message || "Could not save order. Please check stock and try again.");
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 ml-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Live Inventory Stock Matched
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Sales & Orders
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Capture offline customer orders, import marketplace settlements, and manage line-item GST.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
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
              <p className="text-xs font-semibold text-[#493020]">
                Loading orders from database...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-[#77736A]">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
              <h4 className="font-bold text-[#29271F] text-sm">No Orders Recorded Yet</h4>
              <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
                Click "+ Record Offline Sale" to add a customer sale with line items, tax, and payment details.
              </p>
              <button
                onClick={handleOpenCreate}
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
                      {ord.notes && ord.notes.includes("Referred by") && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F2EBD8]/70 text-[#493020] border border-[#493020]/20">
                            {ord.notes.match(/\[(.*?)\]/)?.[1] || ord.notes}
                          </span>
                        </div>
                      )}
                      <div className="text-[#77736A] text-[11px] mt-1 flex items-center justify-between">
                        <span>{ord.itemDescription} (Qty: {ord.quantity} × {formatINR(ord.unitPricePaise, false)})</span>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          ✓ Stock Deducted
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1 border-t border-[#E8E2D5]/60 text-xs">
                      <button
                        onClick={() => setSelectedDrawerOrder(ord)}
                        className="font-bold text-[#493020] hover:underline"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenEdit(ord)}
                        className="font-semibold text-[#A96B13] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ord)}
                        className="font-semibold text-rose-600 hover:underline"
                      >
                        Delete
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
                      <th className="px-5 py-3 text-center">Actions</th>
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
                          {ord.notes && ord.notes.includes("Referred by") && (
                            <div className="mt-0.5">
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F2EBD8]/70 text-[#493020] border border-[#493020]/20">
                                {ord.notes.match(/\[(.*?)\]/)?.[1] || ord.notes}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span>{ord.itemDescription}</span>
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              ✓ Stock Deducted
                            </span>
                          </div>
                          <div className="text-[10px] text-[#77736A]">
                            Qty: {ord.quantity} × {formatINR(ord.unitPricePaise, false)}{" "}
                            {ord.gstRate !== undefined && (
                              <span className="font-semibold text-[#493020]">
                                • {ord.gstRate}% GST
                              </span>
                            )}
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedDrawerOrder(ord)}
                              className="text-[11px] font-semibold text-[#493020] hover:underline"
                            >
                              View
                            </button>
                            <span className="text-[#E8E2D5]">|</span>
                            <button
                              onClick={() => handleOpenEdit(ord)}
                              className="text-[11px] font-semibold text-[#A96B13] hover:underline"
                            >
                              Edit
                            </button>
                            <span className="text-[#E8E2D5]">|</span>
                            <button
                              onClick={() => handleDelete(ord)}
                              className="text-[11px] font-semibold text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* Record / Edit Offline Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#29271F] leading-tight">
                  {editingOrderId ? "Edit Sales Order" : "Record Offline Sale"}
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  {editingOrderId
                    ? "Update order details, tax rates, and customer notes"
                    : "Direct retail order with GST & payment allocation"}
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

              {/* Option to automatically add or not add to contacts (with duplicate protection) */}
              {!editingOrderId && (
                <div className="flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    id="saveToContactsCheckbox"
                    checked={saveToContacts}
                    onChange={(e) => setSaveToContacts(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#E4BF22] accent-[#E4BF22] focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="saveToContactsCheckbox"
                    className="text-[11px] text-[#29271F] font-medium cursor-pointer select-none"
                  >
                    Save contact to customer directory (updates automatically if duplicate phone exists)
                  </label>
                </div>
              )}

              {/* SKU Quick Select Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider">
                    Choose from Vedro SKUs (Quick Select)
                  </label>
                  {resolvedSku && (
                    <span className="text-[10px] font-mono font-bold text-[#493020] bg-[#F2EBD8]/70 px-1.5 py-0.5 rounded border border-[#493020]/20">
                      SKU: {resolvedSku}
                    </span>
                  )}
                </div>
                <select
                  value={formData.sku || ""}
                  onChange={(e) => {
                    const selSku = e.target.value;
                    const catalogItem = VEDRO_CATALOG_OPTIONS.find((o) => o.sku === selSku);
                    const prodItem = productList.find((p) => p.sku === selSku);
                    if (catalogItem) {
                      setFormData((prev) => ({
                        ...prev,
                        sku: catalogItem.sku,
                        itemDescription: `${catalogItem.name} (${catalogItem.sku})`,
                        unitPrice: catalogItem.price.toString(),
                        gstRate: catalogItem.gst.toString(),
                      }));
                      setFormError("");
                    } else if (prodItem) {
                      setFormData((prev) => ({
                        ...prev,
                        sku: prodItem.sku,
                        itemDescription: `${prodItem.name} (${prodItem.sku})`,
                        unitPrice: (prodItem.sellingPricePaise / 100).toString(),
                        gstRate: prodItem.gstRate.toString(),
                      }));
                      setFormError("");
                    }
                  }}
                  className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                >
                  <option value="">-- Select SKU (Auto-fills Price, Tax & Live Stock) --</option>
                  <optgroup label="Pure Desi Cow Ghee (GST 12%)">
                    {["VED-GHEE-250ML", "VED-GHEE-500ML", "VED-GHEE-1LTR"].map((sku) => {
                      const cat = VEDRO_CATALOG_OPTIONS.find((c) => c.sku === sku);
                      const prod = productList.find((p) => p.sku === sku);
                      const stock = prod ? prod.availableStock : 0;
                      return (
                        <option key={sku} value={sku}>
                          {cat?.name} — ₹{cat?.price} ({stock > 0 ? `In Stock: ${stock}` : "⚠️ OUT OF STOCK"})
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="Cold-Pressed Mustard Oil (GST 5%)">
                    {["VED-OIL-300ML", "VED-OIL-500ML", "VED-OIL-1LTR", "VED-OIL-2LTR", "VED-OIL-5LTR"].map((sku) => {
                      const cat = VEDRO_CATALOG_OPTIONS.find((c) => c.sku === sku);
                      const prod = productList.find((p) => p.sku === sku);
                      const stock = prod ? prod.availableStock : 0;
                      return (
                        <option key={sku} value={sku}>
                          {cat?.name} — ₹{cat?.price} ({stock > 0 ? `In Stock: ${stock}` : "⚠️ OUT OF STOCK"})
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="Organic Chemical-Free Jaggery (GST 5%)">
                    {["VED-JAG-500GM", "VED-JAG-1KG"].map((sku) => {
                      const cat = VEDRO_CATALOG_OPTIONS.find((c) => c.sku === sku);
                      const prod = productList.find((p) => p.sku === sku);
                      const stock = prod ? prod.availableStock : 0;
                      return (
                        <option key={sku} value={sku}>
                          {cat?.name} — ₹{cat?.price} ({stock > 0 ? `In Stock: ${stock}` : "⚠️ OUT OF STOCK"})
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>

              {/* LIVE INVENTORY STOCK MATCHING & MISMATCH NOTIFICATION BANNER */}
              {resolvedSku && selectedProduct && (
                <div className="transition-all">
                  {isOutOfStock ? (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2.5 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-bold text-rose-800 flex items-center gap-1.5">
                          <span>Out of Stock Warning (0 Units Available)</span>
                        </div>
                        <div className="mt-0.5 text-rose-700">
                          SKU <strong>{selectedProduct.sku}</strong> currently has <strong>0 units</strong> in inventory stock.
                        </div>
                        <div className="mt-1 text-[11px] text-rose-600 font-semibold">
                          Recording a sale will fail until stock is added via Buy Raw Material / Expense.
                        </div>
                      </div>
                    </div>
                  ) : isStockMismatch ? (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2.5 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-bold text-rose-800 flex items-center gap-1.5">
                          <span>Stock Mismatch Error: Insufficient Inventory</span>
                        </div>
                        <div className="mt-0.5 text-rose-700">
                          You are attempting to sell <strong>{liveQty}</strong> units, but only <strong>{availableStock}</strong> units of <strong>{selectedProduct.sku}</strong> are in stock.
                        </div>
                        <div className="mt-1 text-[11px] text-rose-600 font-semibold">
                          Deficit: {liveQty - (availableStock || 0)} units needed. Please adjust sale quantity or restock inventory.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs shadow-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-emerald-800">Inventory Stock Matched: </span>
                          <span className="font-mono font-semibold">{availableStock} units</span> available
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {(availableStock || 0) - liveQty} left after sale
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                    GST Rate *
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                    className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="0">0% (Exempt / Nil Rated)</option>
                    <option value="5">5% (Packaged Food & Cold-Pressed Oils)</option>
                    <option value="12">12% (Processed Food & Pure Desi Cow Ghee)</option>
                    <option value="18">18% (Standard Rate / Services)</option>
                    <option value="28">28% (Luxury / Specific Goods)</option>
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

              {/* Live Price & Tax Breakdown Preview */}
              <div className="bg-[#FCFAF3] p-3 rounded-xl border border-[#E8E2D5] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#77736A]">Taxable Subtotal:</span>
                  <span className="font-mono font-semibold text-[#29271F]">
                    {formatINR(liveTaxablePaise)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#77736A]">
                    GST Output Tax ({liveGstPct}%):
                  </span>
                  <span className="font-mono font-bold text-[#493020]">
                    +{formatINR(liveTaxPaise)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-[#E8E2D5] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#29271F]">
                    Calculated Total Value:
                  </span>
                  <span className="font-mono font-bold text-sm text-[#493020]">
                    {formatINR(liveTotalPaise)}
                  </span>
                </div>
              </div>

              {/* Referral Attribution */}
              <div className="bg-[#FCFAF3] p-3 rounded-lg border border-[#E8E2D5] space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#493020] uppercase tracking-wider mb-1">
                    Referral / Sale Attribution (Optional)
                  </label>
                  <select
                    value={referralOption}
                    onChange={(e) =>
                      setReferralOption(e.target.value as "NONE" | "PARTNER" | "CUSTOMER")
                    }
                    className="w-full text-xs bg-white border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="NONE">Direct / Walk-in Store (No Referral)</option>
                    <option value="PARTNER">Partner Referral (Vivek, Vineet, Varunesh)</option>
                    <option value="CUSTOMER">Customer Referral (from Customer List)</option>
                  </select>
                </div>

                {referralOption === "PARTNER" && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#493020] uppercase tracking-wider mb-1">
                      Select Referring Partner *
                    </label>
                    <select
                      value={referralPartner}
                      onChange={(e) => setReferralPartner(e.target.value)}
                      className="w-full text-xs bg-white border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                    >
                      {partnersList.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {referralOption === "CUSTOMER" && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#493020] uppercase tracking-wider mb-1">
                      Select Referring Customer (from Current Customer List) *
                    </label>
                    {customerList.length > 0 ? (
                      <select
                        value={referralCustomerName}
                        onChange={(e) => setReferralCustomerName(e.target.value)}
                        className="w-full text-xs bg-white border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                      >
                        <option value="">-- Choose Referring Customer --</option>
                        {customerList.map((c) => (
                          <option key={c.id} value={`${c.name} (${c.phone})`}>
                            {c.name} — {c.phone}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Existing Customer Name & Phone"
                        value={referralCustomerName}
                        onChange={(e) => setReferralCustomerName(e.target.value)}
                        className="w-full text-xs bg-white border border-[#E8E2D5] rounded-lg p-2 text-[#29271F] focus:outline-hidden focus:ring-1 focus:ring-[#E4BF22]"
                      />
                    )}
                  </div>
                )}
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
                  disabled={isSubmitting || Boolean(isStockMismatch || isOutOfStock)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSubmitting
                      ? "Saving & Updating Stock..."
                      : isStockMismatch
                      ? "Stock Mismatch — Cannot Save"
                      : isOutOfStock
                      ? "Out of Stock — Cannot Save"
                      : editingOrderId
                      ? "Update Order & Stock"
                      : "Record Order & Deduct Stock"}
                  </span>
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
                    Qty: {selectedDrawerOrder.quantity} • Unit Price:{" "}
                    {formatINR(selectedDrawerOrder.unitPricePaise)}
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
                      GST Tax ({selectedDrawerOrder.gstRate !== undefined ? `${selectedDrawerOrder.gstRate}%` : "5%"})
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
                    {selectedDrawerOrder.paymentMode} • Status:{" "}
                    {selectedDrawerOrder.paymentStatus}
                  </div>
                </div>

                {selectedDrawerOrder.notes && (
                  <div className="pt-3 border-t border-[#E8E2D5]">
                    <span className="text-[#77736A] block text-[10px] font-bold uppercase">
                      Referral / Remarks
                    </span>
                    <div className="font-semibold text-[#493020] text-xs mt-0.5">
                      {selectedDrawerOrder.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5] flex gap-2">
              <button
                onClick={() => {
                  handleOpenEdit(selectedDrawerOrder);
                  setSelectedDrawerOrder(null);
                }}
                className="flex-1 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-lg transition-colors shadow-xs"
              >
                Edit Order
              </button>
              <button
                onClick={() => handleDelete(selectedDrawerOrder)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedDrawerOrder(null)}
                className="px-3 py-2 text-xs font-semibold text-[#29271F] bg-[#FCFAF3] hover:bg-[#E8E2D5] rounded-lg transition-colors border border-[#E8E2D5]"
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
