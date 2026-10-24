"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  Search,
  Bell,
  Sparkles,
  Receipt,
  ShoppingCart,
  Calendar,
  Layers,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const userRole = String((user as any)?.role || "PARTNER").toUpperCase();

  const displayRole =
    userRole === "ADMIN"
      ? "Administrator"
      : userRole === "PARTNER"
      ? "Partner • Co-Founder"
      : userRole.charAt(0) + userRole.slice(1).toLowerCase();

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  // Determine current page section title
  const getPageInfo = () => {
    if (pathname === "/") return { title: "Executive Overview", category: "Operations" };
    if (pathname.startsWith("/sales")) return { title: "Sales & Orders", category: "Core Operations" };
    if (pathname.startsWith("/products")) return { title: "Products & Stock", category: "Core Operations" };
    if (pathname.startsWith("/customers")) return { title: "Customer Management", category: "Core Operations" };
    if (pathname.startsWith("/finance")) return { title: "Finance & Accounting", category: "General Ledger" };
    if (pathname.startsWith("/partners")) return { title: "Partner Capital Ledger", category: "Founders" };
    if (pathname.startsWith("/equipment")) return { title: "Equipment & Assets", category: "CapEx Register" };
    if (pathname.startsWith("/marketing")) return { title: "Marketing & Ad Spend", category: "Growth" };
    if (pathname.startsWith("/forecasts")) return { title: "Forecasts & Projections", category: "Planning" };
    if (pathname.startsWith("/reports")) return { title: "Reports & GST", category: "Compliance" };
    if (pathname.startsWith("/imports")) return { title: "Data Imports & Staging", category: "Data Ingestion" };
    if (pathname.startsWith("/settings")) return { title: "Settings & Audit", category: "Administration" };
    return { title: "Dashboard", category: "Vedro OS" };
  };

  const { title, category } = getPageInfo();

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-[#E8E2D5] px-3.5 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
      {/* Left: Mobile Logo & Breadcrumbs & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {/* Mobile-only brand badge */}
        <Link href="/" className="md:hidden shrink-0 flex items-center">
          <img
            src="/mobilevedrologo.png"
            alt="Vedro"
            className="w-8 h-8 object-contain rounded-lg transition-transform active:scale-95"
          />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden sm:inline text-[10px] font-bold text-[#77736A] uppercase tracking-wider truncate">
              {category}
            </span>
            <span className="hidden sm:inline text-[#E8E2D5] text-xs">/</span>
            <h1 className="text-xs sm:text-sm font-bold text-[#493020] leading-none truncate max-w-[140px] sm:max-w-none">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Middle: Global Quick Search Input (Desktop) */}
      <div className="hidden md:flex items-center max-w-xs w-full mx-4">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-[#77736A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders, SKUs, bills, partners..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22] text-[#29271F] placeholder-[#77736A]/70 transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Action Buttons & Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <Link
          href="/sales?action=new-order"
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl transition-all shadow-xs active:scale-[0.98]"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-[#493020]" />
          <span className="hidden xs:inline">+ Record Sale</span>
          <span className="xs:hidden">+ Sale</span>
        </Link>

        <Link
          href="/finance?action=new-entry"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] border border-[#E8E2D5] rounded-xl transition-colors"
        >
          <Receipt className="w-3.5 h-3.5 text-[#493020]" />
          <span>+ Raw Material</span>
        </Link>

        <div className="h-5 w-px bg-[#E8E2D5] mx-0.5 sm:mx-1 hidden sm:block"></div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-0.5 sm:pl-1 cursor-pointer group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#493020] text-[#E4BF22] flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-bold text-[#493020] leading-none">
              {displayName}
            </div>
            <div className="text-[10px] text-[#77736A] mt-0.5 font-medium">
              {displayRole}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#77736A] hover:text-[#B83C32] hover:bg-[#FBECEB] rounded-xl transition-colors ml-0.5"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
