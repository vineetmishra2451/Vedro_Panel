import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LineType, MovementType, MovementStatus, TransactionStatus } from "@prisma/client";
import {
  getCachedLocationId,
  setCachedLocationId,
  getAccountFromCache,
  setAccountInCache,
} from "@/lib/static-cache";
import { startPerf, withPerfHeaders } from "@/lib/perf";

const DEFAULT_COMPANY_ID = "vedro-company-main";

// Standard Chart of Accounts
const STANDARD_ACCOUNTS: Record<string, { name: string; type: string }> = {
  "1000": { name: "Bank Account (Current)", type: "ASSET" },
  "1010": { name: "Cash in Hand", type: "ASSET" },
  "1020": { name: "UPI Collections Account", type: "ASSET" },
  "1100": { name: "Accounts Receivable (Debtors)", type: "ASSET" },
  "1200": { name: "Raw Materials & Ingredients Stock", type: "ASSET" },
  "1210": { name: "Packaging Materials Stock", type: "ASSET" },
  "1220": { name: "Finished Goods Inventory", type: "ASSET" },
  "1500": { name: "Equipment & Machinery", type: "ASSET" },
  "2000": { name: "Accounts Payable (Suppliers/Creditors)", type: "LIABILITY" },
  "2100": { name: "GST Output Payable", type: "LIABILITY" },
  "2200": { name: "Partner Loan Accounts", type: "LIABILITY" },
  "3010": { name: "Partner Capital - Vivek", type: "EQUITY" },
  "3020": { name: "Partner Capital - Vineet", type: "EQUITY" },
  "3030": { name: "Partner Capital - Varunesh", type: "EQUITY" },
  "4000": { name: "Sales Revenue (Food Products)", type: "REVENUE" },
  "5000": { name: "Cost of Goods Sold (COGS)", type: "EXPENSE" },
  "5050": { name: "Raw Material Purchases (Direct Expense)", type: "EXPENSE" },
  "5100": { name: "Packaging & Boxes", type: "EXPENSE" },
  "5200": { name: "Marketing & Advertising", type: "EXPENSE" },
  "5300": { name: "Freight & Delivery (Inward/Outward)", type: "EXPENSE" },
  "5400": { name: "Equipment Maintenance", type: "EXPENSE" },
  "5500": { name: "Depreciation Expense", type: "EXPENSE" },
  "5600": { name: "General & Administrative", type: "EXPENSE" },
};

async function getOrCreateExpenseLocation(): Promise<string> {
  const cached = getCachedLocationId();
  if (cached) return cached;
  let location = await prisma.inventoryLocation.findFirst({
    where: { companyId: DEFAULT_COMPANY_ID },
    select: { id: true },
  });
  if (!location) {
    location = await prisma.inventoryLocation.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        name: "Main Storage Facility",
        address: "Central Unit",
        isActive: true,
      },
      select: { id: true },
    });
  }
  setCachedLocationId(location.id);
  return location.id;
}
function getDebitAccountCode(expenseType: string): string {
  switch (expenseType) {
    case "raw_materials_direct":
    case "raw_materials":
      return "5050";
    case "raw_materials_inventory":
      return "1200";
    case "packaging":
      return "5100";
    case "packaging_inventory":
      return "1210";
    case "finished_goods":
      return "1220";
    case "freight":
      return "5300";
    case "marketing":
      return "5200";
    case "maintenance":
      return "5400";
    default:
      return "5600";
  }
}

async function ensureAccount(code: string) {
  const cached = getAccountFromCache(code);
  if (cached) return cached;

  const existing = await prisma.account.findUnique({
    where: {
      companyId_code: {
        companyId: DEFAULT_COMPANY_ID,
        code,
      },
    },
    select: { id: true, code: true, name: true, type: true },
  });

  if (existing) {
    setAccountInCache(code, existing);
    return existing;
  }

  const info = STANDARD_ACCOUNTS[code] || {
    name: `Account ${code}`,
    type: code.startsWith("1") ? "ASSET" : code.startsWith("2") ? "LIABILITY" : "EXPENSE",
  };

  const created = await prisma.account.create({
    data: {
      companyId: DEFAULT_COMPANY_ID,
      code,
      name: info.name,
      type: info.type,
      isActive: true,
    },
    select: { id: true, code: true, name: true, type: true },
  });
  setAccountInCache(code, created);
  return created;
}

