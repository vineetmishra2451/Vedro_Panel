import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MovementType, MovementStatus } from "@prisma/client";
import { DEFAULT_CATALOG, ensureDefaultProducts } from "../products/route";
import {
  getCachedLocationId,
  setCachedLocationId,
  getCachedChannelId,
  setCachedChannelId,
} from "@/lib/static-cache";
import { startPerf, withPerfHeaders } from "@/lib/perf";

const DEFAULT_COMPANY_ID = "vedro-company-main";

async function getOrCreateLocation(): Promise<string> {
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

/**
 * Fast database-level aggregation of available stock using PostgreSQL groupBy.
 * Avoids transferring large arrays of movement records into Node memory.
 */
async function getProductAvailableStock(productId: string): Promise<number> {
  const movementSums = await prisma.inventoryMovement.groupBy({
    by: ["type"],
    where: {
      companyId: DEFAULT_COMPANY_ID,
      productId,
      status: MovementStatus.APPROVED,
    },
    _sum: { quantity: true },
  });

  let stock = 0;
  for (const m of movementSums) {
    const qty = m._sum.quantity || 0;
    if (m.type === "PURCHASE" || m.type === "OPENING" || m.type === "RETURN") {
      stock += qty;
    } else if (m.type === "SALE" || m.type === "WASTAGE") {
      stock -= qty;
    }
  }
  return Math.max(0, stock);
}

export async function GET(req: Request) {
  const perf = startPerf("GET_ORDERS", req);
  try {
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
    const [totalCount, dbOrders] = await perf.step("db_queries", () =>
      Promise.all([
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
      ])
    );

    const formattedOrders = dbOrders.map((order) => {
      const primaryLine = order.lines[0];
      const itemDesc =
        primaryLine?.product?.name ||
        primaryLine?.product?.sku ||
        order.notes ||
        "Vedro Food Product";
      const sku = primaryLine?.product?.sku || undefined;
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
        sku,
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

    const res = NextResponse.json({
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
    return withPerfHeaders(res, perf, 200);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 }),
      perf,
      500
    );
  }
}

export async function POST(req: Request) {
  const perf = startPerf("POST_ORDER", req);
  try {
    const session = await auth();
    const body = await req.json();

    const {
      date,
      customerName,
      customerPhone,
      itemDescription,
      sku: providedSku,
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

    // Determine target SKU from providedSku or parsed from itemDescription
    let targetSku = (providedSku || "").trim().toUpperCase();
    if (!targetSku && itemDescription) {
      const skuMatch = itemDescription.match(/VED-[A-Z0-9-]+/i);
      if (skuMatch) {
        targetSku = skuMatch[0].toUpperCase();
      }
    }

    // Resolve channel from in-memory cache if warm
    const cachedChanId = getCachedChannelId();

    // Run channel, customer check, and product lookups in parallel for maximum database speed
    const [existingChannel, existingCustomer, initialProduct] = await perf.step("lookup_prep", () =>
      Promise.all([
        !cachedChanId
          ? prisma.salesChannel.findFirst({
              where: {
                companyId: DEFAULT_COMPANY_ID,
                name: { contains: "Offline", mode: "insensitive" },
              },
              select: { id: true, name: true },
            })
          : null,
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
              ...(targetSku ? [{ sku: { equals: targetSku, mode: "insensitive" } }] : []),
              { sku: { contains: itemDescription, mode: "insensitive" } },
              { name: { contains: itemDescription, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            sku: true,
            costPricePaise: true,
            sellingPricePaise: true,
          },
        }),
      ])
    );

    let product = initialProduct;

    // Fallback: If product wasn't found in DB, ensure catalog products exist and re-query
    if (!product) {
      await ensureDefaultProducts();
      product = await prisma.product.findFirst({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          OR: [
            ...(targetSku ? [{ sku: { equals: targetSku, mode: "insensitive" } }] : []),
            { sku: { contains: itemDescription, mode: "insensitive" } },
            { name: { contains: itemDescription, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          sku: true,
          costPricePaise: true,
          sellingPricePaise: true,
        },
      });
    }

    // Fallback if still not found: grab first active product
    if (!product) {
      product = await prisma.product.findFirst({
        where: { companyId: DEFAULT_COMPANY_ID },
        select: {
          id: true,
          name: true,
          sku: true,
          costPricePaise: true,
          sellingPricePaise: true,
        },
      });
    }

    // ---------------------------------------------------------
    // CRITICAL STOCK & INVENTORY MATCHING VALIDATION:
    // If a product is identified, check current available stock.
    // Show error notification / 400 if requested quantity > stock!
    // ---------------------------------------------------------
    let availableStock = 0;
    if (product) {
      availableStock = await getProductAvailableStock(product.id);
      if (qty > availableStock) {
        return withPerfHeaders(
          NextResponse.json(
            {
              error: `Stock Mismatch: Requested ${qty} units, but only ${availableStock} units of "${product.name}" (${product.sku}) are available in inventory. Please adjust order quantity or restock inventory first.`,
              stockMismatch: true,
              insufficientStock: true,
              sku: product.sku,
              productName: product.name,
              availableStock,
              requestedQuantity: qty,
            },
            { status: 400 }
          ),
          perf,
          400
        );
      }
    }

    // Fast channel resolution
    let channelId = cachedChanId || existingChannel?.id;
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
    setCachedChannelId(channelId);

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

    const orderNumber = `VED-OFF-${Date.now().toString().slice(-6)}`;
    const createdBy = session?.user?.name || "System";
    const locationId = await getOrCreateLocation();

    // ---------------------------------------------------------
    // ATOMIC TRANSACTION:
    // Create Order, OrderLine, AND InventoryMovement (MovementType.SALE)
    // Automatically reducing the inventory stock for this SKU!
    // ---------------------------------------------------------
    const [newOrder, inventoryMovement] = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
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
        select: {
          id: true,
          orderNumber: true,
          date: true,
          totalPaise: true,
        },
      });

      let movement = null;
      if (product) {
        movement = await tx.inventoryMovement.create({
          data: {
            companyId: DEFAULT_COMPANY_ID,
            productId: product.id,
            locationId,
            type: MovementType.SALE,
            status: MovementStatus.APPROVED,
            quantity: qty,
            costPricePaise: product.costPricePaise || 0,
            orderId: order.id,
            reference: order.orderNumber,
            reason: `Sale Order ${order.orderNumber} (${trimmedName || "Walk-in Retail Customer"})`,
            createdBy,
          },
          select: {
            id: true,
            quantity: true,
            type: true,
            status: true,
          },
        });
      }

      return [order, movement];
    });

    const responseOrder = {
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      date: newOrder.date.toISOString().split("T")[0],
      customerName: trimmedName || "Walk-in Retail Customer",
      customerPhone: trimmedPhone || undefined,
      channel: existingChannel?.name || "Offline / Direct Store",
      sku: product?.sku,
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
      remainingStock: product ? availableStock - qty : undefined,
    };

    const res = NextResponse.json(
      {
        order: responseOrder,
        inventoryMovement,
        message: product
          ? `Sale recorded! Automatically deducted ${qty} units of ${product.sku} from inventory. Remaining stock: ${availableStock - qty}.`
          : "Order recorded successfully.",
      },
      { status: 201 }
    );
    return withPerfHeaders(res, perf, 201);
  } catch (error) {
    console.error("Error creating order:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to record order" }, { status: 500 }),
      perf,
      500
    );
  }
}

