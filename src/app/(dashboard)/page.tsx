"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Boxes,
  Users2,
  Megaphone,
  Plus,
  ArrowRight,
  Wallet,
  Receipt,
  FileSpreadsheet,
  Package,
  Loader2,
  Calendar,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { GlobalFilters, FilterState } from "@/components/layout/global-filters";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatINR, formatDate } from "@/lib/format";
import { getCachedData, setCachedData } from "@/lib/cache";

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

export default function OverviewDashboardPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [expenseSummary, setExpenseSummary] = useState<{
    totalExpensesPaise: number;
    totalCashOutflowPaise: number;
    categoryBreakdown: Record<string, number>;
    monthlyExpenses: Record<string, number>;
  }>({
    totalExpensesPaise: 0,
    totalCashOutflowPaise: 0,
    categoryBreakdown: {},
    monthlyExpenses: {},
  });

  const [inventoryStats, setInventoryStats] = useState<{
    totalInventoryValuePaise: number;
    totalUnitsInStock: number;
  }>({
    totalInventoryValuePaise: 0,
    totalUnitsInStock: 0,
  });

  const [partnerStats, setPartnerStats] = useState([
    { name: "Vivek", balancePaise: 0, entriesCount: 0 },
    { name: "Vineet", balancePaise: 0, entriesCount: 0 },
    { name: "Varunesh", balancePaise: 0, entriesCount: 0 },
  ]);

  const totalPartnerCapitalPaise = partnerStats.reduce(
    (acc, p) => acc + p.balancePaise,
    0
  );

  useEffect(() => {
    // 1. Immediately hydrate from cached data if available (zero loading delay)
    const cachedOrders = getCachedData<OrderRecord[]>("orders");
    if (cachedOrders && Array.isArray(cachedOrders) && cachedOrders.length > 0) {
      setOrders(cachedOrders);
      setLoading(false);
    }

    const cachedExpenses = getCachedData<any>("expenses");
    if (cachedExpenses?.summary) {
      setExpenseSummary(cachedExpenses.summary);
    }

    const cachedProducts = getCachedData<any>("products");
    if (cachedProducts) {
      if (typeof cachedProducts.totalInventoryValuePaise === "number") {
        setInventoryStats({
          totalInventoryValuePaise: cachedProducts.totalInventoryValuePaise,
          totalUnitsInStock: cachedProducts.totalUnitsInStock || 0,
        });
      } else if (Array.isArray(cachedProducts)) {
        const val = cachedProducts.reduce(
          (sum: number, p: any) => sum + (p.availableStock || 0) * (p.costPricePaise || 0),
          0
        );
        const units = cachedProducts.reduce(
          (sum: number, p: any) => sum + (p.availableStock || 0),
          0
        );
        setInventoryStats({
          totalInventoryValuePaise: val,
          totalUnitsInStock: units,
        });
      }
    }

    const cachedPartners = getCachedData<any>("partners");
    if (cachedPartners?.partnerStats) {
      setPartnerStats(
        cachedPartners.partnerStats.map((p: any) => ({
          name: p.name,
          balancePaise: p.netBalance || p.balancePaise || 0,
          entriesCount: p.entriesCount || 0,
        }))
      );
    }

    // 2. Refresh in the background (stale-while-revalidate) in parallel
    const fetchOverviewData = async () => {
      try {
        if (!cachedOrders || cachedOrders.length === 0) {
          setLoading(true);
        }

        const [ordersRes, expensesRes, productsRes, partnersRes] = await Promise.allSettled([
          fetch("/api/orders?limit=100"),
          fetch("/api/expenses?limit=100"),
          fetch("/api/products"),
          fetch("/api/partners"),
        ]);

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          const data = await ordersRes.value.json();
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
            setCachedData("orders", data.orders);
          }
        }

        if (expensesRes.status === "fulfilled" && expensesRes.value.ok) {
          const expData = await expensesRes.value.json();
          if (expData.summary) {
            setExpenseSummary(expData.summary);
          }
          setCachedData("expenses", expData);
        }

        if (productsRes.status === "fulfilled" && productsRes.value.ok) {
          const prodData = await productsRes.value.json();
          if (prodData) {
            setInventoryStats({
              totalInventoryValuePaise: prodData.totalInventoryValuePaise || 0,
              totalUnitsInStock: prodData.totalUnitsInStock || 0,
            });
            setCachedData("products", prodData);
          }
        }

        if (partnersRes.status === "fulfilled" && partnersRes.value.ok) {
          const partData = await partnersRes.value.json();
          if (Array.isArray(partData.partnerStats)) {
            setPartnerStats(
              partData.partnerStats.map((p: any) => ({
                name: p.name,
                balancePaise: p.netBalance || 0,
                entriesCount: p.entriesCount || 0,
              }))
            );
            setCachedData("partners", partData);
          }
        }
      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const [filterState, setFilterState] = useState<FilterState>({
    dateRange: "ALL",
    channel: "ALL",
    statusMode: "ALL",
    search: "",
  });

  // Filter orders according to active GlobalFilter controls
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Channel filter
      if (filterState.channel !== "ALL") {
        const lower = (o.channel || "").toLowerCase();
        if (filterState.channel === "OFFLINE" && !lower.includes("offline") && !lower.includes("store")) {
          return false;
        }
        if (filterState.channel === "WEBSITE" && !lower.includes("website") && !lower.includes("d2c")) {
          return false;
        }
        if (filterState.channel === "AMAZON" && !lower.includes("amazon")) {
          return false;
        }
        if (filterState.channel === "FLIPKART" && !lower.includes("flipkart")) {
          return false;
        }
        if (filterState.channel === "B2B" && !lower.includes("b2b") && !lower.includes("wholesale")) {
          return false;
        }
        if (filterState.channel === "EVENTS" && !lower.includes("event") && !lower.includes("pop")) {
          return false;
        }
      }

      // 2. Status filter
      if (filterState.statusMode !== "ALL") {
        if (filterState.statusMode === "PAID" && o.paymentStatus !== "PAID") return false;
        if (filterState.statusMode === "PENDING" && o.paymentStatus !== "PENDING") return false;
      }

      // 3. Date range filter
      if (filterState.dateRange !== "ALL") {
        const d = new Date(o.date);
        const now = new Date();
        if (filterState.dateRange === "THIS_MONTH") {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (filterState.dateRange === "LAST_30") {
          const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
          if (diff < 0 || diff > 30) return false;
        } else if (filterState.dateRange === "FY26-27") {
          const start = new Date(2026, 3, 1);
          const end = new Date(2027, 2, 31, 23, 59, 59);
          if (d < start || d > end) return false;
        } else if (filterState.dateRange === "Q1") {
          if (d.getMonth() < 3 || d.getMonth() > 5) return false;
        } else if (filterState.dateRange === "Q2") {
          if (d.getMonth() < 6 || d.getMonth() > 8) return false;
        } else if (filterState.dateRange === "Q3") {
          if (d.getMonth() < 9 || d.getMonth() > 11) return false;
        } else if (filterState.dateRange === "Q4") {
          if (d.getMonth() < 0 || d.getMonth() > 2) return false;
        }
      }

      // 4. Search query
      if (filterState.search && filterState.search.trim()) {
        const q = filterState.search.toLowerCase().trim();
        const match =
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
          (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
          (o.itemDescription && o.itemDescription.toLowerCase().includes(q)) ||
          (o.channel && o.channel.toLowerCase().includes(q)) ||
          (o.notes && o.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [orders, filterState]);

  // Compute live revenue and sales metrics based on filtered results
  const totalNetRevenuePaise = filteredOrders.reduce((acc, o) => acc + o.totalPaise, 0);
  const totalUnitsSold = filteredOrders.reduce((acc, o) => acc + o.quantity, 0);

  const totalRecordedExpensesPaise = expenseSummary.totalExpensesPaise || 0;
  const rawMaterialExpensesPaise =
    (expenseSummary.categoryBreakdown["5050"] || 0) +
    (expenseSummary.categoryBreakdown["1200"] || 0);

  // Profit calculation: If raw materials recorded, deduct as direct COGS; otherwise use standard 42% product margin
  const estimatedGrossProfitPaise =
    rawMaterialExpensesPaise > 0
      ? Math.max(0, totalNetRevenuePaise - rawMaterialExpensesPaise)
      : Math.round(totalNetRevenuePaise * 0.42);

  // Operating Profit: Net Revenue minus Total Recorded Expenses (or standard EBITDA margin)
  const estimatedOperatingProfitPaise =
    totalRecordedExpensesPaise > 0
      ? Math.max(0, totalNetRevenuePaise - totalRecordedExpensesPaise)
      : Math.round(totalNetRevenuePaise * 0.28);

  // Compute channel breakdown
  const channelTotals: Record<string, { count: number; totalPaise: number }> = {
    "Offline / Direct Store": { count: 0, totalPaise: 0 },
    "Website (D2C)": { count: 0, totalPaise: 0 },
    "Amazon Marketplace": { count: 0, totalPaise: 0 },
    "Flipkart Marketplace": { count: 0, totalPaise: 0 },
    "B2B Wholesale": { count: 0, totalPaise: 0 },
    "Events & Pop-ups": { count: 0, totalPaise: 0 },
  };

  filteredOrders.forEach((ord) => {
    let matchedKey = "Offline / Direct Store";
    const lowerChannel = (ord.channel || "").toLowerCase();
    if (lowerChannel.includes("website") || lowerChannel.includes("d2c")) {
      matchedKey = "Website (D2C)";
    } else if (lowerChannel.includes("amazon")) {
      matchedKey = "Amazon Marketplace";
    } else if (lowerChannel.includes("flipkart")) {
      matchedKey = "Flipkart Marketplace";
    } else if (lowerChannel.includes("b2b") || lowerChannel.includes("wholesale")) {
      matchedKey = "B2B Wholesale";
    } else if (lowerChannel.includes("event") || lowerChannel.includes("pop")) {
      matchedKey = "Events & Pop-ups";
    }
    channelTotals[matchedKey].count += 1;
    channelTotals[matchedKey].totalPaise += ord.totalPaise;
  });

  const channelsData = [
    {
      name: "Direct / Store",
      tag: "Offline",
      sales: channelTotals["Offline / Direct Store"].totalPaise,
      share:
        totalNetRevenuePaise > 0
          ? `${Math.round(
              (channelTotals["Offline / Direct Store"].totalPaise / totalNetRevenuePaise) * 100
            )}%`
          : "0%",
    },
    {
      name: "Website D2C",
      tag: "Online",
      sales: channelTotals["Website (D2C)"].totalPaise,
      share:
        totalNetRevenuePaise > 0
          ? `${Math.round(
              (channelTotals["Website (D2C)"].totalPaise / totalNetRevenuePaise) * 100
            )}%`
          : "0%",
    },
    {
      name: "Amazon India",
      tag: "Marketplace",
      sales: channelTotals["Amazon Marketplace"].totalPaise,
      share:
        totalNetRevenuePaise > 0
          ? `${Math.round(
              (channelTotals["Amazon Marketplace"].totalPaise / totalNetRevenuePaise) * 100
            )}%`
          : "0%",
    },
    {
      name: "Flipkart Grocery",
      tag: "Marketplace",
      sales: channelTotals["Flipkart Marketplace"].totalPaise,
      share:
        totalNetRevenuePaise > 0
          ? `${Math.round(
              (channelTotals["Flipkart Marketplace"].totalPaise / totalNetRevenuePaise) * 100
            )}%`
          : "0%",
    },
    {
      name: "B2B Wholesale",
      tag: "Wholesale",
      sales: channelTotals["B2B Wholesale"].totalPaise,
      share:
        totalNetRevenuePaise > 0
          ? `${Math.round(
              (channelTotals["B2B Wholesale"].totalPaise / totalNetRevenuePaise) * 100
            )}%`
          : "0%",
    },
    {
      name: "Events & Pop-ups",
      tag: "Events",
      sales: channelTotals["Events & Pop-ups"].totalPaise,
      share:
        totalNetRevenuePaise > 0
          ? `${Math.round(
              (channelTotals["Events & Pop-ups"].totalPaise / totalNetRevenuePaise) * 100
            )}%`
          : "0%",
    },
  ];

  // Map orders to FY 2026-27 months (April 2026 to March 2027)
  const fyMonths = [
    { label: "Apr 26", year: 2026, month: 3 },
    { label: "May 26", year: 2026, month: 4 },
    { label: "Jun 26", year: 2026, month: 5 },
    { label: "Jul 26", year: 2026, month: 6 },
    { label: "Aug 26", year: 2026, month: 7 },
    { label: "Sep 26", year: 2026, month: 8 },
    { label: "Oct 26", year: 2026, month: 9 },
    { label: "Nov 26", year: 2026, month: 10 },
    { label: "Dec 26", year: 2026, month: 11 },
    { label: "Jan 27", year: 2027, month: 0 },
    { label: "Feb 27", year: 2027, month: 1 },
    { label: "Mar 27", year: 2027, month: 2 },
  ];

  const monthlyData = fyMonths.map((m) => {
    const monthOrders = filteredOrders.filter((o) => {
      const d = new Date(o.date);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });

    const revRs = monthOrders.reduce((sum, o) => sum + o.totalPaise / 100, 0);
    // Real recorded monthly expense from General Ledger if present; otherwise fallback to 58% baseline
    const recordedExpRs = (expenseSummary.monthlyExpenses[m.label] || 0) / 100;
    const expRs = recordedExpRs > 0 ? recordedExpRs : Math.round(revRs * 0.58);
    const profitRs = revRs - expRs;

    return {
      month: m.label,
      revenue: revRs,
      expense: expRs,
      profit: profitRs,
    };
  });

  const maxMonthRev = Math.max(...monthlyData.map((d) => d.revenue), 1000);

  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      alert("No orders to export with current filters.");
      return;
    }
    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Sales Channel",
      "Product / SKU",
      "Quantity",
      "Unit Price (INR)",
      "Subtotal (INR)",
      "Discount (INR)",
      "Tax (INR)",
      "Total Amount (INR)",
      "Payment Mode",
      "Payment Status",
      "Notes",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.date}"`,
      `"${(o.customerName || "").replace(/"/g, '""')}"`,
      `"${o.customerPhone || ""}"`,
      `"${o.channel || ""}"`,
      `"${(o.itemDescription || "").replace(/"/g, '""')}"`,
      o.quantity,
      (o.unitPricePaise / 100).toFixed(2),
      (o.subtotalPaise / 100).toFixed(2),
      (o.discountPaise / 100).toFixed(2),
      (o.taxPaise / 100).toFixed(2),
      (o.totalPaise / 100).toFixed(2),
      `"${o.paymentMode}"`,
      `"${o.paymentStatus}"`,
      `"${(o.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vedro_orders_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inventoryHealthItems = [
    {
      sku: "VED-GHEE-500ML",
      name: "Pure A2 Desi Cow Bilona Ghee 500ml",
      category: "Dairy & Clarified Butter",
      stock: 0,
      reorderLevel: 30,
      unit: "JAR",
      costPaise: 55000,
    },
    {
      sku: "VED-OIL-1LTR",
      name: "Cold-Pressed Kachi Ghani Mustard Oil 1 Litre",
      category: "Edible Oils & Fats",
      stock: 0,
      reorderLevel: 40,
      unit: "BOTTLE",
      costPaise: 17500,
    },
    {
      sku: "VED-JAG-1KG",
      name: "Natural Chemical-Free Organic Jaggery 1kg",
      category: "Natural Sweeteners & Jaggery",
      stock: 0,
      reorderLevel: 40,
      unit: "POUCH",
      costPaise: 8000,
    },
    {
      sku: "VED-OIL-5LTR",
      name: "Cold-Pressed Kachi Ghani Mustard Oil 5 Litre",
      category: "Edible Oils & Fats",
      stock: 0,
      reorderLevel: 20,
      unit: "TIN",
      costPaise: 82000,
    },
    {
      sku: "VED-GHEE-1LTR",
      name: "Pure A2 Desi Cow Bilona Ghee 1 Litre",
      category: "Dairy & Clarified Butter",
      stock: 0,
      reorderLevel: 20,
      unit: "JAR",
      costPaise: 105000,
    },
  ];

  const rawMatTotal =
    (expenseSummary.categoryBreakdown["5050"] || 0) +
    (expenseSummary.categoryBreakdown["1200"] || 0);
  const packTotal =
    (expenseSummary.categoryBreakdown["5100"] || 0) +
    (expenseSummary.categoryBreakdown["1210"] || 0);
  const mfgTotal = expenseSummary.categoryBreakdown["5400"] || 0;
  const freightTotal = expenseSummary.categoryBreakdown["5300"] || 0;
  const marketingTotal = expenseSummary.categoryBreakdown["5200"] || 0;
  const generalTotal = expenseSummary.categoryBreakdown["5600"] || 0;

  const totalCatExpenses =
    rawMatTotal + packTotal + mfgTotal + freightTotal + marketingTotal + generalTotal;

  const expenseCategories = [
    {
      name: "Raw Materials & Seeds",
      amountPaise: rawMatTotal,
      share: totalCatExpenses > 0 ? `${Math.round((rawMatTotal / totalCatExpenses) * 100)}%` : "0%",
      color: "#E4BF22",
      code: "5050",
    },
    {
      name: "Packaging & Glass Bottles",
      amountPaise: packTotal,
      share: totalCatExpenses > 0 ? `${Math.round((packTotal / totalCatExpenses) * 100)}%` : "0%",
      color: "#7D8654",
      code: "5100",
    },
    {
      name: "Equipment & Maintenance",
      amountPaise: mfgTotal,
      share: totalCatExpenses > 0 ? `${Math.round((mfgTotal / totalCatExpenses) * 100)}%` : "0%",
      color: "#493020",
      code: "5400",
    },
    {
      name: "Inward Freight & Logistics",
      amountPaise: freightTotal,
      share: totalCatExpenses > 0 ? `${Math.round((freightTotal / totalCatExpenses) * 100)}%` : "0%",
      color: "#A96B13",
      code: "5300",
    },
    {
      name: "Marketing & Performance Ads",
      amountPaise: marketingTotal,
      share: totalCatExpenses > 0 ? `${Math.round((marketingTotal / totalCatExpenses) * 100)}%` : "0%",
      color: "#28764A",
      code: "5200",
    },
    {
      name: "General & Warehouse Overheads",
      amountPaise: generalTotal,
      share: totalCatExpenses > 0 ? `${Math.round((generalTotal / totalCatExpenses) * 100)}%` : "0%",
      color: "#77736A",
      code: "5600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#493020]">
          Overview
        </h2>
        <p className="text-xs text-[#77736A] mt-0.5">
          Real-time financial performance, live sales orders, and operating health.
        </p>
      </div>

      {/* 2. Global Filter Controls */}
      <GlobalFilters
        onFilterChange={setFilterState}
        showExport={true}
        onExport={handleExportCsv}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
      />

      {/* 3. Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiCard
          title="Net Revenue"
          value={totalNetRevenuePaise}
          format="currency"
          drillDownHref="/sales"
          icon={<TrendingUp className="w-4 h-4" />}
          subtext={
            filteredOrders.length === orders.length
              ? `${orders.length} recorded orders`
              : `${filteredOrders.length} of ${orders.length} orders`
          }
        />

        <KpiCard
          title="Gross Profit"
          value={estimatedGrossProfitPaise}
          format="currency"
          drillDownHref="/finance"
          icon={<IndianRupee className="w-4 h-4" />}
          subtext="Estimated 42% product margin"
        />

        <KpiCard
          title="Operating Profit"
          value={estimatedOperatingProfitPaise}
          format="currency"
          drillDownHref="/finance"
          icon={<Receipt className="w-4 h-4" />}
          subtext="EBITDA contribution"
        />

        <KpiCard
          title="Inventory Value"
          value={inventoryStats.totalInventoryValuePaise}
          format="currency"
          drillDownHref="/products"
          icon={<Boxes className="w-4 h-4" />}
          subtext={
            inventoryStats.totalUnitsInStock > 0
              ? `${inventoryStats.totalUnitsInStock.toLocaleString()} units in warehouse`
              : "Finished goods stock"
          }
        />

        <KpiCard
          title="Cash & Bank"
          value={Math.max(0, totalNetRevenuePaise - (expenseSummary.totalCashOutflowPaise || 0))}
          format="currency"
          drillDownHref="/finance"
          icon={<Wallet className="w-4 h-4" />}
          subtext="Net liquid cash (inflow - outflow)"
        />
      </div>

      {/* 4. Secondary Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiCard
          title="Partner Capital"
          value={totalPartnerCapitalPaise}
          format="currency"
          drillDownHref="/partners"
          icon={<Users2 className="w-4 h-4" />}
          subtext="Vivek + Vineet + Varunesh"
        />

        <KpiCard
          title="Units Sold"
          value={totalUnitsSold}
          format="number"
          drillDownHref="/sales"
          icon={<Package className="w-4 h-4" />}
          subtext="Across Ghee, Oil & Jaggery"
        />

        <KpiCard
          title="Ad Spend"
          value={0}
          format="currency"
          drillDownHref="/marketing"
          icon={<Megaphone className="w-4 h-4" />}
          subtext="Meta & Google campaigns"
        />
      </div>

      {/* 5. Main Analytics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Performance Chart, Sales by Channel & Expenses */}
        <div className="lg:col-span-7 space-y-5">
          {/* A. Business Performance Chart */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#E8E2D5] gap-2">
              <div className="min-w-0">
                <h4 className="font-bold text-[#493020] text-sm truncate sm:overflow-visible">
                  Business Performance (FY 2026–27)
                </h4>
                <p className="text-[11px] text-[#77736A] mt-0.5">
                  Monthly revenue & estimated margins
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-[#493020]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E4BF22]"></span>
                  <span>Revenue</span>
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#493020]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#493020]"></span>
                  <span>Expenses</span>
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#28764A]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28764A]"></span>
                  <span>Profit</span>
                </span>
              </div>
            </div>

            {/* Visual Analytics Representation */}
            <div className="mt-4 pt-2 overflow-x-auto pb-2 scrollbar-thin">
              <div className="h-56 min-w-[320px] w-full flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-2 border-b border-[#E8E2D5] pb-2">
                {monthlyData.map((d) => {
                  const revHeightPct =
                    d.revenue > 0
                      ? `${Math.max(12, Math.round((d.revenue / maxMonthRev) * 85))}%`
                      : "4px";
                  const expHeightPct =
                    d.expense > 0
                      ? `${Math.max(8, Math.round((d.expense / maxMonthRev) * 85))}%`
                      : "4px";
                  const profitHeightPct =
                    d.profit > 0
                      ? `${Math.max(6, Math.round((d.profit / maxMonthRev) * 85))}%`
                      : "4px";

                  return (
                    <div
                      key={d.month}
                      className="flex-1 flex flex-col items-center gap-1 group cursor-pointer min-w-0"
                    >
                      <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-44">
                        {/* Revenue Bar */}
                        <div
                          className="w-1.5 sm:w-2.5 bg-[#E4BF22] rounded-t transition-all group-hover:brightness-90"
                          style={{ height: revHeightPct }}
                          title={`${d.month} Revenue: ₹${d.revenue.toLocaleString("en-IN")}`}
                        />
                        {/* Expense Bar */}
                        <div
                          className="w-1.5 sm:w-2.5 bg-[#493020] rounded-t transition-all group-hover:brightness-90"
                          style={{ height: expHeightPct }}
                          title={`${d.month} Expenses: ₹${d.expense.toLocaleString("en-IN")}`}
                        />
                        {/* Profit Bar */}
                        <div
                          className="w-1.5 sm:w-2.5 bg-[#28764A] rounded-t transition-all group-hover:brightness-90"
                          style={{ height: profitHeightPct }}
                          title={`${d.month} Profit: ₹${d.profit.toLocaleString("en-IN")}`}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-[#77736A] tracking-tighter truncate">
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* B. Live Sales & Orders Stream (Reflecting all recorded sales) */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#493020]" />
                <h4 className="font-bold text-[#493020] text-sm">
                  Recent Sales & Orders ({filteredOrders.length})
                </h4>
              </div>
              <Link
                href="/sales"
                className="text-xs font-bold text-[#493020] hover:text-[#A96B13] hover:underline flex items-center gap-1"
              >
                All Orders <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-[#77736A]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#E4BF22]" />
                <p className="text-xs">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-[#77736A]">
                <p className="text-xs">
                  {orders.length === 0
                    ? "No sales recorded yet."
                    : "No orders match the current filter criteria."}
                </p>
                {orders.length === 0 ? (
                  <Link
                    href="/sales?action=new-order"
                    className="mt-2 inline-block text-xs font-bold text-[#493020] underline"
                  >
                    + Record first sale
                  </Link>
                ) : (
                  <button
                    onClick={() =>
                      setFilterState({
                        dateRange: "ALL",
                        channel: "ALL",
                        statusMode: "ALL",
                        search: "",
                      })
                    }
                    className="mt-2 inline-block text-xs font-bold text-[#493020] underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#E8E2D5] mt-2">
                {filteredOrders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#493020]">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-[#77736A]">
                          {formatDate(ord.date)}
                        </span>
                      </div>
                      <div className="text-[#29271F] font-medium truncate mt-0.5">
                        {ord.customerName} • {ord.itemDescription} (Qty: {ord.quantity})
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-[#493020]">
                        {formatINR(ord.totalPaise)}
                      </div>
                      <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#F2EBD8] text-[#493020] border border-[#493020]/20">
                        {ord.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* C. Sales by Channel */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="font-bold text-[#493020] text-sm">
                Sales by Channel
              </h4>
              <Link
                href="/sales"
                className="text-xs font-bold text-[#493020] hover:text-[#A96B13] hover:underline flex items-center gap-1"
              >
                Manage Sales <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {channelsData.map((ch) => (
                <div
                  key={ch.name}
                  className="bg-[#FCFAF3] p-3 rounded-xl border border-[#E8E2D5] hover:border-[#E4BF22] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] text-[#77736A]">
                    <span className="truncate font-semibold">{ch.tag}</span>
                    <span className="font-mono font-bold text-[#493020]">{ch.share}</span>
                  </div>
                  <div className="font-bold text-xs text-[#29271F] mt-1 truncate">
                    {ch.name}
                  </div>
                  <div className="text-sm font-bold text-[#493020] mt-1.5 tabular-nums font-mono">
                    <MoneyDisplay paise={ch.sales} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. Expenses by Category */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="font-bold text-[#493020] text-sm">
                Expenses by Category
              </h4>
              <Link
                href="/finance"
                className="text-xs font-bold text-[#493020] hover:text-[#A96B13] hover:underline flex items-center gap-1"
              >
                General Ledger <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.code}
                  className="p-2.5 rounded-xl bg-[#FCFAF3] border border-[#E8E2D5] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-md shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <span className="font-bold text-[#29271F]">{cat.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[#493020]">
                      {formatINR(cat.amountPaise)}
                    </div>
                    <span className="text-[10px] text-[#77736A]">{cat.share}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Partner Capital Snapshot & Stock Alerts */}
        <div className="lg:col-span-5 space-y-5">
          {/* A. Partner Capital Snapshot */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-[#493020]" />
                <h4 className="font-bold text-[#493020] text-sm">
                  Partner Capital
                </h4>
              </div>
              <Link
                href="/partners"
                className="text-xs font-bold text-[#493020] hover:text-[#A96B13] hover:underline"
              >
                Capital Ledger →
              </Link>
            </div>

            <div className="space-y-2.5 mt-3.5">
              {partnerStats.map((p) => (
                <div
                  key={p.name}
                  className="p-3 rounded-xl bg-[#FCFAF3] border border-[#E8E2D5] flex items-center justify-between hover:border-[#E4BF22] transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-[#493020]">
                      {p.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#493020] tabular-nums font-mono">
                      <MoneyDisplay paise={p.balancePaise} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#E8E2D5] flex items-center justify-between text-xs">
              <span className="font-bold text-[#77736A]">Total Capital</span>
              <span className="font-mono font-bold text-base text-[#493020] tabular-nums">
                <MoneyDisplay paise={totalPartnerCapitalPaise} />
              </span>
            </div>

            <div className="mt-3">
              <Link
                href="/partners?action=add-capital"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] rounded-xl border border-[#E8E2D5] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Inject Partner Capital</span>
              </Link>
            </div>
          </div>

          {/* B. Stock Alerts */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#493020]" />
                <h4 className="font-bold text-[#493020] text-sm">
                  Stock Alerts
                </h4>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-[#493020] hover:text-[#A96B13] hover:underline"
              >
                Stock Room →
              </Link>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              {inventoryHealthItems.map((item) => (
                <div
                  key={item.sku}
                  className="p-3 rounded-xl bg-[#FCFAF3] border border-[#E8E2D5] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] font-bold text-[#493020]">
                      {item.sku}
                    </div>
                    <div className="font-semibold text-xs text-[#29271F] truncate mt-0.5">
                      {item.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FBECEB] text-[#B83C32] border border-[#F4C4C0]">
                      0 on hand
                    </span>
                    <div className="text-[10px] text-[#77736A] mt-1 font-mono">
                      Cost: {formatINR(item.costPaise)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3.5">
              <Link
                href="/products"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#493020]" />
                <span>+ Receive Stock Inward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
