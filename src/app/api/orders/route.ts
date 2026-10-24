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

    // Batch execute total count and selective query in parallel
    const [totalCount, dbOrders] = await Promise.all([
      prisma.order.count({ where: { companyId: DEFAULT_COMPANY_ID } }),
      prisma.order.findMany({
        where: { companyId: DEFAULT_COMPANY_ID },
        select: {
          id: true,
          orderNumber: true,
          date: true,
          status: true,
          subtotalPaise: true,
          discountPaise: true,
          taxPaise: true,
          totalPaise: true,
          notes: true,
          channel: { select: { name: true } },
          customer: { select: { name: true, phone: true } },
          lines: {
            select: {
              quantity: true,
              unitPricePaise: true,
              totalPaise: true,
              product: { select: { name: true, sku: true } },
            },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
        ...(cursor
          ? { cursor: { id: cursor }, skip: 1 }
          : { skip }),
      }),
    ]);

    const formattedOrders = dbOrders.map((order) => {
      const primaryLine = order.lines[0];
      const itemDesc =
        primaryLine?.product?.name ||
        primaryLine?.product?.sku ||
        order.notes ||
        "Vedro Food Product";
      const qty = order.lines.reduce((acc, l) => acc + l.quantity, 0) || 1;
      const unitPrice = primaryLine ? primaryLine.unitPricePaise : order.subtotalPaise;

      // Calculate effective GST rate accurately from taxable and tax amounts
      const taxablePaise = Math.max(0, order.subtotalPaise - order.discountPaise);
      const effectiveGstRate =
        taxablePaise > 0 ? Math.round((order.taxPaise * 100) / taxablePaise) : 5;

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
        gstRate: effectiveGstRate,
        paymentMode: "UPI / Cash",
        paymentStatus: order.status === "CONFIRMED" ? "PENDING" : "PAID",
        fulfillmentStatus: order.status === "CONFIRMED" ? "CONFIRMED" : "FULFILLED",
        notes: order.notes || undefined,
      };
    });

    const nextCursor = dbOrders.length === limit ? dbOrders[dbOrders.length - 1].id : null;
    const hasMore = cursor
      ? dbOrders.length === limit
      : skip + dbOrders.length < totalCount;

    return NextResponse.json({
      orders: formattedOrders,
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
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();

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
      saveToContacts = true,
      notes,
    } = body;

    let referralTag = "";
    if (referralType === "PARTNER" && referralPartner) {
      referralTag = `Referred by Partner: ${referralPartner}`;
    } else if (referralType === "CUSTOMER" && referralCustomerName) {
      referralTag = `Referred by Customer: ${referralCustomerName}`;
    }

    const finalNotes = referralTag
      ? notes
        ? `[${referralTag}] ${notes}`
        : `[${referralTag}]`
      : notes || undefined;

    const qty = parseInt(quantity) || 1;
    const unitPriceRs = parseFloat(unitPrice) || 0;
    const discountRs = parseFloat(discount) || 0;

    // Correctly parse GST rate (handle 0% without falsy fallback bug)
    const parsedGst = parseFloat(gstRate);
    const gstPct = isNaN(parsedGst) ? 5 : parsedGst;

    const unitPricePaise = Math.round(unitPriceRs * 100);
    const subtotalPaise = Math.round(qty * unitPriceRs * 100);
    const discountPaise = Math.round(discountRs * 100);
    const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
    const taxPaise = Math.round((taxablePaise * gstPct) / 100);
    const totalPaise = taxablePaise + taxPaise;

    const trimmedName = (customerName || "").trim();
    const trimmedPhone = (customerPhone || "").trim();

    // Run channel, customer check, and product lookups in parallel for maximum database speed
    const [existingChannel, existingCustomer, product] = await Promise.all([
      prisma.salesChannel.findFirst({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          name: { contains: "Offline", mode: "insensitive" },
        },
        select: { id: true, name: true },
      }),
      saveToContacts && (trimmedPhone || trimmedName)
        ? prisma.customer.findFirst({
            where: {
              companyId: DEFAULT_COMPANY_ID,
              OR: [
                ...(trimmedPhone ? [{ phone: trimmedPhone }] : []),
                ...(trimmedName ? [{ name: { equals: trimmedName, mode: "insensitive" } }] : []),
              ],
            },
            select: { id: true, name: true, phone: true, source: true },
          })
        : null,
      prisma.product.findFirst({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          OR: [
            { sku: { contains: itemDescription, mode: "insensitive" } },
            { name: { contains: itemDescription, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, sku: true },
      }),
    ]);

    // Fast channel resolution
    let channelId = existingChannel?.id;
    if (!channelId) {
      const newChannel = await prisma.salesChannel.create({
        data: {
          companyId: DEFAULT_COMPANY_ID,
          name: "Offline / Direct Store",
          type: "PHYSICAL",
          isActive: true,
        },
        select: { id: true },
      });
      channelId = newChannel.id;
    }

    // Fast customer handling
    let customerId: string | null = null;
    if (saveToContacts && (trimmedPhone || trimmedName)) {
      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Non-blocking update of existing customer metrics
        prisma.customer
          .update({
            where: { id: existingCustomer.id },
            data: {
              orderCount: { increment: 1 },
              totalSpentPaise: { increment: totalPaise },
              lastPurchaseAt: new Date(date || Date.now()),
              ...(referralTag && !existingCustomer.source ? { source: referralTag } : {}),
            },
          })
          .catch((err) => console.error("Error updating customer stats:", err));
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            companyId: DEFAULT_COMPANY_ID,
            name: trimmedName || "Retail Customer",
            phone: trimmedPhone || null,
            firstPurchaseAt: new Date(date || Date.now()),
            lastPurchaseAt: new Date(date || Date.now()),
            orderCount: 1,
            totalSpentPaise: totalPaise,
            source: referralTag || "Offline Store Walk-in",
          },
          select: { id: true },
        });
        customerId = newCustomer.id;
      }
    }

    // Fallback product if needed
    let resolvedProductId = product?.id;
    if (!resolvedProductId) {
      const fallbackProd = await prisma.product.findFirst({
        where: { companyId: DEFAULT_COMPANY_ID },
        select: { id: true },
      });
      resolvedProductId = fallbackProd?.id;
    }

    const orderNumber = `VED-OFF-${Date.now().toString().slice(-6)}`;
    const createdBy = session?.user?.name || "System";

    // Create Order and Line Items
    const newOrder = await prisma.order.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        orderNumber,
        channelId,
        customerId,
        date: new Date(date || Date.now()),
        status: paymentStatus === "PAID" ? "FULFILLED" : "CONFIRMED",
        subtotalPaise,
        discountPaise,
        taxPaise,
        totalPaise,
        notes: finalNotes,
        createdBy,
        ...(resolvedProductId
          ? {
              lines: {
                create: [
                  {
                    productId: resolvedProductId,
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
      select: {
        id: true,
        orderNumber: true,
        date: true,
        totalPaise: true,
      },
    });

    const responseOrder = {
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      date: newOrder.date.toISOString().split("T")[0],
      customerName: trimmedName || "Walk-in Retail Customer",
      customerPhone: trimmedPhone || undefined,
      channel: existingChannel?.name || "Offline / Direct Store",
      itemDescription: itemDescription || product?.name || "Vedro Food Product",
      quantity: qty,
      unitPricePaise,
      subtotalPaise,
      discountPaise,
      taxPaise,
      totalPaise,
      gstRate: gstPct,
      paymentMode: paymentMode || "UPI",
      paymentStatus: paymentStatus || "PAID",
      fulfillmentStatus: (paymentStatus === "PAID" ? "FULFILLED" : "CONFIRMED") as
        | "FULFILLED"
        | "CONFIRMED",
      notes: finalNotes || undefined,
    };

    return NextResponse.json({ order: responseOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required for editing" }, { status: 400 });
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
      ? notes
        ? `[${referralTag}] ${notes}`
        : `[${referralTag}]`
      : notes || undefined;

    const qty = parseInt(quantity) || 1;
    const unitPriceRs = parseFloat(unitPrice) || 0;
    const discountRs = parseFloat(discount) || 0;

    // Correctly parse edited GST rate (handles 0%, 5%, 12%, 18%, 28%)
    const parsedGst = parseFloat(gstRate);
    const gstPct = isNaN(parsedGst) ? 5 : parsedGst;

    const unitPricePaise = Math.round(unitPriceRs * 100);
    const subtotalPaise = Math.round(qty * unitPriceRs * 100);
    const discountPaise = Math.round(discountRs * 100);
    const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
    const taxPaise = Math.round((taxablePaise * gstPct) / 100);
    const totalPaise = taxablePaise + taxPaise;

    // Fetch existing order and product in parallel
    const [existingOrder, product] = await Promise.all([
      prisma.order.findUnique({
        where: { id },
        select: { id: true, customerId: true, totalPaise: true, orderNumber: true },
      }),
      prisma.product.findFirst({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          OR: [
            { sku: { contains: itemDescription, mode: "insensitive" } },
            { name: { contains: itemDescription, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, sku: true },
      }),
    ]);

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Adjust customer lifetime spend difference asynchronously
    const diffPaise = totalPaise - existingOrder.totalPaise;
    if (existingOrder.customerId && diffPaise !== 0) {
      prisma.customer
        .update({
          where: { id: existingOrder.customerId },
          data: { totalSpentPaise: { increment: diffPaise } },
        })
        .catch((err) => console.error("Error updating customer diff:", err));
    }

    let resolvedProductId = product?.id;
    if (!resolvedProductId) {
      const fallbackProd = await prisma.product.findFirst({
        where: { companyId: DEFAULT_COMPANY_ID },
        select: { id: true },
      });
      resolvedProductId = fallbackProd?.id;
    }

    // Delete existing lines and update order in a single transaction
    await prisma.$transaction([
      prisma.orderLine.deleteMany({ where: { orderId: id } }),
      prisma.order.update({
        where: { id },
        data: {
          date: new Date(date || Date.now()),
          status: paymentStatus === "PAID" ? "FULFILLED" : "CONFIRMED",
          subtotalPaise,
          discountPaise,
          taxPaise,
          totalPaise,
          notes: finalNotes,
          ...(resolvedProductId
            ? {
                lines: {
                  create: [
                    {
                      productId: resolvedProductId,
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
        select: { id: true },
      }),
    ]);

    const responseOrder = {
      id: existingOrder.id,
      orderNumber: existingOrder.orderNumber,
      date: new Date(date || Date.now()).toISOString().split("T")[0],
      customerName: (customerName || "").trim() || "Walk-in Retail Customer",
      customerPhone: (customerPhone || "").trim() || undefined,
      channel: "Offline / Direct Store",
      itemDescription: itemDescription || product?.name || "Vedro Food Product",
      quantity: qty,
      unitPricePaise,
      subtotalPaise,
      discountPaise,
      taxPaise,
      totalPaise,
      gstRate: gstPct,
      paymentMode: paymentMode || "UPI",
      paymentStatus: paymentStatus || "PAID",
      fulfillmentStatus: (paymentStatus === "PAID" ? "FULFILLED" : "CONFIRMED") as
        | "FULFILLED"
        | "CONFIRMED",
      notes: finalNotes || undefined,
    };

    return NextResponse.json({ order: responseOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // query param was preferred
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Order ID is required for deletion" }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, customerId: true, totalPaise: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Decrement customer stats if linked
    if (existingOrder.customerId) {
      prisma.customer
        .update({
          where: { id: existingOrder.customerId },
          data: {
            orderCount: { decrement: 1 },
            totalSpentPaise: { decrement: existingOrder.totalPaise },
          },
        })
        .catch((err) => console.error("Error decrementing customer stats:", err));
    }

    // Delete lines & order in a transaction
    await prisma.$transaction([
      prisma.orderLine.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id }, select: { id: true } }),
    ]);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
