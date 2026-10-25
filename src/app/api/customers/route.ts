import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const DEFAULT_COMPANY_ID = "vedro-company-main";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    // Pagination parameters: support both limit/offset and cursor pagination
    const pageParam = parseInt(searchParams.get("page") || "1");
    const limitParam = parseInt(searchParams.get("limit") || "100");
    const offsetParam = searchParams.get("offset");
    const cursor = searchParams.get("cursor");

    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = isNaN(limitParam) || limitParam < 1 ? 50 : Math.min(limitParam, 200);
    const skip = offsetParam !== null && !isNaN(parseInt(offsetParam))
      ? Math.max(0, parseInt(offsetParam))
      : (page - 1) * limit;

    const [totalCount, dbCustomers, dbPartners] = await Promise.all([
      prisma.customer.count({ where: { companyId: DEFAULT_COMPANY_ID } }),
      prisma.customer.findMany({
        where: { companyId: DEFAULT_COMPANY_ID },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          city: true,
          source: true,
          orderCount: true,
          totalSpentPaise: true,
          createdAt: true,
          notes: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : { skip }),
      }),
      prisma.partner.findMany({
        where: { companyId: DEFAULT_COMPANY_ID, isActive: true },
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
    const nextCursor = dbCustomers.length === limit ? dbCustomers[dbCustomers.length - 1].id : null;
    const hasMore = cursor
      ? dbCustomers.length === limit
      : skip + dbCustomers.length < totalCount;

    return NextResponse.json({
      customers: formattedCustomers,
      partners,
      pagination: {
        total: totalCount,
        page: cursor ? null : page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore,
        nextCursor,
      },
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

    const customerSelectFields = {
      id: true,
      name: true,
      phone: true,
      email: true,
      city: true,
      source: true,
      orderCount: true,
      totalSpentPaise: true,
      createdAt: true,
      notes: true,
    };

    // Check if customer already exists with this phone using explicit select
    let customer = await prisma.customer.findFirst({
      where: {
        companyId: DEFAULT_COMPANY_ID,
        phone: trimmedPhone,
      },
      select: customerSelectFields,
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
        select: customerSelectFields,
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          companyId: DEFAULT_COMPANY_ID,
          name: trimmedName,
          phone: trimmedPhone,
          email: email?.trim() || null,
          city: city?.trim() || null,
          source: finalSource,
          orderCount: 0,
          totalSpentPaise: 0,
          notes: notes?.trim() || null,
        },
        select: customerSelectFields,
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

export async function PUT(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { id, name, phone, email, city, source, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const trimmedName = (name || "").trim();
    const trimmedPhone = (phone || "").trim();

    if (!trimmedName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!trimmedPhone) {
      return NextResponse.json({ error: "Customer phone is required" }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: trimmedName,
        phone: trimmedPhone,
        email: email !== undefined ? (email?.trim() || null) : undefined,
        city: city !== undefined ? (city?.trim() || null) : undefined,
        source: source !== undefined ? (source?.trim() || "Retail Walk-in") : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        city: true,
        source: true,
        orderCount: true,
        totalSpentPaise: true,
        createdAt: true,
        notes: true,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: updated.id,
        name: updated.name,
        phone: updated.phone || "",
        email: updated.email || undefined,
        city: updated.city || undefined,
        source: updated.source,
        orderCount: updated.orderCount,
        totalSpentPaise: updated.totalSpentPaise,
        createdAt: updated.createdAt.toISOString(),
        notes: updated.notes || undefined,
      },
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    // Safely unlink orders if any to preserve order history
    await prisma.order.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    // Delete customer
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
