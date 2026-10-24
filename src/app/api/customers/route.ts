import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ customers: [], partners: [] });
    }

    const [dbCustomers, dbPartners] = await Promise.all([
      prisma.customer.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partner.findMany({
        where: { companyId: company.id, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const formattedCustomers = dbCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || "",
      email: c.email || undefined,
      city: c.city || undefined,
      source: c.source || "Retail Walk-in",
      orderCount: c.orderCount,
      totalSpentPaise: c.totalSpentPaise,
      createdAt: c.createdAt.toISOString(),
      notes: c.notes || undefined,
    }));

    const defaultPartners = [
      { id: "partner-vivek", name: "Vivek" },
      { id: "partner-vineet", name: "Vineet" },
      { id: "partner-varunesh", name: "Varunesh" },
    ];

    const partners = dbPartners.length > 0 ? dbPartners : defaultPartners;

    return NextResponse.json({
      customers: formattedCustomers,
      partners,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();

    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ error: "Company record not found" }, { status: 400 });
    }

    const {
      name,
      phone,
      email,
      city,
      source,
      referralType,
      referralPartner,
      referralCustomerName,
      notes,
    } = body;

    const trimmedName = (name || "").trim();
    const trimmedPhone = (phone || "").trim();

    if (!trimmedName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!trimmedPhone) {
      return NextResponse.json({ error: "Customer phone is required" }, { status: 400 });
    }

    let finalSource = (source || "Retail Walk-in").trim();
    if (finalSource === "Partner Referral" || referralType === "PARTNER") {
      finalSource = `Partner Referral: ${referralPartner || "Partner"}`;
    } else if (finalSource === "Customer Referral" || referralType === "CUSTOMER") {
      finalSource = `Customer Referral: ${referralCustomerName || "Customer"}`;
    }

    // Check if customer already exists with this phone
    let customer = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        phone: trimmedPhone,
      },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: trimmedName,
          email: email?.trim() || customer.email,
          city: city?.trim() || customer.city,
          source: finalSource || customer.source,
          notes: notes?.trim() || customer.notes,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          companyId: company.id,
          name: trimmedName,
          phone: trimmedPhone,
          email: email?.trim() || null,
          city: city?.trim() || null,
          source: finalSource,
          orderCount: 0,
          totalSpentPaise: 0,
          notes: notes?.trim() || null,
        },
      });
    }

    const responseCustomer = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || undefined,
      city: customer.city || undefined,
      source: customer.source || finalSource,
      orderCount: customer.orderCount,
      totalSpentPaise: customer.totalSpentPaise,
      createdAt: customer.createdAt.toISOString(),
      notes: customer.notes || undefined,
    };

    return NextResponse.json({ customer: responseCustomer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
