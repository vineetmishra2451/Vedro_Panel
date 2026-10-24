import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    // Allow reading if authenticated or fallback
    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ orders: [] });
    }

    const dbOrders = await prisma.order.findMany({
      where: { companyId: company.id },
      include: {
        channel: true,
        customer: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const formattedOrders = dbOrders.map((order) => {
      const primaryLine = order.lines[0];
      const itemDesc = primaryLine?.product?.name || primaryLine?.product?.sku || order.notes || "Vedro Food Product";
      const qty = order.lines.reduce((acc, l) => acc + l.quantity, 0) || 1;
      const unitPrice = primaryLine ? primaryLine.unitPricePaise : order.subtotalPaise;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.date.toISOString().split("T")[0],
        customerName: order.customer?.name || "Walk-in Retail Customer",
        customerPhone: order.customer?.phone || undefined,
        channel: order.channel?.name || "Offline / Direct Store",
        itemDescription: itemDesc,
        quantity: qty,
        unitPricePaise: unitPrice,
        subtotalPaise: order.subtotalPaise,
        discountPaise: order.discountPaise,
        taxPaise: order.taxPaise,
        totalPaise: order.totalPaise,
        paymentMode: "UPI / Cash",
        paymentStatus: order.status === "CONFIRMED" ? "PENDING" : "PAID",
        fulfillmentStatus: order.status === "CONFIRMED" ? "CONFIRMED" : "FULFILLED",
        notes: order.notes || undefined,
      };
    });

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
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
      date,
      customerName,
      customerPhone,
      itemDescription,
      quantity,
      unitPrice,
      discount,
      gstRate,
      paymentMode,
      paymentStatus,
      referralType,
      referralPartner,
      referralCustomerName,
      notes,
    } = body;

    let referralTag = "";
    if (referralType === "PARTNER" && referralPartner) {
      referralTag = `Referred by Partner: ${referralPartner}`;
    } else if (referralType === "CUSTOMER" && referralCustomerName) {
      referralTag = `Referred by Customer: ${referralCustomerName}`;
    }

    const finalNotes = referralTag
      ? (notes ? `[${referralTag}] ${notes}` : `[${referralTag}]`)
      : notes || undefined;

    const qty = parseInt(quantity) || 1;
    const unitPriceRs = parseFloat(unitPrice) || 0;
    const discountRs = parseFloat(discount) || 0;
    const gstPct = parseFloat(gstRate) || 5;

    const unitPricePaise = Math.round(unitPriceRs * 100);
    const subtotalPaise = Math.round(qty * unitPriceRs * 100);
    const discountPaise = Math.round(discountRs * 100);
    const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
    const taxPaise = Math.round((taxablePaise * gstPct) / 100);
    const totalPaise = taxablePaise + taxPaise;

    // 1. Find or create Offline sales channel
    let channel = await prisma.salesChannel.findFirst({
      where: {
        companyId: company.id,
        name: { contains: "Offline", mode: "insensitive" },
      },
    });

    if (!channel) {
      channel = await prisma.salesChannel.create({
        data: {
          companyId: company.id,
          name: "Offline / Direct Store",
          type: "PHYSICAL",
          isActive: true,
        },
      });
    }

    // 2. Find or create customer if name/phone provided
    let customerId: string | null = null;
    const trimmedName = (customerName || "").trim();
    const trimmedPhone = (customerPhone || "").trim();

    if (trimmedPhone || trimmedName) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          companyId: company.id,
          OR: [
            ...(trimmedPhone ? [{ phone: trimmedPhone }] : []),
            ...(trimmedName ? [{ name: trimmedName }] : []),
          ],
        },
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            orderCount: { increment: 1 },
            totalSpentPaise: { increment: totalPaise },
            lastPurchaseAt: new Date(date || Date.now()),
            ...(referralTag && !existingCustomer.source ? { source: referralTag } : {}),
          },
        });
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            companyId: company.id,
            name: trimmedName || "Retail Customer",
            phone: trimmedPhone || null,
            firstPurchaseAt: new Date(date || Date.now()),
            lastPurchaseAt: new Date(date || Date.now()),
            orderCount: 1,
            totalSpentPaise: totalPaise,
            source: referralTag || "Offline Store Walk-in",
          },
        });
        customerId = newCustomer.id;
      }
    }

    // 3. Find Product by SKU or description match
    let product = await prisma.product.findFirst({
      where: {
        companyId: company.id,
        OR: [
          { sku: { contains: itemDescription, mode: "insensitive" } },
          { name: { contains: itemDescription, mode: "insensitive" } },
        ],
      },
    });

    if (!product) {
      // Fallback to first product or create ad-hoc
      product = await prisma.product.findFirst({
        where: { companyId: company.id },
      });
    }

    const orderNumber = `VED-OFF-${Date.now().toString().slice(-6)}`;
    const createdBy = session?.user?.name || "System";

    // 4. Create Order & OrderLine in Prisma
    const newOrder = await prisma.order.create({
      data: {
        companyId: company.id,
        orderNumber,
        channelId: channel.id,
        customerId,
        date: new Date(date || Date.now()),
        status: paymentStatus === "PAID" ? "FULFILLED" : "CONFIRMED",
        subtotalPaise,
        discountPaise,
        taxPaise,
        totalPaise,
        notes: finalNotes,
        createdBy,
        ...(product
          ? {
              lines: {
                create: [
                  {
                    productId: product.id,
                    quantity: qty,
                    unitPricePaise,
                    discountPaise,
                    taxableAmountPaise: taxablePaise,
                    cgstPaise: Math.round(taxPaise / 2),
                    sgstPaise: Math.round(taxPaise / 2),
                    totalPaise,
                  },
                ],
              },
            }
          : {}),
      },
      include: {
        channel: true,
        customer: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    const responseOrder = {
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      date: newOrder.date.toISOString().split("T")[0],
      customerName: newOrder.customer?.name || trimmedName || "Walk-in Retail Customer",
      customerPhone: newOrder.customer?.phone || trimmedPhone || undefined,
      channel: newOrder.channel?.name || "Offline / Direct Store",
      itemDescription: itemDescription || product?.name || "Vedro Food Product",
      quantity: qty,
      unitPricePaise,
      subtotalPaise,
      discountPaise,
      taxPaise,
      totalPaise,
      paymentMode: paymentMode || "UPI",
      paymentStatus: paymentStatus || "PAID",
      fulfillmentStatus: (paymentStatus === "PAID" ? "FULFILLED" : "CONFIRMED") as "FULFILLED" | "CONFIRMED",
      notes: notes || undefined,
    };

    return NextResponse.json({ order: responseOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
  }
}
