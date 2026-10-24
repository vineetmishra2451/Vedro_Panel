"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Building,
  Users,
  Percent,
  FileText,
  Key,
  Lock,
} from "lucide-react";

export default function SettingsAuditPage() {
  const [activeTab, setActiveTab] = useState<"company" | "users" | "tax" | "audit">("company");

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Administration & RBAC
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              Non-Deletable Audit Trail
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Settings & Audit Control
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Company legal profile, GSTIN parameters, team roles, tax codes, and immutable system event logs.
          </p>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-[#E8E2D5] gap-6 text-xs">
        <button
          onClick={() => setActiveTab("company")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "company"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Company Legal Profile
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "users"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Users & Permissions
        </button>
        <button
          onClick={() => setActiveTab("tax")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "tax"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          GST Rates & HSN Slabs
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "audit"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Immutable Audit Log
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === "company" && (
        <div className="bg-white border border-[#E8E2D5] rounded-xl p-5 shadow-xs max-w-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
            <h3 className="font-bold text-[#29271F] text-sm">
              Business Registration Details
            </h3>
            <span className="text-[10px] font-semibold text-[#493020] bg-[#F2EBD8]/60 px-2 py-0.5 rounded border border-[#493020]/20">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#77736A] block text-[10px] font-bold uppercase mb-1">
                Company Legal Name
              </span>
              <span className="font-bold text-[#29271F] text-sm">
                Vedro Food Products
              </span>
            </div>
            <div>
              <span className="text-[#77736A] block text-[10px] font-bold uppercase mb-1">
                GSTIN Number
              </span>
              <span className="font-mono font-bold text-[#29271F] text-sm">
                27AAAAA0000A1Z5
              </span>
            </div>
            <div>
              <span className="text-[#77736A] block text-[10px] font-bold uppercase mb-1">
                Structure
              </span>
              <span className="font-semibold text-[#29271F]">
                Equal Partnership (3 Designated Partners)
              </span>
            </div>
            <div>
              <span className="text-[#77736A] block text-[10px] font-bold uppercase mb-1">
                Financial Year Cycle
              </span>
              <span className="font-semibold text-[#29271F]">
                April 1 – March 31 (Indian Standard)
              </span>
            </div>
            <div>
              <span className="text-[#77736A] block text-[10px] font-bold uppercase mb-1">
                Designated Partners
              </span>
              <span className="font-semibold text-[#29271F]">
                Vivek, Vineet, Varunesh
              </span>
            </div>
            <div>
              <span className="text-[#77736A] block text-[10px] font-bold uppercase mb-1">
                Opening Balance Status
              </span>
              <span className="font-bold text-[#493020]">
                Strictly ₹0.00
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users & Roles */}
      {activeTab === "users" && (
        <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 bg-[#FCFAF3] border-b border-[#E8E2D5] flex items-center justify-between text-xs font-bold text-[#77736A]">
            <span>Active Team Members</span>
            <span>Role-Based Access Control</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-[#77736A] uppercase bg-[#FCFAF3]/40 border-b border-[#E8E2D5]">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
              <tr>
                <td className="px-5 py-3.5 font-bold">Vedro Administrator</td>
                <td className="px-5 py-3.5 text-[#77736A] font-mono">admin@vedro.com</td>
                <td className="px-5 py-3.5">
                  <span className="bg-[#F2EBD8]/60 text-[#493020] border border-[#493020]/20 px-2 py-0.5 rounded font-bold text-[10px]">
                    ADMIN
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-[#493020]">Active</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Tax Codes */}
      {activeTab === "tax" && (
        <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 bg-[#FCFAF3] border-b border-[#E8E2D5] text-xs font-bold text-[#77736A]">
            Configured GST Slabs (Effective 2026-04-01)
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-[#77736A] uppercase bg-[#FCFAF3]/40 border-b border-[#E8E2D5]">
              <tr>
                <th className="px-5 py-3">Tax Slab</th>
                <th className="px-5 py-3">CGST</th>
                <th className="px-5 py-3">SGST</th>
                <th className="px-5 py-3">IGST</th>
                <th className="px-5 py-3">Classification Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
              <tr>
                <td className="px-5 py-3 font-bold">GST 0%</td>
                <td className="px-5 py-3 font-mono">0.0%</td>
                <td className="px-5 py-3 font-mono">0.0%</td>
                <td className="px-5 py-3 font-mono">0.0%</td>
                <td className="px-5 py-3 text-[#77736A]">Exempt staples & raw grains</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-bold">GST 5%</td>
                <td className="px-5 py-3 font-mono">2.5%</td>
                <td className="px-5 py-3 font-mono">2.5%</td>
                <td className="px-5 py-3 font-mono">5.0%</td>
                <td className="px-5 py-3 text-[#77736A]">Standard packaged food products</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-bold">GST 12%</td>
                <td className="px-5 py-3 font-mono">6.0%</td>
                <td className="px-5 py-3 font-mono">6.0%</td>
                <td className="px-5 py-3 font-mono">12.0%</td>
                <td className="px-5 py-3 text-[#77736A]">Ready-to-eat & processed preparations</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-bold">GST 18%</td>
                <td className="px-5 py-3 font-mono">9.0%</td>
                <td className="px-5 py-3 font-mono">9.0%</td>
                <td className="px-5 py-3 font-mono">18.0%</td>
                <td className="px-5 py-3 text-[#77736A]">Specialty packaging, confectionery & logistics</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Audit Log */}
      {activeTab === "audit" && (
        <div className="bg-white border border-[#E8E2D5] rounded-xl p-8 shadow-xs text-center text-[#77736A]">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2.5 text-[#493020]" />
          <h4 className="font-bold text-[#29271F] text-sm">Immutable Audit Log Active</h4>
          <p className="text-xs text-[#77736A] max-w-md mx-auto mt-1 leading-relaxed">
            Every user action, capital introduction, status transition, and database record write is cryptographically referenced and permanently stored. Audit history cannot be altered or removed from the application interface.
          </p>
        </div>
      )}
    </div>
  );
}
