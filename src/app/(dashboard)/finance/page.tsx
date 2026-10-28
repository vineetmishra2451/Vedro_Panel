"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  FileCheck2,
  AlertCircle,
  FileText,
  Filter,
  Download,
  CheckCircle2,
  X,
  Search,
  Receipt,
  Scale,
  Trash2,
  HelpCircle,
  Building,
  CreditCard,
  Layers,
  Boxes,
  Loader2,
  Users2,
} from "lucide-react";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDate, rupeesToPaise } from "@/lib/format";
import { getCachedData, setCachedData, clearCachedData } from "@/lib/cache";

interface AccountItem {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  balancePaise: number;
}

interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  type: "DEBIT" | "CREDIT";
  amountRupees: string;
  memo: string;
}

interface JournalRecord {
  id: string;
  date: string;
  reference: string;
  narration: string;
  category?: string;
  totalPaise: number;
  status: "POSTED" | "DRAFT";
  lines: {
    accountCode: string;
    accountName: string;
    type: "DEBIT" | "CREDIT";
    amountPaise: number;
    memo?: string;
  }[];
  supplierName?: string;
  createdBy: string;
  createdAt: string;
}

const INITIAL_ACCOUNTS: AccountItem[] = [
  { code: "1000", name: "Bank Account (Current)", type: "ASSET", balancePaise: 0 },
  { code: "1010", name: "Cash in Hand", type: "ASSET", balancePaise: 0 },
  { code: "1020", name: "UPI Collections Account", type: "ASSET", balancePaise: 0 },
  { code: "1100", name: "Accounts Receivable (Debtors)", type: "ASSET", balancePaise: 0 },
  { code: "1200", name: "Raw Materials & Ingredients Stock", type: "ASSET", balancePaise: 0 },
  { code: "1210", name: "Packaging Materials Stock", type: "ASSET", balancePaise: 0 },
  { code: "1220", name: "Finished Goods Inventory", type: "ASSET", balancePaise: 0 },
  { code: "1500", name: "Equipment & Machinery", type: "ASSET", balancePaise: 0 },
  { code: "2000", name: "Accounts Payable (Suppliers/Creditors)", type: "LIABILITY", balancePaise: 0 },
  { code: "2100", name: "GST Output Payable", type: "LIABILITY", balancePaise: 0 },
  { code: "2200", name: "Partner Loan Accounts", type: "LIABILITY", balancePaise: 0 },
  { code: "3010", name: "Partner Capital - Vivek", type: "EQUITY", balancePaise: 0 },
  { code: "3020", name: "Partner Capital - Vineet", type: "EQUITY", balancePaise: 0 },
  { code: "3030", name: "Partner Capital - Varunesh", type: "EQUITY", balancePaise: 0 },
  { code: "4000", name: "Sales Revenue (Food Products)", type: "REVENUE", balancePaise: 0 },
  { code: "5000", name: "Cost of Goods Sold (COGS)", type: "EXPENSE", balancePaise: 0 },
  { code: "5050", name: "Raw Material Purchases (Direct Expense)", type: "EXPENSE", balancePaise: 0 },
  { code: "5100", name: "Packaging & Boxes", type: "EXPENSE", balancePaise: 0 },
  { code: "5200", name: "Marketing & Advertising", type: "EXPENSE", balancePaise: 0 },
  { code: "5300", name: "Freight & Delivery (Inward/Outward)", type: "EXPENSE", balancePaise: 0 },
  { code: "5400", name: "Equipment Maintenance", type: "EXPENSE", balancePaise: 0 },
  { code: "5600", name: "General & Administrative", type: "EXPENSE", balancePaise: 0 },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"accounts" | "journals" | "reconciliation">("accounts");
  const [accounts, setAccounts] = useState<AccountItem[]>(INITIAL_ACCOUNTS);
  const [journals, setJournals] = useState<JournalRecord[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJournalDrawer, setSelectedJournalDrawer] = useState<JournalRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoBanner, setShowInfoBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal mode: "quick_expense" for user-friendly raw material/goods buying vs "manual_journal" for full double-entry
  const [modalMode, setModalMode] = useState<"quick_expense" | "manual_journal">("quick_expense");

  // Hydrate from client cache immediately, then fetch backend in background (stale-while-revalidate)
  useEffect(() => {
    // 1. Instant hydration
    const cachedExpenses = getCachedData<any>("expenses");
    if (cachedExpenses) {
      if (Array.isArray(cachedExpenses.journals) && cachedExpenses.journals.length > 0) {
        setJournals(cachedExpenses.journals);
      }
      if (Array.isArray(cachedExpenses.accounts) && cachedExpenses.accounts.length > 0) {
        setAccounts(cachedExpenses.accounts);
      }
    }

    const cachedProducts = getCachedData<any>("products");
    if (cachedProducts) {
      if (Array.isArray(cachedProducts.products) && cachedProducts.products.length > 0) {
        setAvailableProducts(cachedProducts.products);
      } else if (Array.isArray(cachedProducts) && cachedProducts.length > 0) {
        setAvailableProducts(cachedProducts);
      }
    }

    // 2. Fetch fresh expenses & accounts from database
    const loadExpenses = async () => {
      try {
        const res = await fetch("/api/expenses?limit=100");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.journals)) {
            setJournals(data.journals);
          }
          if (Array.isArray(data.accounts) && data.accounts.length > 0) {
            setAccounts(data.accounts);
          }
          setCachedData("expenses", data);
        }
      } catch (err) {
        console.error("Failed to load expenses:", err);
      }
    };

    // 3. Fetch products catalog for the SKU selector
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products)) {
            setAvailableProducts(data.products);
          }
          setCachedData("products", data);
        }
      } catch (err) {
        console.error("Failed to load products for inventory linkage:", err);
      }
    };

    loadExpenses();
    loadProducts();
  }, []);

  // React to ?action=new-entry or quick URL actions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new-entry") {
        setModalMode("quick_expense");
        setIsModalOpen(true);
      }
    }
  }, []);

  // --- Quick Expense / Purchase Form State ---
  const [quickForm, setQuickForm] = useState({
    date: new Date().toISOString().split("T")[0],
    expenseType: "raw_materials_direct", // raw_materials_direct, packaging, finished_goods, freight, marketing, general
    customDebitAccount: "5050",
    supplierName: "",
    invoiceRef: "",
    paymentAccount: "1000", // 1000 Bank, 1010 Cash, 1020 UPI, 2000 Accounts Payable (Credit)
    paidByPartner: "", // "" | "Vivek" | "Vineet" | "Varunesh"
    amountRupees: "",
    taxSlab: "5", // 0, 5, 12, 18
    narration: "",
    // Inventory SKU Linkage
    sku: "",
    quantity: "",
    unitCostRupees: "",
    updateInventory: true,
  });

  // --- Manual Journal Form State ---
  const [manualDate, setManualDate] = useState("2026-04-15");
  const [manualRef, setManualRef] = useState("");
  const [manualNarration, setManualNarration] = useState("");
  const [manualLines, setManualLines] = useState<JournalLine[]>([
    {
      id: "line-1",
      accountCode: "5050",
      accountName: "Raw Material Purchases (Direct Expense)",
      type: "DEBIT",
      amountRupees: "",
      memo: "Raw material procurement",
    },
    {
      id: "line-2",
      accountCode: "1000",
      accountName: "Bank Account (Current)",
      type: "CREDIT",
      amountRupees: "",
      memo: "Bank transfer payment",
    },
  ]);

  const [formError, setFormError] = useState("");

  // Map expense types to default Debit Account
  const getDebitAccountForExpenseType = (type: string) => {
    switch (type) {
      case "raw_materials_direct":
        return { code: "5050", name: "Raw Material Purchases (Direct Expense)" };
      case "raw_materials_inventory":
        return { code: "1200", name: "Raw Materials & Ingredients Stock (Asset)" };
      case "packaging":
        return { code: "5100", name: "Packaging & Boxes" };
      case "packaging_inventory":
        return { code: "1210", name: "Packaging Materials Stock (Asset)" };
      case "finished_goods":
        return { code: "1220", name: "Finished Goods Inventory (Asset)" };
      case "freight":
        return { code: "5300", name: "Freight & Delivery (Inward/Outward)" };
      case "marketing":
        return { code: "5200", name: "Marketing & Advertising" };
      case "maintenance":
        return { code: "5400", name: "Equipment Maintenance" };
      default:
        return { code: "5600", name: "General & Administrative" };
    }
  };

  // Helper to find account name by code
  const getAccountName = (code: string) => {
    return accounts.find((a) => a.code === code)?.name || "Account " + code;
  };

  // Quick form calculations
  const quickAmount = parseFloat(quickForm.amountRupees) || 0;
  const quickDebitInfo = getDebitAccountForExpenseType(quickForm.expenseType);
  const quickCreditCode = quickForm.paidByPartner
    ? quickForm.paidByPartner === "Vivek"
      ? "3010"
      : quickForm.paidByPartner === "Vineet"
      ? "3020"
      : "3030"
    : quickForm.paymentAccount;
  const quickCreditName = quickForm.paidByPartner
    ? `Partner Capital - ${quickForm.paidByPartner} (Equity)`
    : getAccountName(quickForm.paymentAccount);

  // Manual form calculations
  const totalDebit = manualLines
    .filter((l) => l.type === "DEBIT")
    .reduce((sum, l) => sum + (parseFloat(l.amountRupees) || 0), 0);
  const totalCredit = manualLines
    .filter((l) => l.type === "CREDIT")
    .reduce((sum, l) => sum + (parseFloat(l.amountRupees) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && totalCredit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  // Add line to manual journal
  const handleAddManualLine = () => {
    const newLine: JournalLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      accountCode: "1000",
      accountName: getAccountName("1000"),
      type: "DEBIT",
      amountRupees: "",
      memo: "",
    };
    setManualLines([...manualLines, newLine]);
  };

  // Remove line from manual journal
  const handleRemoveManualLine = (id: string) => {
    if (manualLines.length <= 2) {
      setFormError("A double-entry journal requires at least 2 lines (Debit and Credit).");
      return;
    }
    setManualLines(manualLines.filter((l) => l.id !== id));
  };

  // Update line field
  const handleUpdateManualLine = (
    id: string,
    field: "accountCode" | "type" | "amountRupees" | "memo",
    value: string
  ) => {
    setManualLines(
      manualLines.map((line) => {
        if (line.id !== id) return line;
        if (field === "accountCode") {
          return {
            ...line,
            accountCode: value,
            accountName: getAccountName(value),
          };
        }
        return { ...line, [field]: value };
      })
    );
  };

  // Submit Quick Expense Entry
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (quickAmount <= 0) {
      setFormError("Please enter a valid amount greater than ₹0.");
      return;
    }

    if (!quickForm.supplierName.trim() && quickForm.paymentAccount === "2000") {
      setFormError("Supplier / Vendor name is required when booking on vendor credit (Accounts Payable).");
      return;
    }

    if (quickForm.sku && (!quickForm.quantity || parseInt(quickForm.quantity) <= 0)) {
      setFormError("Please enter a valid quantity bought for the selected SKU.");
      return;
    }

    setSubmitting(true);
    try {
      const narration =
        quickForm.narration.trim() ||
        `${quickDebitInfo.name} from ${quickForm.supplierName || "Vendor"} (Ref: ${
          quickForm.invoiceRef || "Direct"
        })${quickForm.sku ? ` [SKU: ${quickForm.sku}, Qty: ${quickForm.quantity}]` : ""}`;

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: quickForm.date,
          expenseType: quickForm.expenseType,
          customDebitAccount: quickDebitInfo.code,
          supplierName: quickForm.supplierName,
          invoiceRef: quickForm.invoiceRef,
          paymentAccount: quickForm.paidByPartner ? undefined : quickForm.paymentAccount,
          paidByPartner: quickForm.paidByPartner || undefined,
          amountRupees: quickForm.amountRupees,
          taxSlab: quickForm.taxSlab,
          narration,
          sku: quickForm.sku || undefined,
          quantity: quickForm.sku ? parseInt(quickForm.quantity) : undefined,
          unitCostRupees: quickForm.unitCostRupees || undefined,
          updateInventory: quickForm.updateInventory,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to record expense");
      }

      const data = await res.json();
      const refNumber = data.reference || quickForm.invoiceRef || `EXP-${Date.now().toString().slice(-6)}`;
      const amountPaise = rupeesToPaise(quickAmount);

      const newJournal: JournalRecord = {
        id: data.transaction?.id || `jrn-${Date.now()}`,
        date: quickForm.date,
        reference: refNumber,
        narration,
        category: quickDebitInfo.name,
        supplierName: quickForm.supplierName.trim() || undefined,
        totalPaise: amountPaise,
        status: "POSTED",
        lines: [
          {
            accountCode: quickDebitInfo.code,
            accountName: quickDebitInfo.name,
            type: "DEBIT",
            amountPaise,
            memo: `Expense/Purchase: ${quickForm.supplierName || "Vendor"}`,
          },
          {
            accountCode: quickCreditCode,
            accountName: quickCreditName,
            type: "CREDIT",
            amountPaise,
            memo: quickForm.paidByPartner
              ? `Paid by Partner ${quickForm.paidByPartner} (Added to Capital)`
              : quickForm.paymentAccount === "2000"
              ? "Supplier credit payable"
              : "Settled via payment",
          },
        ],
        createdBy: "Finance Manager",
        createdAt: new Date().toISOString(),
      };

      // Update Account Balances in ledger
      const updatedAccounts = accounts.map((acc) => {
        if (acc.code === quickDebitInfo.code) {
          return { ...acc, balancePaise: acc.balancePaise + amountPaise };
        }
        if (acc.code === quickCreditCode) {
          if (acc.type === "LIABILITY" || acc.type === "EQUITY") {
            return { ...acc, balancePaise: acc.balancePaise + amountPaise };
          } else {
            return { ...acc, balancePaise: acc.balancePaise - amountPaise };
          }
        }
        return acc;
      });

      const updatedJournals = [newJournal, ...journals];
      setAccounts(updatedAccounts);
      setJournals(updatedJournals);

      // Save to client cache
      setCachedData("expenses", {
        journals: updatedJournals,
        accounts: updatedAccounts,
      });

      // Clear/refresh products and partners cache so Overview and Partners pages immediately reflect
      clearCachedData("products");
      if (quickForm.paidByPartner) {
        clearCachedData("partners");
      }

      // Also update local availableProducts if SKU was restocked
      if (quickForm.sku && quickForm.quantity) {
        const addedQty = parseInt(quickForm.quantity);
        setAvailableProducts((prev) =>
          prev.map((p) =>
            p.sku === quickForm.sku
              ? {
                  ...p,
                  availableStock: p.availableStock + addedQty,
                  valuationPaise: (p.availableStock + addedQty) * p.costPricePaise,
                }
              : p
          )
        );
      }

      setIsModalOpen(false);
      setActiveTab("journals");
      setSuccessMessage(
        `Purchase Voucher ${refNumber} posted successfully!${
          quickForm.paidByPartner
            ? ` Credited ₹${quickAmount.toLocaleString("en-IN")} to ${quickForm.paidByPartner}'s partner capital.`
            : ""
        }${
          quickForm.sku && quickForm.quantity
            ? ` Auto-updated inventory: +${quickForm.quantity} units of ${quickForm.sku}.`
            : ""
        }`
      );

      // Reset quick form
      setQuickForm({
        date: new Date().toISOString().split("T")[0],
        expenseType: "raw_materials_direct",
        customDebitAccount: "5050",
        supplierName: "",
        invoiceRef: "",
        paymentAccount: "1000",
        paidByPartner: "",
        amountRupees: "",
        taxSlab: "5",
        narration: "",
        sku: "",
        quantity: "",
        unitCostRupees: "",
        updateInventory: true,
      });
    } catch (err: any) {
      console.error("Expense submit error:", err);
      setFormError(err.message || "Failed to post expense entry.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Manual Double-Entry Journal
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!isBalanced) {
      setFormError(
        `Journal entry is out of balance by ₹${difference.toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2 }
        )}. Total Debits must strictly equal Total Credits before posting.`
      );
      return;
    }

    if (!manualNarration.trim()) {
      setFormError("Please enter a journal narration / explanation.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: manualDate,
          invoiceRef: manualRef,
          narration: manualNarration,
          lines: manualLines,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to record manual journal");
      }

      const data = await res.json();
      const refNumber = data.reference || manualRef.trim() || `JRN-${Date.now().toString().slice(-6)}`;
      const totalPaise = rupeesToPaise(totalDebit);

      const formattedLines = manualLines.map((l) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        type: l.type,
        amountPaise: rupeesToPaise(parseFloat(l.amountRupees) || 0),
        memo: l.memo.trim() || undefined,
      }));

      const newJournal: JournalRecord = {
        id: data.transaction?.id || `jrn-${Date.now()}`,
        date: manualDate,
        reference: refNumber,
        narration: manualNarration.trim(),
        totalPaise,
        status: "POSTED",
        lines: formattedLines,
        createdBy: "Finance Manager",
        createdAt: new Date().toISOString(),
      };

      // Update balances
      const updatedAccounts = [...accounts];
      formattedLines.forEach((line) => {
        const idx = updatedAccounts.findIndex((a) => a.code === line.accountCode);
        if (idx !== -1) {
          const acc = updatedAccounts[idx];
          if (line.type === "DEBIT") {
            if (acc.type === "ASSET" || acc.type === "EXPENSE") {
              updatedAccounts[idx] = { ...acc, balancePaise: acc.balancePaise + line.amountPaise };
            } else {
              updatedAccounts[idx] = { ...acc, balancePaise: acc.balancePaise - line.amountPaise };
            }
          } else {
            // CREDIT
            if (acc.type === "LIABILITY" || acc.type === "EQUITY" || acc.type === "REVENUE") {
              updatedAccounts[idx] = { ...acc, balancePaise: acc.balancePaise + line.amountPaise };
            } else {
              updatedAccounts[idx] = { ...acc, balancePaise: acc.balancePaise - line.amountPaise };
            }
          }
        }
      });

      const updatedJournals = [newJournal, ...journals];
      setAccounts(updatedAccounts);
      setJournals(updatedJournals);

      setCachedData("expenses", {
        journals: updatedJournals,
        accounts: updatedAccounts,
      });

      setIsModalOpen(false);
      setActiveTab("journals");
      setSuccessMessage(
        `Balanced double-entry journal ${newJournal.reference} posted successfully (₹${totalDebit.toLocaleString(
          "en-IN"
        )}).`
      );

      // Reset manual form
      setManualRef("");
      setManualNarration("");
      setManualLines([
        {
          id: "line-1",
          accountCode: "5050",
          accountName: getAccountName("5050"),
          type: "DEBIT",
          amountRupees: "",
          memo: "Raw material procurement",
        },
        {
          id: "line-2",
          accountCode: "1000",
          accountName: getAccountName("1000"),
          type: "CREDIT",
          amountRupees: "",
          memo: "Bank transfer payment",
        },
      ]);
    } catch (err: any) {
      console.error("Manual journal error:", err);
      setFormError(err.message || "Failed to post manual journal.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJournals = journals.filter(
    (j) =>
      j.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.narration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.supplierName && j.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              General Ledger & Audit
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              FY 2026–27 • Debits Equal Credits
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#29271F]">
            Finance & Accounting
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Double-entry journals, chart of accounts, raw material procurement bills, and immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalMode("quick_expense");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] rounded-lg transition-colors border border-[#493020]/20 shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-[#493020]" />
            <span>+ Buy Raw Material / Expense</span>
          </button>
          <button
            onClick={() => {
              setModalMode("manual_journal");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* 2. Success Alert */}
      {successMessage && (
        <div className="bg-[#F2EBD8]/50 border border-[#493020]/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-[#493020]">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#493020] shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-[#77736A] hover:text-[#29271F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Guide & Safeguard Notice: Where to record raw material and inventory purchases */}
      {showInfoBanner && (
        <div className="bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl p-4 text-xs text-[#29271F] shadow-xs relative">
          <button
            onClick={() => setShowInfoBanner(false)}
            className="absolute top-3 right-3 text-[#77736A] hover:text-[#29271F]"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#493020] mt-0.5 shrink-0" />
            <div className="space-y-1.5 leading-relaxed pr-6">
              <div className="font-bold text-[#493020] text-sm">
                Where to record Raw Material & Inventory Purchases?
              </div>
              <p>
                In Vedro, purchasing raw materials (spices, grains, oil), packaging materials, and products is tracked in <strong>two connected places</strong>:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-[11px]">
                <div className="bg-white p-2.5 rounded-lg border border-[#E8E2D5]">
                  <strong className="text-[#493020] block mb-0.5">1. Financial Ledger (Here in Finance)</strong>
                  Use <strong>+ Buy Raw Material / Expense</strong> or <strong>+ New Journal Entry</strong> to record the vendor bill/voucher.
                  Debits increase your expense (<code>5050 - Raw Materials</code>) or asset inventory (<code>1200 - Raw Material Stock</code>), while Credits represent the payment outflow (<code>1000 - Bank</code>) or credit liability (<code>2000 - Accounts Payable</code>).
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E8E2D5]">
                  <strong className="text-[#493020] block mb-0.5">2. Physical Stock Receipt (Products & Inventory)</strong>
                  Visit <a href="/products" className="text-[#493020] font-semibold underline">Products & Inventory</a> &gt; <em>Stock Movements</em> to log the physical inward quantity received from the supplier. This automatically increases available stock counts and reorder alerts.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Navigation Tabs */}
      <div className="flex border-b border-[#E8E2D5] gap-6 text-xs">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "accounts"
              ? "border-[#E4BF22] text-[#493020]"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Chart of Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab("journals")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "journals"
              ? "border-[#E4BF22] text-[#493020]"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Journal Entries & Invoices ({journals.length})
        </button>
        <button
          onClick={() => setActiveTab("reconciliation")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "reconciliation"
              ? "border-[#E4BF22] text-[#493020]"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Bank & Cash Reconciliation
        </button>
      </div>

      {/* Tab 1: Chart of Accounts */}
      {activeTab === "accounts" && (
        <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 bg-[#FCFAF3] border-b border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#77736A] uppercase tracking-wider text-[10px]">
              Account Classification Hierarchy • Double-Entry Ledger
            </span>
            <span className="text-[11px] text-[#77736A]">
              Opening Balances: Strictly ₹0.00 (FY 2026–27)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFAF3]/50 border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Account Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Current Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
                {accounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-[#FCFAF3]/80 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-[#493020]">
                      {acc.code}
                    </td>
                    <td className="px-5 py-3 font-semibold flex items-center gap-2">
                      <span>{acc.name}</span>
                      {["1200", "1210", "5050", "5100"].includes(acc.code) && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#F2EBD8] text-[#493020] rounded font-bold">
                          Food / Raw Material
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          acc.type === "ASSET"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : acc.type === "LIABILITY"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : acc.type === "EQUITY"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : acc.type === "REVENUE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold tabular-nums">
                      <MoneyDisplay paise={acc.balancePaise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Journal Entries */}
      {activeTab === "journals" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-[#77736A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference, supplier, or narration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setModalMode("quick_expense");
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Purchase / Expense</span>
              </button>
            </div>
          </div>

          {journals.length === 0 ? (
            <div className="bg-white border border-[#E8E2D5] rounded-xl p-12 text-center text-[#77736A] shadow-xs">
              <FileCheck2 className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
              <h4 className="font-bold text-[#29271F] text-sm">No Journal Entries Recorded Yet</h4>
              <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
                Click "+ Record Purchase / Expense" to log raw material bills, supplier payments, or custom double-entry journals. Debits and credits are verified automatically.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setModalMode("quick_expense");
                    setIsModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg transition-colors shadow-xs"
                >
                  + Buy Raw Material / Expense
                </button>
                <button
                  onClick={() => {
                    setModalMode("manual_journal");
                    setIsModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] rounded-lg transition-colors border border-[#493020]/20 shadow-xs"
                >
                  + Custom Journal Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCFAF3] border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Reference / ID</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Narration / Vendor</th>
                      <th className="px-5 py-3">Lines Breakdown</th>
                      <th className="px-5 py-3 text-right">Total Amount (₹)</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
                    {filteredJournals.map((j) => (
                      <tr key={j.id} className="hover:bg-[#FCFAF3]/80 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-[#493020]">
                          {j.reference}
                        </td>
                        <td className="px-5 py-3 text-[#77736A] font-mono">
                          {formatDate(j.date)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold">{j.narration}</div>
                          {j.supplierName && (
                            <div className="text-[10px] text-[#77736A]">
                              Vendor: {j.supplierName}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[11px] text-[#77736A]">
                          <div className="space-y-0.5">
                            {j.lines.map((l, idx) => (
                              <div key={idx} className="font-mono text-[10px]">
                                <span className={l.type === "DEBIT" ? "text-emerald-700 font-bold" : "text-blue-700 font-bold"}>
                                  {l.type}
                                </span>{" "}
                                {l.accountCode} ({l.accountName.split("(")[0]}) : ₹{(l.amountPaise / 100).toLocaleString("en-IN")}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold tabular-nums">
                          <MoneyDisplay paise={j.totalPaise} />
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F2EBD8] text-[#493020] border border-[#493020]/20">
                            {j.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => setSelectedJournalDrawer(j)}
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

      {/* Tab 3: Bank Reconciliation */}
      {activeTab === "reconciliation" && (
        <div className="bg-white border border-[#E8E2D5] rounded-xl p-12 text-center text-[#77736A] shadow-xs">
          <ArrowRightLeft className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
          <h4 className="font-bold text-[#29271F] text-sm">Bank & UPI Statement Matching</h4>
          <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
            Import monthly bank CSV feeds to compare statement balances against system ledger records and highlight unreconciled variances.
          </p>
        </div>
      )}

      {/* 5. Create Journal / Purchase Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#29271F] leading-tight">
                  {modalMode === "quick_expense"
                    ? "Record Purchase / Expense Voucher"
                    : "Create Double-Entry Journal"}
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  FY 2026–27 • Ledger posting with balanced debit and credit
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError("");
                }}
                className="text-[#77736A] hover:text-[#29271F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="mt-4 flex bg-[#FCFAF3] p-1 rounded-lg border border-[#E8E2D5] text-xs">
              <button
                type="button"
                onClick={() => {
                  setModalMode("quick_expense");
                  setFormError("");
                }}
                className={`flex-1 py-1.5 font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  modalMode === "quick_expense"
                    ? "bg-white text-[#493020] shadow-xs"
                    : "text-[#77736A] hover:text-[#29271F]"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Quick Expense / Purchase (Raw Materials & Bills)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode("manual_journal");
                  setFormError("");
                }}
                className={`flex-1 py-1.5 font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  modalMode === "manual_journal"
                    ? "bg-white text-[#493020] shadow-xs"
                    : "text-[#77736A] hover:text-[#29271F]"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Custom Double-Entry Journal (Accounting)</span>
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* A. Quick Expense / Purchase Form */}
            {modalMode === "quick_expense" && (
              <form onSubmit={handleQuickSubmit} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#77736A] font-semibold mb-1">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={quickForm.date}
                      onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#77736A] font-semibold mb-1">
                      Purchase / Expense Type *
                    </label>
                    <select
                      value={quickForm.expenseType}
                      onChange={(e) => setQuickForm({ ...quickForm, expenseType: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    >
                      <option value="raw_materials_direct">
                        Raw Materials & Ingredients (Direct Expense - 5050)
                      </option>
                      <option value="raw_materials_inventory">
                        Raw Materials Bulk Stock (Asset Inventory - 1200)
                      </option>
                      <option value="packaging">
                        Packaging Materials & Pouches (Direct Expense - 5100)
                      </option>
                      <option value="packaging_inventory">
                        Packaging Supplies Stock (Asset Inventory - 1210)
                      </option>
                      <option value="finished_goods">
                        Finished Products (Ready Inventory - 1220)
                      </option>
                      <option value="freight">
                        Freight & Transport (Inward Logistics - 5300)
                      </option>
                      <option value="marketing">
                        Marketing & Performance Ads (5200)
                      </option>
                      <option value="maintenance">
                        Equipment Maintenance & Spares (5400)
                      </option>
                      <option value="general">
                        General, Office & Admin (5600)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Inventory SKU Linkage Section */}
                <div className="p-3 bg-[#FCFAF3] rounded-xl border border-[#E8E2D5] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-[#493020]" />
                      <label className="text-xs font-bold text-[#493020]">
                        Link to Product SKU / Stock Restock (Optional)
                      </label>
                    </div>
                    <span className="text-[10px] text-[#77736A]">
                      Auto-increments inventory & stock value
                    </span>
                  </div>

                  <div>
                    <select
                      value={quickForm.sku}
                      onChange={(e) => {
                        const selectedSku = e.target.value;
                        const foundProd = availableProducts.find((p) => p.sku === selectedSku);
                        const unitCost = foundProd ? (foundProd.costPricePaise / 100).toString() : "";
                        setQuickForm((prev) => {
                          const next = { ...prev, sku: selectedSku };
                          if (foundProd) {
                            next.unitCostRupees = unitCost;
                            if (next.quantity) {
                              const total = (parseFloat(next.quantity) * parseFloat(unitCost)).toFixed(2);
                              if (!isNaN(parseFloat(total)) && parseFloat(total) > 0) {
                                next.amountRupees = total;
                              }
                            }
                          }
                          return next;
                        });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    >
                      <option value="">-- No Product SKU (General Raw Material / Non-SKU Bill) --</option>
                      <optgroup label="Dairy & Clarified Butter (Ghee)">
                        <option value="VED-GHEE-250ML">Pure A2 Desi Cow Bilona Ghee 250ml (VED-GHEE-250ML)</option>
                        <option value="VED-GHEE-500ML">Pure A2 Desi Cow Bilona Ghee 500ml (VED-GHEE-500ML)</option>
                        <option value="VED-GHEE-1LTR">Pure A2 Desi Cow Bilona Ghee 1 Litre (VED-GHEE-1LTR)</option>
                      </optgroup>
                      <optgroup label="Edible Oils & Fats (Mustard Oil)">
                        <option value="VED-OIL-300ML">Cold-Pressed Mustard Oil 300ml (VED-OIL-300ML)</option>
                        <option value="VED-OIL-500ML">Cold-Pressed Mustard Oil 500ml (VED-OIL-500ML)</option>
                        <option value="VED-OIL-1LTR">Cold-Pressed Mustard Oil 1 Litre (VED-OIL-1LTR)</option>
                        <option value="VED-OIL-2LTR">Cold-Pressed Mustard Oil 2 Litre (VED-OIL-2LTR)</option>
                        <option value="VED-OIL-5LTR">Cold-Pressed Mustard Oil 5 Litre (VED-OIL-5LTR)</option>
                      </optgroup>
                      <optgroup label="Natural Sweeteners & Jaggery">
                        <option value="VED-JAG-500GM">Natural Organic Jaggery 500g (VED-JAG-500GM)</option>
                        <option value="VED-JAG-1KG">Natural Organic Jaggery 1kg (VED-JAG-1KG)</option>
                      </optgroup>
                    </select>
                  </div>

                  {quickForm.sku && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[#77736A] font-semibold mb-1 text-[11px]">
                          Quantity Bought ({availableProducts.find((p) => p.sku === quickForm.sku)?.unit || "Units"}) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 50"
                          value={quickForm.quantity}
                          onChange={(e) => {
                            const q = e.target.value;
                            setQuickForm((prev) => {
                              const next = { ...prev, quantity: q };
                              if (next.unitCostRupees && q) {
                                const total = (parseFloat(q) * parseFloat(next.unitCostRupees)).toFixed(2);
                                if (!isNaN(parseFloat(total)) && parseFloat(total) > 0) {
                                  next.amountRupees = total;
                                }
                              }
                              return next;
                            });
                          }}
                          className="w-full px-3 py-1.5 font-mono font-bold bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#77736A] font-semibold mb-1 text-[11px]">
                          Unit Cost Price (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 550"
                          value={quickForm.unitCostRupees}
                          onChange={(e) => {
                            const u = e.target.value;
                            setQuickForm((prev) => {
                              const next = { ...prev, unitCostRupees: u };
                              if (next.quantity && u) {
                                const total = (parseFloat(next.quantity) * parseFloat(u)).toFixed(2);
                                if (!isNaN(parseFloat(total)) && parseFloat(total) > 0) {
                                  next.amountRupees = total;
                                }
                              }
                              return next;
                            });
                          }}
                          className="w-full px-3 py-1.5 font-mono bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between bg-white p-2 rounded-lg border border-[#E8E2D5]">
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#493020] font-semibold">
                          <input
                            type="checkbox"
                            checked={quickForm.updateInventory}
                            onChange={(e) => setQuickForm({ ...quickForm, updateInventory: e.target.checked })}
                            className="rounded text-[#493020] focus:ring-[#E4BF22]"
                          />
                          <span>Auto-update stock count in inventory & valuation</span>
                        </label>
                        {(() => {
                          const p = availableProducts.find((item) => item.sku === quickForm.sku);
                          const currentStock = p?.availableStock || 0;
                          const added = parseInt(quickForm.quantity) || 0;
                          return (
                            <span className="text-[10px] text-[#77736A]">
                              Stock: <strong>{currentStock}</strong> {p?.unit || "units"}
                              {added > 0 && (
                                <span className="text-emerald-700 font-bold ml-1">
                                  -&gt; {currentStock + added}
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#77736A] font-semibold mb-1">
                      Supplier / Vendor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Organic Spice Farms Ltd"
                      value={quickForm.supplierName}
                      onChange={(e) => setQuickForm({ ...quickForm, supplierName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#77736A] font-semibold mb-1">
                      Invoice / Bill Ref #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INV-9824 or PO-001"
                      value={quickForm.invoiceRef}
                      onChange={(e) => setQuickForm({ ...quickForm, invoiceRef: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[#77736A] font-semibold mb-1">
                      Total Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 12500"
                      value={quickForm.amountRupees}
                      onChange={(e) => setQuickForm({ ...quickForm, amountRupees: e.target.value })}
                      className="w-full px-3 py-1.5 font-mono font-bold bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[#77736A] font-semibold mb-1">
                      Paid By / Payment Mode *
                    </label>
                    <select
                      value={quickForm.paidByPartner ? `partner_${quickForm.paidByPartner}` : quickForm.paymentAccount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("partner_")) {
                          const partner = val.replace("partner_", "");
                          setQuickForm({
                            ...quickForm,
                            paidByPartner: partner,
                            paymentAccount: partner === "Vivek" ? "3010" : partner === "Vineet" ? "3020" : "3030",
                          });
                        } else {
                          setQuickForm({
                            ...quickForm,
                            paidByPartner: "",
                            paymentAccount: val,
                          });
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    >
                      <optgroup label="Company Business Accounts (Standard Outflow)">
                        <option value="1000">Bank Account (Current) - Paid via NetBanking/Cheque</option>
                        <option value="1020">UPI Collections Account - Paid via Company UPI</option>
                        <option value="1010">Cash in Hand - Paid via Company Cash</option>
                        <option value="2000">Accounts Payable (Unpaid / Vendor Credit)</option>
                      </optgroup>
                      <optgroup label="Paid Out-of-Pocket by Partner (Adds to Partner Capital)">
                        <option value="partner_Vivek">Paid by Partner: Vivek (Adds to Vivek's Capital)</option>
                        <option value="partner_Vineet">Paid by Partner: Vineet (Adds to Vineet's Capital)</option>
                        <option value="partner_Varunesh">Paid by Partner: Varunesh (Adds to Varunesh's Capital)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {quickForm.paidByPartner && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-[#493020] flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-[#A96B13] shrink-0" />
                    <span>
                      <strong>Partner Capital Contribution:</strong> Paid by <strong>{quickForm.paidByPartner}</strong> from personal funds. This ₹{quickAmount.toLocaleString("en-IN")} will automatically be credited to <strong>{quickForm.paidByPartner}</strong>'s capital balance and reflect on the Partners page.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Narration / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bought 50kg cumin seed & 20kg turmeric for batch #04"
                    value={quickForm.narration}
                    onChange={(e) => setQuickForm({ ...quickForm, narration: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                {/* Live Double-Entry Preview Box */}
                <div className="p-3 bg-[#FCFAF3] rounded-lg border border-[#E8E2D5] text-[11px] space-y-1.5">
                  <div className="font-bold text-[#77736A] uppercase text-[10px] tracking-wider flex items-center justify-between">
                    <span>Double-Entry Verification</span>
                    <span className="text-[#493020] font-bold">✓ Self-Balancing</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-emerald-700">
                      <strong>DEBIT (Dr):</strong> {quickDebitInfo.code} - {quickDebitInfo.name}
                    </span>
                    <span className="font-bold">₹{quickAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-blue-700">
                      <strong>CREDIT (Cr):</strong> {quickCreditCode} - {quickCreditName}
                    </span>
                    <span className="font-bold">₹{quickAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 font-semibold text-[#77736A] hover:text-[#29271F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-semibold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? "Posting..." : "Post Purchase Voucher"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* B. Manual Double-Entry Journal Form */}
            {modalMode === "manual_journal" && (
              <form onSubmit={handleManualSubmit} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#77736A] font-semibold mb-1">
                      Journal Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#77736A] font-semibold mb-1">
                      Journal Reference #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. JRN-2026-001"
                      value={manualRef}
                      onChange={(e) => setManualRef(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Journal Narration / Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Allocation of raw material purchase to production batch #1"
                    value={manualNarration}
                    onChange={(e) => setManualNarration(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>

                {/* Dynamic Lines Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[#77736A] font-bold uppercase text-[10px] tracking-wider">
                      Journal Lines ({manualLines.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddManualLine}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#493020] hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Line</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {manualLines.map((line, index) => (
                      <div
                        key={line.id}
                        className="p-2.5 bg-[#FCFAF3] rounded-lg border border-[#E8E2D5] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                      >
                        <div className="w-24">
                          <select
                            value={line.type}
                            onChange={(e) =>
                              handleUpdateManualLine(
                                line.id,
                                "type",
                                e.target.value as "DEBIT" | "CREDIT"
                              )
                            }
                            className={`w-full px-2 py-1.5 rounded-md font-bold text-xs ${
                              line.type === "DEBIT"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-blue-100 text-blue-800 border border-blue-300"
                            }`}
                          >
                            <option value="DEBIT">DEBIT</option>
                            <option value="CREDIT">CREDIT</option>
                          </select>
                        </div>

                        <div className="flex-1">
                          <select
                            value={line.accountCode}
                            onChange={(e) =>
                              handleUpdateManualLine(line.id, "accountCode", e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-white border border-[#E8E2D5] rounded-md text-xs focus:ring-1 focus:ring-[#E4BF22]"
                          >
                            {accounts.map((acc) => (
                              <option key={acc.code} value={acc.code}>
                                {acc.code} - {acc.name} ({acc.type})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="₹ Amount"
                            value={line.amountRupees}
                            onChange={(e) =>
                              handleUpdateManualLine(line.id, "amountRupees", e.target.value)
                            }
                            className="w-full px-2 py-1.5 font-mono font-bold bg-white border border-[#E8E2D5] rounded-md text-xs text-right"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveManualLine(line.id)}
                          className="p-1.5 text-[#77736A] hover:text-rose-600 rounded-md transition-colors"
                          title="Delete line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balance Summary Box */}
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    isBalanced
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>Total Debits: ₹{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <span>Total Credits: ₹{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-current/20 flex items-center justify-between text-[11px]">
                    <span>Difference: ₹{difference.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <span className="font-bold">
                      {isBalanced ? "✓ BALANCED (Ready to post)" : "✗ OUT OF BALANCE (Cannot post)"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 font-semibold text-[#77736A] hover:text-[#29271F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isBalanced || submitting}
                    className={`px-5 py-2 font-semibold text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                      isBalanced && !submitting
                        ? "bg-[#493020] hover:bg-[#382417]"
                        : "bg-[#77736A]/40 cursor-not-allowed"
                    }`}
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? "Posting..." : "Post Journal Entry"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Slide-Over Detail Drawer */}
      {selectedJournalDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#493020]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#E8E2D5]">
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                <div>
                  <span className="text-[10px] font-bold text-[#493020] uppercase tracking-wider">
                    Journal Audit Record
                  </span>
                  <h3 className="text-lg font-bold text-[#29271F]">
                    {selectedJournalDrawer.reference}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedJournalDrawer(null)}
                  className="p-1 rounded-lg text-[#77736A] hover:text-[#29271F] hover:bg-[#FCFAF3]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-[11px] text-[#77736A] font-semibold">Narration / Purpose</div>
                  <div className="font-semibold text-sm text-[#29271F] mt-0.5">
                    {selectedJournalDrawer.narration}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-[#FCFAF3] rounded-xl border border-[#E8E2D5]">
                  <div>
                    <span className="text-[#77736A] text-[11px] block">Date</span>
                    <span className="font-mono font-bold text-[#29271F]">
                      {formatDate(selectedJournalDrawer.date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#77736A] text-[11px] block">Fiscal Period</span>
                    <span className="font-semibold text-[#29271F]">FY 2026–27</span>
                  </div>
                  <div>
                    <span className="text-[#77736A] text-[11px] block">Total Amount</span>
                    <span className="font-mono font-bold text-[#493020]">
                      <MoneyDisplay paise={selectedJournalDrawer.totalPaise} />
                    </span>
                  </div>
                  <div>
                    <span className="text-[#77736A] text-[11px] block">Ledger Status</span>
                    <span className="font-bold text-[#493020]">
                      {selectedJournalDrawer.status}
                    </span>
                  </div>
                </div>

                {selectedJournalDrawer.supplierName && (
                  <div>
                    <div className="text-[11px] text-[#77736A] font-semibold">Vendor / Supplier</div>
                    <div className="font-semibold text-[#29271F] mt-0.5">
                      {selectedJournalDrawer.supplierName}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[11px] text-[#77736A] font-bold uppercase tracking-wider mb-2">
                    General Ledger Postings
                  </div>
                  <div className="border border-[#E8E2D5] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#FCFAF3] border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase">
                        <tr>
                          <th className="px-3 py-2">Account</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E2D5]">
                        {selectedJournalDrawer.lines.map((l, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono">
                              <div>{l.accountCode}</div>
                              <div className="text-[10px] text-[#77736A]">{l.accountName}</div>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`font-bold ${
                                  l.type === "DEBIT" ? "text-emerald-700" : "text-blue-700"
                                }`}
                              >
                                {l.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold tabular-nums">
                              ₹{(l.amountPaise / 100).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E8E2D5] rounded-lg text-[11px] text-[#77736A] space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#29271F]">
                    <FileCheck2 className="w-3.5 h-3.5 text-[#493020]" />
                    <span>Immutable Ledger Lock</span>
                  </div>
                  <p>
                    Recorded by {selectedJournalDrawer.createdBy}. Double-entry compliance verified. Cannot be modified or deleted without a reversal journal.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E8E2D5] bg-[#FCFAF3] flex justify-end">
              <button
                onClick={() => setSelectedJournalDrawer(null)}
                className="px-4 py-2 text-xs font-semibold text-[#29271F] bg-white border border-[#E8E2D5] hover:bg-gray-50 rounded-lg shadow-xs"
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
