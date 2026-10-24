"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Users2,
  ShoppingCart,
  Boxes,
  Megaphone,
  Wrench,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  UploadCloud,
  Settings,
  Receipt,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { VedroLogo } from "@/components/shared/vedro-logo";

interface NavGroup {
  group: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    group: "Core Operations",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard },
      { name: "Sales & Orders", href: "/sales", icon: ShoppingCart },
      { name: "Products & Stock", href: "/products", icon: Boxes },
      { name: "Customers", href: "/customers", icon: UserCheck },
    ],
  },
  {
    group: "Finance & Capital",
    items: [
      { name: "Finance & Ledger", href: "/finance", icon: Landmark },
      { name: "Partner Capital", href: "/partners", icon: Users2, badge: "3 Partners" },
      { name: "Equipment & Assets", href: "/equipment", icon: Wrench },
      { name: "Reports & GST", href: "/reports", icon: FileSpreadsheet },
    ],
  },
  {
    group: "Growth & Planning",
    items: [
      { name: "Marketing & Ads", href: "/marketing", icon: Megaphone },
      { name: "Forecasts", href: "/forecasts", icon: TrendingUp },
    ],
  },
  {
    group: "System & Compliance",
    items: [
      { name: "Data Imports", href: "/imports", icon: UploadCloud },
      { name: "Settings & Audit", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#493020] text-[#FCFAF3] shrink-0 min-h-screen border-r border-[#3b2619] select-none transition-all duration-200">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center border-b border-[#3b2619]">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <VedroLogo variant="dark" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {NAVIGATION_GROUPS.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-[#E8E2D5]/50 uppercase tracking-wider">
              {group.group}
            </div>

            {group.items.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#E4BF22] text-[#493020] shadow-sm font-bold"
                      : "text-[#FCFAF3]/80 hover:bg-[#3b2619] hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-[#493020]"
                        : "text-[#E8E2D5]/70 group-hover:text-white"
                    }`}
                  />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isActive
                          ? "bg-[#493020] text-[#E4BF22]"
                          : "bg-[#2F1E14] text-[#E4BF22] border border-[#E4BF22]/20"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
