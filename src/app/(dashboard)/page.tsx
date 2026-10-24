"use client";

import React, { useState, useEffect } from "react";
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
import { GlobalFilters } from "@/components/layout/global-filters";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatINR, formatDate } from "@/lib/format";

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

  const [partnerStats] = useState([
    { name: "Vivek", balancePaise: 0, entriesCount: 0 },
    { name: "Vineet", balancePaise: 0, entriesCount: 0 },
    { name: "Varunesh", balancePaise: 0, entriesCount: 0 },
  ]);

  const totalPartnerCapitalPaise = partnerStats.reduce(
    (acc, p) => acc + p.balancePaise,
    0
  );

  useEffect(() => {
    const fetchDashboardOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
        }
      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardOrders();
  }, []);

  // Compute live revenue and sales metrics
  const totalNetRevenuePaise = orders.reduce((acc, o) => acc + o.totalPaise, 0);
  const totalUnitsSold = orders.reduce((acc, o) => acc + o.quantity, 0);
  const estimatedGrossProfitPaise = Math.round(totalNetRevenuePaise * 0.42);
  const estimatedOperatingProfitPaise = Math.round(totalNetRevenuePaise * 0.28);

  // Compute channel breakdown
  const channelTotals: Record<string, { count: number; totalPaise: number }> = {
    "Offline / Direct Store": { count: 0, totalPaise: 0 },
    "Website (D2C)": { count: 0, totalPaise: 0 },
    "Amazon Marketplace": { count: 0, totalPaise: 0 },
    "Flipkart Marketplace": { count: 0, totalPaise: 0 },
    "B2B Wholesale": { count: 0, totalPaise: 0 },
    "Events & Pop-ups": { count: 0, totalPaise: 0 },
  };

  orders.forEach((ord) => {
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
    const monthOrders = orders.filter((o) => {
      const d = new Date(o.date);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });

    const revRs = monthOrders.reduce((sum, o) => sum + o.totalPaise / 100, 0);
    const expRs = Math.round(revRs * 0.58);
    const profitRs = Math.round(revRs * 0.42);

    return {
      month: m.label,
      revenue: revRs,
      expense: expRs,
      profit: profitRs,
    };
  });

  const maxMonthRev = Math.max(...monthlyData.map((d) => d.revenue), 1000);

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

  const expenseCategories = [
    { name: "Raw Materials & Seeds", share: "0%", color: "#E4BF22", code: "5050" },
    { name: "Packaging & Glass Bottles", share: "0%", color: "#7D8654", code: "5100" },
    { name: "Cold-Pressing & Manufacturing", share: "0%", color: "#493020", code: "5130" },
    { name: "Inward Freight & Logistics", share: "0%", color: "#A96B13", code: "5300" },
    { name: "Marketing & Performance Ads", share: "0%", color: "#28764A", code: "5200" },
    { name: "General & Warehouse Overheads", share: "0%", color: "#77736A", code: "5600" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#493020]">
            Overview
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Real-time financial performance, live sales orders, and operating health.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/sales?action=new-order"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl transition-all shadow-xs active:scale-[0.99]"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#493020]" />
            <span>+ Record Sale</span>
          </Link>

          <Link
            href="/finance?action=new-entry"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] border border-[#E8E2D5] rounded-xl transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-[#493020]" />
            <span>+ Buy Raw Material</span>
          </Link>

          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#29271F] bg-white hover:bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#77736A]" />
            <span>Reports</span>
          </Link>
        </div>
      </div>

      {/* 2. Global Filter Controls */}
      <GlobalFilters />

      {/* 3. Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiCard
          title="Net Revenue"
          value={totalNetRevenuePaise}
          format="currency"
          drillDownHref="/sales"
          icon={<TrendingUp className="w-4 h-4" />}
          subtext={`${orders.length} recorded orders`}
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
          value={0}
          format="currency"
          drillDownHref="/products"
          icon={<Boxes className="w-4 h-4" />}
          subtext="Finished goods stock"
        />

        <KpiCard
          title="Cash & Bank"
          value={totalNetRevenuePaise}
          format="currency"
          drillDownHref="/finance"
          icon={<Wallet className="w-4 h-4" />}
          subtext="Real-time cash & UPI inflow"
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
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#E8E2D5] gap-2">
              <div>
                <h4 className="font-bold text-[#493020] text-sm">
                  Business Performance (FY 2026–27)
                </h4>
                <p className="text-[11px] text-[#77736A] mt-0.5">
                  Monthly revenue & estimated margins
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-xs">
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
            <div className="mt-4 pt-2">
              <div className="h-56 w-full flex items-end justify-between gap-2 px-2 border-b border-[#E8E2D5] pb-2">
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
                      className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        {/* Revenue Bar */}
                        <div
                          className="w-2 sm:w-2.5 bg-[#E4BF22] rounded-t transition-all group-hover:brightness-90"
                          style={{ height: revHeightPct }}
                          title={`${d.month} Revenue: ₹${d.revenue.toLocaleString("en-IN")}`}
                        />
                        {/* Expense Bar */}
                        <div
                          className="w-2 sm:w-2.5 bg-[#493020] rounded-t transition-all group-hover:brightness-90"
                          style={{ height: expHeightPct }}
                          title={`${d.month} Expenses: ₹${d.expense.toLocaleString("en-IN")}`}
                        />
                        {/* Profit Bar */}
                        <div
                          className="w-2 sm:w-2.5 bg-[#28764A] rounded-t transition-all group-hover:brightness-90"
                          style={{ height: profitHeightPct }}
                          title={`${d.month} Profit: ₹${d.profit.toLocaleString("en-IN")}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-[#77736A] tracking-tighter truncate">
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
                  Recent Sales & Orders ({orders.length})
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
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-[#77736A]">
                <p className="text-xs">No sales recorded yet.</p>
                <Link
                  href="/sales?action=new-order"
                  className="mt-2 inline-block text-xs font-bold text-[#493020] underline"
                >
                  + Record first sale
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E2D5] mt-2">
                {orders.slice(0, 5).map((ord) => (
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
                    <div className="font-mono font-bold text-[#493020]">₹0.00</div>
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
