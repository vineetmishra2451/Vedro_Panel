"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Plus,
  Landmark,
  Menu,
  X,
  Users2,
  Wrench,
  UserCheck,
  FileSpreadsheet,
  Megaphone,
  TrendingUp,
  Settings,
  UploadCloud,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { VedroLogo } from "@/components/shared/vedro-logo";

interface MobileBottomNavProps {
  onOpenMobileMenu?: () => void;
}

export function MobileBottomNav({ onOpenMobileMenu }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  const isHomeActive = pathname === "/";
  const isSalesActive = pathname.startsWith("/sales");
  const isInventoryActive = pathname.startsWith("/products");
  const isFinanceActive = pathname.startsWith("/finance");

  const moreNavItems = [
    { name: "Partner Capital", href: "/partners", icon: Users2, badge: "3 Partners" },
    { name: "Customer Directory", href: "/customers", icon: UserCheck },
    { name: "Equipment & Assets", href: "/equipment", icon: Wrench },
    { name: "Reports & GST", href: "/reports", icon: FileSpreadsheet },
    { name: "Marketing & Ads", href: "/marketing", icon: Megaphone },
    { name: "Forecasts & Projections", href: "/forecasts", icon: TrendingUp },
    { name: "Data Imports & Staging", href: "/imports", icon: UploadCloud },
    { name: "Settings & Audit Log", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* 1. Fixed Bottom Horizontal Navigation Bar (Mobile Only: < md) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D5] px-2 py-1.5 md:hidden shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around gap-1 max-w-lg mx-auto">
          {/* Tab 1: Overview */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
              isHomeActive
                ? "text-[#493020] font-bold"
                : "text-[#77736A] hover:text-[#29271F]"
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isHomeActive ? "bg-[#F2EBD8] text-[#493020]" : ""
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Overview</span>
          </Link>

          {/* Tab 2: Sales & Orders (PRIMARY FOCUS) */}
          <Link
            href="/sales"
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
              isSalesActive
                ? "text-[#493020] font-bold"
                : "text-[#77736A] hover:text-[#493020]"
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                isSalesActive
                  ? "bg-[#E4BF22] text-[#493020] shadow-xs scale-105"
                  : "bg-[#F2EBD8]/50 text-[#493020] border border-[#E8E2D5]"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight ${
                isSalesActive ? "font-bold text-[#493020]" : "font-semibold text-[#493020]"
              }`}
            >
              Sales
            </span>
          </Link>

          {/* Tab 3: Central Primary Action (Record Sale Quick CTA) */}
          <Link
            href="/sales?action=new-order"
            className="flex flex-col items-center justify-center -mt-5 flex-1 group"
            title="Record New Sale"
          >
            <div className="w-12 h-12 rounded-full bg-[#E4BF22] text-[#493020] flex items-center justify-center shadow-md border-2 border-white group-active:scale-95 transition-transform">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-[#493020] mt-1 tracking-tight">
              + Sale
            </span>
          </Link>

          {/* Tab 4: Products & Inventory (PRIMARY FOCUS) */}
          <Link
            href="/products"
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
              isInventoryActive
                ? "text-[#493020] font-bold"
                : "text-[#77736A] hover:text-[#493020]"
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                isInventoryActive
                  ? "bg-[#E4BF22] text-[#493020] shadow-xs scale-105"
                  : "bg-[#F2EBD8]/50 text-[#493020] border border-[#E8E2D5]"
              }`}
            >
              <Boxes className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight ${
                isInventoryActive ? "font-bold text-[#493020]" : "font-semibold text-[#493020]"
              }`}
            >
              Inventory
            </span>
          </Link>

          {/* Tab 5: Finance & More Drawer */}
          <button
            type="button"
            onClick={() => setIsMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
              isFinanceActive || isMoreDrawerOpen
                ? "text-[#493020] font-bold"
                : "text-[#77736A] hover:text-[#29271F]"
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isFinanceActive || isMoreDrawerOpen
                  ? "bg-[#F2EBD8] text-[#493020]"
                  : ""
              }`}
            >
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* 2. Slide-up "More Modules" Bottom Sheet / Drawer for Mobile */}
      {isMoreDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#493020]/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreDrawerOpen(false)}
          />
          <div className="bg-white rounded-t-3xl border-t border-[#E8E2D5] shadow-2xl relative z-10 max-h-[85vh] flex flex-col overflow-hidden">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-[#E8E2D5] mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <VedroLogo variant="light" size="sm" />
                <span className="text-xs font-bold text-[#493020]">All Business Modules</span>
              </div>
              <button
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-1 rounded-lg text-[#77736A] hover:text-[#29271F] bg-[#FCFAF3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Direct Links */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Primary Shortcuts */}
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/finance"
                  onClick={() => setIsMoreDrawerOpen(false)}
                  className="p-3 rounded-2xl bg-[#FCFAF3] border border-[#E8E2D5] flex items-center gap-2.5 hover:border-[#E4BF22]"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#F2EBD8] text-[#493020] flex items-center justify-center font-bold">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#493020]">Finance & Ledger</div>
                    <div className="text-[10px] text-[#77736A]">Double-Entry</div>
                  </div>
                </Link>

                <Link
                  href="/partners"
                  onClick={() => setIsMoreDrawerOpen(false)}
                  className="p-3 rounded-2xl bg-[#FCFAF3] border border-[#E8E2D5] flex items-center gap-2.5 hover:border-[#E4BF22]"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#F2EBD8] text-[#493020] flex items-center justify-center font-bold">
                    <Users2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#493020]">Partner Capital</div>
                    <div className="text-[10px] text-[#77736A]">3 Partners</div>
                  </div>
                </Link>
              </div>

              {/* All Secondary Modules */}
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-bold text-[#77736A] uppercase tracking-wider px-1 pb-1">
                  Operations & Compliance
                </div>
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreDrawerOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-[#E4BF22] text-[#493020] font-bold"
                          : "text-[#29271F] hover:bg-[#FCFAF3]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-[#493020]" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F2EBD8] text-[#493020]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