export async function PUT(req: Request) {
  const perf = startPerf("PUT_ORDER", req);
  try {
    const session = await auth();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return withPerfHeaders(
        NextResponse.json({ error: "Order ID is required for editing" }, { status: 400 }),
        perf,
        400
      );
    }

    const {
      date,
      customerName,
      customerPhone,
      itemDescription,
      sku: providedSku,
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

    // Determine target SKU
    let targetSku = (providedSku || "").trim().toUpperCase();
    if (!targetSku && itemDescription) {
      const skuMatch = itemDescription.match(/VED-[A-Z0-9-]+/i);
      if (skuMatch) {
        targetSku = skuMatch[0].toUpperCase();
      }
    }

    // Fetch existing order, existing inventory movement, and product in parallel
    const [existingOrder, existingMovement, initialProduct] = await Promise.all([
      prisma.order.findUnique({
        where: { id },
        select: { id: true, customerId: true, totalPaise: true, orderNumber: true },
      }),
      prisma.inventoryMovement.findFirst({
        where: { orderId: id, type: MovementType.SALE },
        select: { id: true, productId: true, quantity: true },
      }),
      prisma.product.findFirst({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          OR: [
            ...(targetSku ? [{ sku: { equals: targetSku, mode: "insensitive" } }] : []),
            { sku: { contains: itemDescription, mode: "insensitive" } },
            { name: { contains: itemDescription, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          sku: true,
          costPricePaise: true,
          sellingPricePaise: true,
        },
      }),
    ]);

    if (!existingOrder) {
      return withPerfHeaders(
        NextResponse.json({ error: "Order not found" }, { status: 404 }),
        perf,
        404
      );
    }

    let product = initialProduct;
    if (!product) {
      await ensureDefaultProducts();
      product = await prisma.product.findFirst({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          OR: [
            ...(targetSku ? [{ sku: { equals: targetSku, mode: "insensitive" } }] : []),
            { sku: { contains: itemDescription, mode: "insensitive" } },
            { name: { contains: itemDescription, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          sku: true,
          costPricePaise: true,
          sellingPricePaise: true,
        },
      });
    }

    // ---------------------------------------------------------
    // STOCK VALIDATION ON UPDATE:
    // Headroom = current available stock + previously reserved qty for this order
    // ---------------------------------------------------------
    let availableHeadroom = 0;
    if (product) {
      const currentStock = await getProductAvailableStock(product.id);
      const existingMovementQty =
        existingMovement && existingMovement.productId === product.id ? existingMovement.quantity : 0;
      availableHeadroom = currentStock + existingMovementQty;

      if (qty > availableHeadroom) {
        return withPerfHeaders(
          NextResponse.json(
            {
              error: `Stock Mismatch: Updated quantity of ${qty} units exceeds available stock of ${availableHeadroom} units for "${product.name}" (${product.sku}).`,
              stockMismatch: true,
              insufficientStock: true,
              sku: product.sku,
              productName: product.name,
              availableStock: availableHeadroom,
              requestedQuantity: qty,
            },
            { status: 400 }
          ),
          perf,
          400
        );
      }
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

    const locationId = await getOrCreateLocation();

    // Delete existing lines and update order & inventory movement in a single transaction
    await perf.step("tx_update", () =>
      prisma.$transaction(async (tx) => {
        await tx.orderLine.deleteMany({ where: { orderId: id } });
        await tx.order.update({
          where: { id },
          data: {
            date: new Date(date || Date.now()),
            status: paymentStatus === "PAID" ? "FULFILLED" : "CONFIRMED",
            subtotalPaise,
            discountPaise,
            taxPaise,
            totalPaise,
            notes: finalNotes,
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
          select: { id: true },
        });

        if (product) {
          if (existingMovement) {
            await tx.inventoryMovement.update({
              where: { id: existingMovement.id },
              data: {
                productId: product.id,
                quantity: qty,
                reference: existingOrder.orderNumber,
                costPricePaise: product.costPricePaise || 0,
                reason: `Updated Sale Order ${existingOrder.orderNumber}`,
              },
            });
          } else {
            await tx.inventoryMovement.create({
              data: {
                companyId: DEFAULT_COMPANY_ID,
                productId: product.id,
                locationId,
                type: MovementType.SALE,
                status: MovementStatus.APPROVED,
                quantity: qty,
                costPricePaise: product.costPricePaise || 0,
                orderId: id,
                reference: existingOrder.orderNumber,
                reason: `Sale Order ${existingOrder.orderNumber}`,
                createdBy: session?.user?.name || "System",
              },
            });
          }
        }
      })
    );

    const responseOrder = {
      id: existingOrder.id,
      orderNumber: existingOrder.orderNumber,
      date: new Date(date || Date.now()).toISOString().split("T")[0],
      customerName: (customerName || "").trim() || "Walk-in Retail Customer",
      customerPhone: (customerPhone || "").trim() || undefined,
      channel: "Offline / Direct Store",
      sku: product?.sku,
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
      remainingStock: product ? availableHeadroom - qty : undefined,
    };

    return withPerfHeaders(
      NextResponse.json({
        order: responseOrder,
        message: `Order ${existingOrder.orderNumber} updated! Inventory stock adjusted to ${qty} units.`,
      }),
      perf,
      200
    );
  } catch (error) {
    console.error("Error updating order:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to update order" }, { status: 500 }),
      perf,
      500
    );
  }
}

export async function DELETE(req: Request) {
  const perf = startPerf("DELETE_ORDER", req);
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
      return withPerfHeaders(
        NextResponse.json({ error: "Order ID is required for deletion" }, { status: 400 }),
        perf,
        400
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, customerId: true, totalPaise: true, orderNumber: true },
    });

    if (!existingOrder) {
      return withPerfHeaders(
        NextResponse.json({ error: "Order not found" }, { status: 404 }),
        perf,
        404
      );
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

    // ---------------------------------------------------------
    // RESTORE STOCK:
    // Delete any associated InventoryMovement (MovementType.SALE)
    // and delete order lines & order in a single transaction
    // ---------------------------------------------------------
    await perf.step("tx_delete", () =>
      prisma.$transaction([
        prisma.inventoryMovement.deleteMany({ where: { orderId: id } }),
        prisma.orderLine.deleteMany({ where: { orderId: id } }),
        prisma.order.delete({ where: { id }, select: { id: true } }),
      ])
    );

    return withPerfHeaders(
      NextResponse.json({
        success: true,
        deletedId: id,
        message: `Order ${existingOrder.orderNumber} deleted. Stock restored to inventory.`,
      }),
      perf,
      200
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return withPerfHeaders(
      NextResponse.json({ error: "Failed to delete order" }, { status: 500 }),
      perf,
      500
    );
  }
}