export async function GET(req: Request) {
  const perf = startPerf("GET_EXPENSES", req);
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "100");
    const limit = isNaN(limitParam) ? 100 : Math.min(Math.max(1, limitParam), 200);

    // Batch query: transactions, accounts, and DB-level grouped balances in parallel
    const [transactions, accounts, lineAggregates] = await perf.step("db_queries", () =>
      Promise.all([
        prisma.transaction.findMany({
          where: { companyId: DEFAULT_COMPANY_ID },
          select: {
            id: true,
            date: true,
            reference: true,
            description: true,
            status: true,
            createdBy: true,
            createdAt: true,
            lines: {
              select: {
                id: true,
                type: true,
                amountPaise: true,
                description: true,
                account: {
                  select: {
                    code: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: { date: "desc" },
          take: limit,
        }),
        prisma.account.findMany({
          where: { companyId: DEFAULT_COMPANY_ID },
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        }),
        prisma.transactionLine.groupBy({
          by: ["accountId", "type"],
          _sum: { amountPaise: true },
        }),
      ])
    );

    // Fast O(1) balance lookup using PostgreSQL grouped aggregates
    const balanceByAccountId = new Map<string, { DEBIT: number; CREDIT: number }>();
    for (const agg of lineAggregates) {
      let entry = balanceByAccountId.get(agg.accountId);
      if (!entry) {
        entry = { DEBIT: 0, CREDIT: 0 };
        balanceByAccountId.set(agg.accountId, entry);
      }
      entry[agg.type] = agg._sum.amountPaise || 0;
    }

    const accountBalances = accounts.map((acc) => {
      const aggs = balanceByAccountId.get(acc.id) || { DEBIT: 0, CREDIT: 0 };
      let balance = 0;
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        balance = aggs.DEBIT - aggs.CREDIT;
      } else {
        balance = aggs.CREDIT - aggs.DEBIT;
      }
      return {
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        balancePaise: balance,
      };
    });

    // Calculate aggregate metrics across all transactions
    let totalExpensesPaise = 0;
    let totalCashOutflowPaise = 0;

    const categoryBreakdown: Record<string, number> = {
      "5050": 0, // Raw materials direct
      "1200": 0, // Raw materials inventory
      "5100": 0, // Packaging
      "1210": 0, // Packaging inventory
      "1220": 0, // Finished goods
      "5300": 0, // Freight
      "5200": 0, // Marketing
      "5400": 0, // Maintenance
      "5600": 0, // General admin
    };

    const monthlyExpenses: Record<string, number> = {};

    const formattedJournals = transactions.map((t) => {
      let transactionTotalPaise = 0;
      let debitAccount = "";
      let creditAccount = "";

      for (const l of t.lines) {
        if (l.type === "DEBIT") {
          transactionTotalPaise += l.amountPaise;
          debitAccount = l.account.code;

          // If debit is an EXPENSE or ASSET Inventory stock purchase
          if (l.account.type === "EXPENSE" || ["1200", "1210", "1220", "5050"].includes(l.account.code)) {
            totalExpensesPaise += l.amountPaise;
            categoryBreakdown[l.account.code] = (categoryBreakdown[l.account.code] || 0) + l.amountPaise;

            // Monthly grouping
            const d = new Date(t.date);
            const mLabel = d.toLocaleString("en-US", { month: "short" }) + " " + (d.getFullYear() % 100);
            monthlyExpenses[mLabel] = (monthlyExpenses[mLabel] || 0) + l.amountPaise;
          }
        } else {
          creditAccount = l.account.code;
          if (["1000", "1010", "1020"].includes(l.account.code)) {
            totalCashOutflowPaise += l.amountPaise;
          }
        }
      }

      return {
        id: t.id,
        date: t.date.toISOString().split("T")[0],
        reference: t.reference || `JRN-${t.id.slice(-6)}`,
        narration: t.description,
        totalPaise: transactionTotalPaise,
        status: t.status as "POSTED" | "DRAFT",
        category: STANDARD_ACCOUNTS[debitAccount]?.name || "Expense",
        lines: t.lines.map((l) => ({
          accountCode: l.account.code,
          accountName: l.account.name,
          type: l.type as "DEBIT" | "CREDIT",
          amountPaise: l.amountPaise,
          memo: l.description || undefined,
        })),
        createdBy: t.createdBy,
        createdAt: t.createdAt.toISOString(),
      };
    });

    const res = NextResponse.json({
      journals: formattedJournals,
      accounts: accountBalances,
      summary: {
        totalExpensesPaise,
        totalCashOutflowPaise,
        categoryBreakdown,
        monthlyExpenses,
      },
    });
    return withPerfHeaders(res, perf, 200);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 }),
      perf,
      500
    );
  }
}

