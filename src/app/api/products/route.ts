import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MovementType, MovementStatus } from "@prisma/client";

const DEFAULT_COMPANY_ID = "vedro-company-main";

// Standard 10 Vedro Catalog SKUs fallback if database was freshly initialized
export const DEFAULT_CATALOG = [
  {
    sku: "VED-GHEE-250ML",
    name: "Pure A2 Desi Cow Bilona Ghee 250ml",
    category: "Dairy & Clarified Butter",
    unit: "JAR",
    hsnCode: "04059020",
    gstRate: 12,
    costPricePaise: 28000,
    sellingPricePaise: 39900,
    reorderLevel: 25,
  },
  {
    sku: "VED-GHEE-500ML",
    name: "Pure A2 Desi Cow Bilona Ghee 500ml",
    category: "Dairy & Clarified Butter",
    unit: "JAR",
    hsnCode: "04059020",
    gstRate: 12,
    costPricePaise: 55000,
    sellingPricePaise: 74900,
    reorderLevel: 30,
  },
  {
    sku: "VED-GHEE-1LTR",
    name: "Pure A2 Desi Cow Bilona Ghee 1 Litre",
    category: "Dairy & Clarified Butter",
    unit: "JAR",
    hsnCode: "04059020",
    gstRate: 12,
    costPricePaise: 105000,
    sellingPricePaise: 144900,
    reorderLevel: 20,
  },
  {
    sku: "VED-OIL-300ML",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 300ml",
    category: "Edible Oils & Fats",
    unit: "BOTTLE",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 6000,
    sellingPricePaise: 8900,
    reorderLevel: 50,
  },
  {
    sku: "VED-OIL-500ML",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 500ml",
    category: "Edible Oils & Fats",
    unit: "BOTTLE",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 9500,
    sellingPricePaise: 13900,
    reorderLevel: 50,
  },
  {
    sku: "VED-OIL-1LTR",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 1 Litre",
    category: "Edible Oils & Fats",
    unit: "BOTTLE",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 17500,
    sellingPricePaise: 24900,
    reorderLevel: 40,
  },
  {
    sku: "VED-OIL-2LTR",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 2 Litre",
    category: "Edible Oils & Fats",
    unit: "CAN",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 34000,
    sellingPricePaise: 47900,
    reorderLevel: 25,
  },
  {
    sku: "VED-OIL-5LTR",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 5 Litre",
    category: "Edible Oils & Fats",
    unit: "TIN",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 82000,
    sellingPricePaise: 114900,
    reorderLevel: 20,
  },
  {
    sku: "VED-JAG-500GM",
    name: "Natural Chemical-Free Organic Jaggery 500g",
    category: "Natural Sweeteners & Jaggery",
    unit: "POUCH",
    hsnCode: "17011490",
    gstRate: 5,
    costPricePaise: 4500,
    sellingPricePaise: 6900,
    reorderLevel: 50,
  },
  {
    sku: "VED-JAG-1KG",
    name: "Natural Chemical-Free Organic Jaggery 1kg",
    category: "Natural Sweeteners & Jaggery",
    unit: "POUCH",
    hsnCode: "17011490",
    gstRate: 5,
    costPricePaise: 8000,
    sellingPricePaise: 12500,
    reorderLevel: 40,
  },
];

