import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PartnerTxnType } from "@prisma/client";
import { isPartnersEnsured, setPartnersEnsured } from "@/lib/static-cache";
import { startPerf, withPerfHeaders } from "@/lib/perf";

const DEFAULT_COMPANY_ID = "vedro-company-main";

const DEFAULT_PARTNERS = [
  { name: "Vivek", email: "vivek@vedro.com", accountCode: "3010" },
  { name: "Vineet", email: "vineet@vedro.com", accountCode: "3020" },
  { name: "Varunesh", email: "varunesh@vedro.com", accountCode: "3030" },
];

async function ensurePartners() {
  if (isPartnersEnsured()) return;

  // Ensure company exists
  await prisma.company.upsert({
    where: { id: DEFAULT_COMPANY_ID },
    update: {},
    create: {
      id: DEFAULT_COMPANY_ID,
      name: "Vedro Food Products",
    },
  });

  for (const p of DEFAULT_PARTNERS) {
    await prisma.partner.upsert({
      where: {
        companyId_name: {
          companyId: DEFAULT_COMPANY_ID,
          name: p.name,
        },
      },
      update: { email: p.email },
      create: {
        companyId: DEFAULT_COMPANY_ID,
        name: p.name,
        email: p.email,
        isActive: true,
      },
    });
  }
  setPartnersEnsured();
}

export async function GET(req: Request) {
  const perf = startPerf("GET_PARTNERS", req);
  try {
    await perf.step("bootstrap", () => ensurePartners());

    const [partners, capitalEntries] = await perf.step("db_queries", () =>
      Promise.all([
        prisma.partner.findMany({
          where: { companyId: DEFAULT_COMPANY_ID, isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
          orderBy: { name: "asc" },
        }),
        prisma.partnerCapital.findMany({
          where: { companyId: DEFAULT_COMPANY_ID },
          select: {
            id: true,
            partnerId: true,
            date: true,
            amountPaise: true,
            type: true,
            reason: true,
            paymentMethod: true,
            reference: true,
            notes: true,
            createdAt: true,
            partner: {
              select: { name: true },
            },
          },
          orderBy: { date: "desc" },
        }),
      ])
    );

    const formattedEntries = capitalEntries.map((e) => ({
      id: e.id,
      partnerName: e.partner.name as "Vivek" | "Vineet" | "Varunesh",
      date: e.date.toISOString().split("T")[0],
      amountPaise: e.amountPaise,
      type: e.type,
      reason: e.reason,
      paymentMethod: e.paymentMethod || "BANK_TRANSFER",
      reference: e.reference || "",
      notes: e.notes || undefined,
      createdAt: e.createdAt.toISOString(),
    }));

    // Partner stats summary
    const partnerNames = ["Vivek", "Vineet", "Varunesh"] as const;
    const partnerStats = partnerNames.map((name) => {
      const partnerEntries = formattedEntries.filter((e) => e.partnerName === name);
      const totalIntroduced = partnerEntries
        .filter((e) => e.amountPaise > 0)
        .reduce((acc, e) => acc + e.amountPaise, 0);
      const totalWithdrawn = partnerEntries
        .filter((e) => e.amountPaise < 0)
        .reduce((acc, e) => acc + Math.abs(e.amountPaise), 0);
      const netBalance = totalIntroduced - totalWithdrawn;

      return {
        name,
        entriesCount: partnerEntries.length,
        totalIntroduced,
        totalWithdrawn,
        netBalance,
      };
    });

    const totalCapitalPaise = partnerStats.reduce((acc, p) => acc + p.netBalance, 0);

    const res = NextResponse.json({
      partners,
      entries: formattedEntries,
      partnerStats,
      totalCapitalPaise,
    });
    return withPerfHeaders(res, perf, 200);
  } catch (error) {
    console.error("Error fetching partners capital:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to fetch partners capital" }, { status: 500 }),
      perf,
      500
    );
  }
}

export async function POST(req: Request) {
  const perf = startPerf("POST_PARTNER_CAPITAL", req);
  try {
    const session = await auth();
    const body = await req.json();

    const {
      partnerName,
      date,
      amountRupees,
      type = "CAPITAL_INTRODUCED",
      reason,
      paymentMethod = "BANK_TRANSFER",
      reference,
      notes,
    } = body;

    if (!partnerName) {
      return withPerfHeaders(
        NextResponse.json({ error: "Partner name is required" }, { status: 400 }),
        perf,
        400
      );
    }

    const rupees = parseFloat(amountRupees);
    if (isNaN(rupees) || rupees <= 0) {
      return withPerfHeaders(
        NextResponse.json({ error: "Please enter a valid amount greater than ₹0" }, { status: 400 }),
        perf,
        400
      );
    }

    const isNegative = type === "WITHDRAWAL" || type === "LOAN_REPAYMENT";
    const amountPaise = Math.round(rupees * 100) * (isNegative ? -1 : 1);

    // Find or create partner
    let partner = await perf.step("lookup_partner", () =>
      prisma.partner.findFirst({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          name: { equals: partnerName, mode: "insensitive" },
        },
      })
    );

    if (!partner) {
      partner = await perf.step("create_partner", () =>
        prisma.partner.create({
          data: {
            companyId: DEFAULT_COMPANY_ID,
            name: partnerName,
            email: `${partnerName.toLowerCase()}@vedro.com`,
            isActive: true,
          },
        })
      );
    }

    const createdBy = session?.user?.name || "System";
    const refNumber = reference || `CAP-${Date.now().toString().slice(-6)}`;

    const entry = await perf.step("create_capital_entry", () =>
      prisma.partnerCapital.create({
        data: {
          companyId: DEFAULT_COMPANY_ID,
          partnerId: partner.id,
          date: new Date(date || Date.now()),
          amountPaise,
          type: type as PartnerTxnType,
          reason: reason || "Partner Capital Introduction",
          paymentMethod,
          reference: refNumber,
          notes: notes || null,
          createdBy,
        },
        select: {
          id: true,
          date: true,
          amountPaise: true,
          type: true,
          reason: true,
          reference: true,
          createdAt: true,
        },
      })
    );

    const res = NextResponse.json({
      success: true,
      entry: {
        ...entry,
        partnerName: partner.name,
        date: entry.date.toISOString().split("T")[0],
        createdAt: entry.createdAt.toISOString(),
      },
    });
    return withPerfHeaders(res, perf, 201);
  } catch (error) {
    console.error("Error creating partner capital entry:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to create partner capital entry" }, { status: 500 }),
      perf,
      500
    );
  }
}
