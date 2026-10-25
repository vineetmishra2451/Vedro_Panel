import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LineType, MovementType, MovementStatus, TransactionStatus } from "@prisma/client";

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

// Map expense types to default Debit Account
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
  const existing = await prisma.account.findUnique({
    where: {
      companyId_code: {
        companyId: DEFAULT_COMPANY_ID,
        code,
      },
    },
    select: { id: true, code: true, name: true, type: true },
  });

  if (existing) return existing;

  const info = STANDARD_ACCOUNTS[code] || {
    name: `Account ${code}`,
    type: code.startsWith("1") ? "ASSET" : code.startsWith("2") ? "LIABILITY" : "EXPENSE",
  };

  return await prisma.account.create({
    data: {
      companyId: DEFAULT_COMPANY_ID,
      code,
      name: info.name,
      type: info.type,
      isActive: true,
    },
    select: { id: true, code: true, name: true, type: true },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "100");
    const limit = isNaN(limitParam) ? 100 : Math.min(Math.max(1, limitParam), 200);

    // Batch query: transactions, accounts, and summary data
    const [transactions, accounts] = await Promise.all([
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
          code: true,
          name: true,
          type: true,
          lines: {
            select: {
              type: true,
              amountPaise: true,
            },
          },
        },
      }),
    ]);

    // Calculate account balances
    const accountBalances = accounts.map((acc) => {
      let balance = 0;
      for (const line of acc.lines) {
        if (acc.type === "ASSET" || acc.type === "EXPENSE") {
          balance += line.type === "DEBIT" ? line.amountPaise : -line.amountPaise;
        } else {
          balance += line.type === "CREDIT" ? line.amountPaise : -line.amountPaise;
        }
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

    return NextResponse.json({
      journals: formattedJournals,
      accounts: accountBalances,
      summary: {
        totalExpensesPaise,
        totalCashOutflowPaise,
        categoryBreakdown,
        monthlyExpenses,
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    // Ensure company exists
    await prisma.company.upsert({
      where: { id: DEFAULT_COMPANY_ID },
      update: {},
      create: {
        id: DEFAULT_COMPANY_ID,
        name: "Vedro Food Products",
      },
    });

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
        return NextResponse.json(
          { error: "Double entry error: Debits and Credits must balance and be greater than 0" },
          { status: 400 }
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

      const transaction = await prisma.transaction.create({
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
      });

      return NextResponse.json({
        success: true,
        transaction,
        reference,
      });
    }

    // 2. Quick Expense Mode
    const amountFloat = parseFloat(amountRupees);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return NextResponse.json({ error: "Please enter a valid amount greater than ₹0" }, { status: 400 });
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

    let partnerRecord = null;
    let partnerCapitalRecord = null;

    const txDate = new Date(date || Date.now());
    const reference = (invoiceRef && invoiceRef.trim()) || `EXP-${Date.now().toString().slice(-6)}`;

    // If a partner paid from their personal funds, credit their capital account and record capital introduced
    if (paidByPartner && partnerEquityCodes[paidByPartner]) {
      creditAccountCode = partnerEquityCodes[paidByPartner];
      creditDescription = `Paid by Partner ${paidByPartner} from personal funds (Added to Capital)`;

      // Ensure partner exists in DB
      partnerRecord = await prisma.partner.upsert({
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
      });

      const entryNarration =
        (narration && narration.trim()) ||
        `Out-of-pocket expense payment for ${supplierName || "supplier"}`;

      // Record capital introduced entry
      partnerCapitalRecord = await prisma.partnerCapital.create({
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

    const [debitAcc, creditAcc] = await Promise.all([
      ensureAccount(debitAccountCode),
      ensureAccount(creditAccountCode),
    ]);

    const finalNarration =
      (narration && narration.trim()) ||
      `${debitAcc.name} from ${supplierName || "Vendor"} (Ref: ${reference})${
        paidByPartner ? ` [Paid by ${paidByPartner}]` : ""
      }`;

    // Run transaction & inventory creation
    const transaction = await prisma.transaction.create({
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

    let updatedProduct = null;
    let inventoryMovement = null;

    // 3. Auto-update Inventory Stock if SKU was specified
    const qty = parseInt(quantity) || 0;
    if (sku && qty > 0 && updateInventory) {
      // Find or create product
      let product = await prisma.product.findUnique({
        where: {
          companyId_sku: {
            companyId: DEFAULT_COMPANY_ID,
            sku: sku.trim().toUpperCase(),
          },
        },
      });

      if (!product) {
        // Find in default catalog
        const catalogItem = [
          { sku: "VED-GHEE-250ML", name: "Pure A2 Desi Cow Bilona Ghee 250ml", unit: "JAR", costPricePaise: 28000, sellingPricePaise: 39900 },
          { sku: "VED-GHEE-500ML", name: "Pure A2 Desi Cow Bilona Ghee 500ml", unit: "JAR", costPricePaise: 55000, sellingPricePaise: 74900 },
          { sku: "VED-GHEE-1LTR", name: "Pure A2 Desi Cow Bilona Ghee 1 Litre", unit: "JAR", costPricePaise: 105000, sellingPricePaise: 144900 },
          { sku: "VED-OIL-300ML", name: "Cold-Pressed Kachi Ghani Mustard Oil 300ml", unit: "BOTTLE", costPricePaise: 6000, sellingPricePaise: 8900 },
          { sku: "VED-OIL-500ML", name: "Cold-Pressed Kachi Ghani Mustard Oil 500ml", unit: "BOTTLE", costPricePaise: 9500, sellingPricePaise: 13900 },
          { sku: "VED-OIL-1LTR", name: "Cold-Pressed Kachi Ghani Mustard Oil 1 Litre", unit: "BOTTLE", costPricePaise: 17500, sellingPricePaise: 24900 },
          { sku: "VED-OIL-2LTR", name: "Cold-Pressed Kachi Ghani Mustard Oil 2 Litre", unit: "CAN", costPricePaise: 34000, sellingPricePaise: 47900 },
          { sku: "VED-OIL-5LTR", name: "Cold-Pressed Kachi Ghani Mustard Oil 5 Litre", unit: "TIN", costPricePaise: 82000, sellingPricePaise: 114900 },
          { sku: "VED-JAG-500GM", name: "Natural Chemical-Free Organic Jaggery 500g", unit: "POUCH", costPricePaise: 4500, sellingPricePaise: 6900 },
          { sku: "VED-JAG-1KG", name: "Natural Chemical-Free Organic Jaggery 1kg", unit: "POUCH", costPricePaise: 8000, sellingPricePaise: 12500 },
        ].find((c) => c.sku === sku.trim().toUpperCase());

        product = await prisma.product.create({
          data: {
            companyId: DEFAULT_COMPANY_ID,
            sku: sku.trim().toUpperCase(),
            name: catalogItem?.name || `Product ${sku}`,
            unit: catalogItem?.unit || "PCS",
            costPricePaise: catalogItem?.costPricePaise || Math.round((amountPaise / qty)),
            sellingPricePaise: catalogItem?.sellingPricePaise || Math.round((amountPaise / qty) * 1.4),
            isActive: true,
          },
        });
      }

      // Ensure storage location
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

      const unitCostFloat = parseFloat(unitCostRupees);
      const unitCostPaise = !isNaN(unitCostFloat) && unitCostFloat > 0
        ? Math.round(unitCostFloat * 100)
        : Math.round(amountPaise / qty);

      // Create Inventory Movement (PURCHASE)
      inventoryMovement = await prisma.inventoryMovement.create({
        data: {
          companyId: DEFAULT_COMPANY_ID,
          productId: product.id,
          locationId: location.id,
          type: MovementType.PURCHASE,
          status: MovementStatus.APPROVED,
          quantity: qty,
          costPricePaise: unitCostPaise,
          reference: reference,
          reason: supplierName ? `Purchased from ${supplierName}` : "Raw material / Stock purchase",
          createdBy,
        },
        select: {
          id: true,
          quantity: true,
          type: true,
          status: true,
        },
      });

      // Update product unit cost if provided
      if (unitCostPaise > 0) {
        updatedProduct = await prisma.product.update({
          where: { id: product.id },
          data: { costPricePaise: unitCostPaise },
          select: {
            id: true,
            sku: true,
            name: true,
            costPricePaise: true,
          },
        });
      } else {
        updatedProduct = product;
      }
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to record expense" }, { status: 500 });
  }
}
