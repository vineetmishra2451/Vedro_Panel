import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[#FCFAF3]">
        {/* Fixed Sidebar for Tablet & Desktop (Hidden on mobile) */}
        <Sidebar />

        {/* Main Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Header />
          
          {/* Main Content Scroll Area with Mobile Bottom Nav clearance */}
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>

          {/* Horizontal Bottom Navigation Bar (Mobile only, focused on Sales & Inventory) */}
          <MobileBottomNav />
        </div>
      </div>
    </AuthGuard>
  );
}