export async function POST(req: Request) {
  const perf = startPerf("POST_EXPENSE", req);
  try {
    const session = await auth();
    const body = await req.json();

    const {
      date,
      expenseType = "raw_materials_direct",
      customDebitAccount,
      supplierName = "",
      invoiceRef = "",
      paymentAccount = "1000",
      paidByPartner = "", // "Vivek" | "Vineet" | "Varunesh"
      amountRupees,
      taxSlab = "5",
      narration = "",
      sku,
      quantity,
      unitCostRupees,
      updateInventory = true,
      lines: manualLines,
    } = body;

    const createdBy = session?.user?.name || "Finance Manager";

    // 1. Double Entry Manual Journal Mode
    if (manualLines && Array.isArray(manualLines) && manualLines.length >= 2) {
      let totalDebitPaise = 0;
      let totalCreditPaise = 0;

      for (const line of manualLines) {
        const amt = Math.round((parseFloat(line.amountRupees) || 0) * 100);
        if (line.type === "DEBIT") totalDebitPaise += amt;
        else totalCreditPaise += amt;
      }

      if (totalDebitPaise !== totalCreditPaise || totalDebitPaise <= 0) {
        return withPerfHeaders(
          NextResponse.json(
            { error: "Double entry error: Debits and Credits must balance and be greater than 0" },
            { status: 400 }
          ),
          perf,
          400
        );
      }

      const txDate = new Date(date || Date.now());
      const reference = invoiceRef || `JRN-${Date.now().toString().slice(-6)}`;
      const description = narration || "Manual Journal Entry";

      const lineCreates = [];
      for (const line of manualLines) {
        const acc = await ensureAccount(line.accountCode);
        lineCreates.push({
          accountId: acc.id,
          type: line.type as LineType,
          amountPaise: Math.round((parseFloat(line.amountRupees) || 0) * 100),
          description: line.memo || undefined,
        });
      }

      const transaction = await perf.step("tx_create_manual", () =>
        prisma.transaction.create({
          data: {
            companyId: DEFAULT_COMPANY_ID,
            date: txDate,
            reference,
            description,
            status: TransactionStatus.POSTED,
            createdBy,
            postedBy: createdBy,
            postedAt: new Date(),
            lines: { create: lineCreates },
          },
          select: {
            id: true,
            reference: true,
            date: true,
          },
        })
      );

      return withPerfHeaders(
        NextResponse.json({
          success: true,
          transaction,
          reference,
        }),
        perf,
        200
      );
    }

    // 2. Quick Expense Mode
    const amountFloat = parseFloat(amountRupees);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return withPerfHeaders(
        NextResponse.json({ error: "Please enter a valid amount greater than ₹0" }, { status: 400 }),
        perf,
        400
      );
    }

    const amountPaise = Math.round(amountFloat * 100);
    const debitAccountCode = customDebitAccount || getDebitAccountCode(expenseType);
    let creditAccountCode = paymentAccount || "1000";
    let creditDescription =
      creditAccountCode === "2000"
        ? "Supplier credit payable"
        : "Settled via payment";

    const partnerEquityCodes: Record<string, string> = {
      Vivek: "3010",
      Vineet: "3020",
      Varunesh: "3030",
    };

    const txDate = new Date(date || Date.now());
    const reference = (invoiceRef && invoiceRef.trim()) || `EXP-${Date.now().toString().slice(-6)}`;

    // Resolve partner & accounts in parallel
    const [debitAcc, creditAcc, partnerRecord] = await perf.step("lookup_prep", () =>
      Promise.all([
        ensureAccount(debitAccountCode),
        ensureAccount(
          paidByPartner && partnerEquityCodes[paidByPartner]
            ? partnerEquityCodes[paidByPartner]
            : creditAccountCode
        ),
        paidByPartner && partnerEquityCodes[paidByPartner]
          ? prisma.partner.upsert({
              where: {
                companyId_name: {
                  companyId: DEFAULT_COMPANY_ID,
                  name: paidByPartner,
                },
              },
              update: {},
              create: {
                companyId: DEFAULT_COMPANY_ID,
                name: paidByPartner,
                email: `${paidByPartner.toLowerCase()}@vedro.com`,
                isActive: true,
              },
              select: { id: true },
            })
          : null,
      ])
    );

    if (paidByPartner && partnerEquityCodes[paidByPartner]) {
      creditAccountCode = partnerEquityCodes[paidByPartner];
      creditDescription = `Paid by Partner ${paidByPartner} from personal funds (Added to Capital)`;
    }

    const finalNarration =
      (narration && narration.trim()) ||
      `${debitAcc.name} from ${supplierName || "Vendor"} (Ref: ${reference})${
        paidByPartner ? ` [Paid by ${paidByPartner}]` : ""
      }`;

    // Resolve product and location if SKU specified
    const qty = parseInt(quantity) || 0;
    let targetProduct: any = null;
    let locationId: string | null = null;
    const unitCostFloat = parseFloat(unitCostRupees);
    const unitCostPaise =
      !isNaN(unitCostFloat) && unitCostFloat > 0
        ? Math.round(unitCostFloat * 100)
        : qty > 0
        ? Math.round(amountPaise / qty)
        : 0;

    if (sku && qty > 0 && updateInventory) {
      const trimmedSku = sku.trim().toUpperCase();
      targetProduct = await prisma.product.findUnique({
        where: {
          companyId_sku: {
            companyId: DEFAULT_COMPANY_ID,
            sku: trimmedSku,
          },
        },
        select: { id: true, sku: true, name: true, costPricePaise: true },
      });

      if (!targetProduct) {
        targetProduct = await prisma.product.create({
          data: {
            companyId: DEFAULT_COMPANY_ID,
            sku: trimmedSku,
            name: `Product ${trimmedSku}`,
            unit: "PCS",
            costPricePaise: unitCostPaise,
            sellingPricePaise: Math.round(unitCostPaise * 1.4),
            isActive: true,
          },
          select: { id: true, sku: true, name: true, costPricePaise: true },
        });
      }

      locationId = await getOrCreateExpenseLocation();
    }

    // Atomic transaction: ledger entry, partner capital, and inventory movement
    const { transaction, partnerCapitalRecord, inventoryMovement, updatedProduct } =
      await perf.step("tx_atomic_expense", () =>
        prisma.$transaction(async (tx) => {
          let capitalRec = null;
          if (partnerRecord) {
            const entryNarration =
              (narration && narration.trim()) ||
              `Out-of-pocket expense payment for ${supplierName || "supplier"}`;
            capitalRec = await tx.partnerCapital.create({
              data: {
                companyId: DEFAULT_COMPANY_ID,
                partnerId: partnerRecord.id,
                date: txDate,
                amountPaise,
                type: "CAPITAL_INTRODUCED",
                reason: `Paid Expense: ${entryNarration} (Ref: ${reference})`,
                paymentMethod: "PERSONAL_FUNDS",
                reference,
                notes: `Paid out-of-pocket by partner ${paidByPartner} for company expense`,
                createdBy,
              },
            });
          }

          const txRecord = await tx.transaction.create({
            data: {
              companyId: DEFAULT_COMPANY_ID,
              date: txDate,
              reference,
              description: finalNarration,
              status: TransactionStatus.POSTED,
              createdBy,
              postedBy: createdBy,
              postedAt: new Date(),
              lines: {
                create: [
                  {
                    accountId: debitAcc.id,
                    type: LineType.DEBIT,
                    amountPaise,
                    description: supplierName ? `Purchased from ${supplierName}` : undefined,
                  },
                  {
                    accountId: creditAcc.id,
                    type: LineType.CREDIT,
                    amountPaise,
                    description: creditDescription,
                  },
                ],
              },
            },
            select: {
              id: true,
              reference: true,
              date: true,
            },
          });

          let invMovement = null;
          let prodUpdated = targetProduct;

          if (targetProduct && locationId && qty > 0) {
            invMovement = await tx.inventoryMovement.create({
              data: {
                companyId: DEFAULT_COMPANY_ID,
                productId: targetProduct.id,
                locationId,
                type: MovementType.PURCHASE,
                status: MovementStatus.APPROVED,
                quantity: qty,
                costPricePaise: unitCostPaise,
                reference,
                reason: supplierName
                  ? `Purchased from ${supplierName}`
                  : "Raw material / Stock purchase",
                createdBy,
              },
              select: {
                id: true,
                quantity: true,
                type: true,
                status: true,
              },
            });

            if (unitCostPaise > 0) {
              prodUpdated = await tx.product.update({
                where: { id: targetProduct.id },
                data: { costPricePaise: unitCostPaise },
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  costPricePaise: true,
                },
              });
            }
          }

          return {
            transaction: txRecord,
            partnerCapitalRecord: capitalRec,
            inventoryMovement: invMovement,
            updatedProduct: prodUpdated,
          };
        })
      );

    const res = NextResponse.json({
      success: true,
      transaction,
      reference,
      movement: inventoryMovement,
      product: updatedProduct,
      partnerCapital: partnerCapitalRecord,
      message: `Expense ${reference} recorded successfully.${
        paidByPartner
          ? ` Credited ₹${(amountPaise / 100).toLocaleString("en-IN")} to Partner Capital (${paidByPartner}).`
          : ""
      }${qty > 0 ? ` Added ${qty} units of ${sku} to inventory.` : ""}`,
    });
    return withPerfHeaders(res, perf, 201);
  } catch (error) {
    console.error("Error creating expense:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to record expense" }, { status: 500 }),
      perf,
      500
    );
  }
}