export async function ensureDefaultProducts() {
  const count = await prisma.product.count({
    where: { companyId: DEFAULT_COMPANY_ID },
  });

  if (count === 0) {
    // Upsert default company first
    await prisma.company.upsert({
      where: { id: DEFAULT_COMPANY_ID },
      update: {},
      create: {
        id: DEFAULT_COMPANY_ID,
        name: "Vedro Food Products",
      },
    });

    for (const item of DEFAULT_CATALOG) {
      await prisma.product.upsert({
        where: {
          companyId_sku: {
            companyId: DEFAULT_COMPANY_ID,
            sku: item.sku,
          },
        },
        update: {},
        create: {
          companyId: DEFAULT_COMPANY_ID,
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          hsnCode: item.hsnCode,
          costPricePaise: item.costPricePaise,
          sellingPricePaise: item.sellingPricePaise,
          reorderLevel: item.reorderLevel,
          isActive: true,
        },
      });
    }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Ensure catalog products exist
    await ensureDefaultProducts();

    // Batch query products and stock movements in parallel
    const [dbProducts, movements] = await Promise.all([
      prisma.product.findMany({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          isActive: true,
          ...(category && category !== "ALL"
            ? { category: { name: { contains: category, mode: "insensitive" } } }
            : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { sku: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          hsnCode: true,
          costPricePaise: true,
          sellingPricePaise: true,
          reorderLevel: true,
          isActive: true,
          category: { select: { name: true } },
          taxCode: { select: { cgstRate: true, sgstRate: true, igstRate: true } },
          inventoryMovements: {
            where: { status: "APPROVED" },
            select: {
              type: true,
              quantity: true,
            },
          },
        },
        orderBy: { sku: "asc" },
      }),
      prisma.inventoryMovement.findMany({
        where: { companyId: DEFAULT_COMPANY_ID },
        select: {
          id: true,
          type: true,
          status: true,
          quantity: true,
          costPricePaise: true,
          reference: true,
          reason: true,
          createdAt: true,
          product: { select: { sku: true, name: true, unit: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // Calculate dynamic available stock for each product
    let totalInventoryValuePaise = 0;
    let totalUnitsInStock = 0;

    const formattedProducts = dbProducts.map((p) => {
      let stock = 0;
      for (const m of p.inventoryMovements) {
        if (m.type === "PURCHASE" || m.type === "OPENING" || m.type === "RETURN") {
          stock += m.quantity;
        } else if (m.type === "SALE" || m.type === "WASTAGE") {
          stock -= m.quantity;
        }
      }
      stock = Math.max(0, stock);

      const effectiveCost = p.costPricePaise || 0;
      const productValuation = stock * effectiveCost;
      totalInventoryValuePaise += productValuation;
      totalUnitsInStock += stock;

      const gst = p.taxCode
        ? p.taxCode.cgstRate + p.taxCode.sgstRate
        : p.sku.includes("GHEE")
        ? 12
        : 5;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category?.name || (p.sku.includes("GHEE") ? "Dairy & Clarified Butter" : p.sku.includes("OIL") ? "Edible Oils & Fats" : "Natural Sweeteners & Jaggery"),
        unit: p.unit,
        hsnCode: p.hsnCode || undefined,
        gstRate: gst,
        costPricePaise: effectiveCost,
        sellingPricePaise: p.sellingPricePaise,
        availableStock: stock,
        reorderLevel: p.reorderLevel,
        status: p.isActive ? "ACTIVE" : "INACTIVE",
        valuationPaise: productValuation,
      };
    });

    const formattedMovements = movements.map((m) => ({
      id: m.id,
      date: m.createdAt.toISOString().split("T")[0],
      type: m.type,
      productSku: m.product.sku,
      productName: m.product.name,
      quantity: m.quantity,
      unit: m.product.unit,
      unitCostPaise: m.costPricePaise,
      totalCostPaise: m.quantity * m.costPricePaise,
      supplierName: m.reason || undefined,
      invoiceRef: m.reference || undefined,
      status: m.status,
      notes: m.reason || undefined,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      products: formattedProducts,
      movements: formattedMovements,
      totalInventoryValuePaise,
      totalUnitsInStock,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();

    // 1. Handle Stock Movement (Inward, Purchase, Opening, Return, Wastage)
    if (body.action === "movement") {
      const {
        productSku,
        type = "PURCHASE",
        quantity,
        unitCostRupees,
        supplierName,
        invoiceRef,
        batchNumber,
        notes,
      } = body;

      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: "Invalid quantity for stock movement" }, { status: 400 });
      }

      const targetProduct = await prisma.product.findFirst({
        where: {
          companyId: DEFAULT_COMPANY_ID,
          OR: [
            { sku: { equals: productSku?.trim(), mode: "insensitive" } },
            { name: { contains: productSku?.trim(), mode: "insensitive" } },
          ],
        },
      });

      if (!targetProduct) {
        return NextResponse.json({ error: `Product with SKU "${productSku}" not found` }, { status: 404 });
      }

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

      const unitCost = parseFloat(unitCostRupees);
      const unitCostPaise = !isNaN(unitCost) && unitCost > 0
        ? Math.round(unitCost * 100)
        : targetProduct.costPricePaise;

      const movement = await prisma.inventoryMovement.create({
        data: {
          companyId: DEFAULT_COMPANY_ID,
          productId: targetProduct.id,
          locationId: location.id,
          type: (type as MovementType) || MovementType.PURCHASE,
          status: MovementStatus.APPROVED,
          quantity: qty,
          costPricePaise: unitCostPaise,
          reference: invoiceRef || batchNumber || `STK-${Date.now().toString().slice(-6)}`,
          reason: notes || (supplierName ? `Stock ${type} - ${supplierName}` : `Stock ${type}`),
          createdBy: session?.user?.name || "Inventory Manager",
        },
      });

      return NextResponse.json({ success: true, movement });
    }

    const {
      sku,
      name,
      category,
      unit = "JAR",
      hsnCode,
      gstRate,
      costRupees,
      sellingRupees,
      reorderLevel = 30,
      initialStock = 0,
      notes,
    } = body;

    if (!sku || !name) {
      return NextResponse.json({ error: "SKU and Name are required" }, { status: 400 });
    }

    const costPricePaise = Math.round((parseFloat(costRupees) || 0) * 100);
    const sellingPricePaise = Math.round((parseFloat(sellingRupees) || 0) * 100);
    const initialQty = parseInt(initialStock) || 0;
    const reorder = parseInt(reorderLevel) || 30;

    // Check duplicate
    const existing = await prisma.product.findUnique({
      where: {
        companyId_sku: {
          companyId: DEFAULT_COMPANY_ID,
          sku: sku.trim().toUpperCase(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Product with SKU "${sku}" already exists` },
        { status: 409 }
      );
    }

    // Ensure location
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

    const createdProduct = await prisma.product.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        unit: unit.toUpperCase(),
        hsnCode: hsnCode?.trim() || null,
        costPricePaise,
        sellingPricePaise,
        reorderLevel: reorder,
        isActive: true,
        ...(initialQty > 0
          ? {
              inventoryMovements: {
                create: [
                  {
                    companyId: DEFAULT_COMPANY_ID,
                    locationId: location.id,
                    type: MovementType.OPENING,
                    status: MovementStatus.APPROVED,
                    quantity: initialQty,
                    costPricePaise,
                    reference: "INIT-STOCK",
                    reason: notes || "Opening stock migration",
                    createdBy: session?.user?.name || "Inventory Manager",
                  },
                ],
              },
            }
          : {}),
      },
      select: {
        id: true,
        sku: true,
        name: true,
        unit: true,
        hsnCode: true,
        costPricePaise: true,
        sellingPricePaise: true,
        reorderLevel: true,
      },
    });

    return NextResponse.json({
      product: {
        ...createdProduct,
        availableStock: initialQty,
        category: category || "General",
        status: "ACTIVE",
        gstRate: parseFloat(gstRate) || 5,
      },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { id, sku, name, costRupees, sellingRupees, reorderLevel } = body;

    if (!id && !sku) {
      return NextResponse.json({ error: "Product id or sku required" }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: id
        ? { id }
        : {
            companyId_sku: {
              companyId: DEFAULT_COMPANY_ID,
              sku: sku.toUpperCase(),
            },
          },
      data: {
        ...(name ? { name } : {}),
        ...(costRupees !== undefined
          ? { costPricePaise: Math.round(parseFloat(costRupees) * 100) }
          : {}),
        ...(sellingRupees !== undefined
          ? { sellingPricePaise: Math.round(parseFloat(sellingRupees) * 100) }
          : {}),
        ...(reorderLevel !== undefined ? { reorderLevel: parseInt(reorderLevel) } : {}),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
