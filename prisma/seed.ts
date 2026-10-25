import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed for Vedro Business Dashboard...");

  // 1. Create or update Vedro Company
  const company = await prisma.company.upsert({
    where: { id: "vedro-company-main" },
    update: {},
    create: {
      id: "vedro-company-main",
      name: "Vedro Food Products",
      gstin: "27AAAAA0000A1Z5", // Sample GSTIN for Maharashtra or configurable in settings
      financialYearStart: 4, // April
      city: "Mumbai",
      state: "Maharashtra",
      email: "accounts@vedro.com",
    },
  });

  console.log(`✓ Company ready: ${company.name} (${company.id})`);

  // 2. Create Default Admin User
  const seedPassword = process.env.ADMIN_PASSWORD || "Vedro@Life123";
  const passwordHash = await bcrypt.hash(seedPassword, 10);
  const adminUser = await prisma.appUser.upsert({
    where: { email: "admin@vedro.com" },
    update: { passwordHash },
    create: {
      email: "admin@vedro.com",
      name: "Vedro Admin",
      passwordHash,
      isActive: true,
    },
  });

  // Assign Admin Membership to Vedro
  await prisma.companyMember.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: adminUser.id,
      },
    },
    update: { role: Role.ADMIN },
    create: {
      companyId: company.id,
      userId: adminUser.id,
      role: Role.ADMIN,
    },
  });

  console.log(`✓ Admin user ready: ${adminUser.email}`);

  // 3. Create the 3 Equal Partners (Vivek, Vineet, Varunesh) with ZERO opening balance
  const partnerNames = [
    { name: "Vivek", email: "vivek@vedro.com" },
    { name: "Vineet", email: "vineet@vedro.com" },
    { name: "Varunesh", email: "varunesh@vedro.com" },
  ];

  for (const p of partnerNames) {
    const partner = await prisma.partner.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: p.name,
        },
      },
      update: { email: p.email },
      create: {
        companyId: company.id,
        name: p.name,
        email: p.email,
        isActive: true,
      },
    });
    console.log(`✓ Partner registered: ${partner.name} (Opening balance: ₹0.00)`);
  }

  // 4. Default Standard Sales Channels
  const channels = ["Offline / Direct", "Website", "Amazon", "Flipkart", "B2B Wholesale"];
  for (const ch of channels) {
    await prisma.salesChannel.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: ch,
        },
      },
      update: {},
      create: {
        companyId: company.id,
        name: ch,
        isActive: true,
      },
    });
  }
  console.log(`✓ Sales channels initialized: ${channels.join(", ")}`);

  // 5. Default Tax Codes
  const taxCodes = [
    { name: "GST 0%", cgst: 0, sgst: 0, igst: 0 },
    { name: "GST 5%", cgst: 2.5, sgst: 2.5, igst: 5 },
    { name: "GST 12%", cgst: 6, sgst: 6, igst: 12 },
    { name: "GST 18%", cgst: 9, sgst: 9, igst: 18 },
  ];

  const now = new Date();
  for (const tc of taxCodes) {
    await prisma.taxCode.upsert({
      where: {
        companyId_name_effectiveFrom: {
          companyId: company.id,
          name: tc.name,
          effectiveFrom: new Date("2026-04-01T00:00:00Z"),
        },
      },
      update: {},
      create: {
        companyId: company.id,
        name: tc.name,
        cgstRate: tc.cgst,
        sgstRate: tc.sgst,
        igstRate: tc.igst,
        effectiveFrom: new Date("2026-04-01T00:00:00Z"),
        isActive: true,
      },
    });
  }
  console.log(`✓ GST Tax codes configured: 0%, 5%, 12%, 18%`);

  // 6. Default Inventory Location
  await prisma.inventoryLocation.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "Main Storage Facility",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      name: "Main Storage Facility",
      address: "Central Unit",
      isActive: true,
    },
  });
  console.log("✓ Default inventory location ready");

  // 7. Standard Chart of Accounts (Opening balance 0)
  const defaultAccounts = [
    { code: "1000", name: "Bank Account (Current)", type: "ASSET" },
    { code: "1010", name: "Cash in Hand", type: "ASSET" },
    { code: "1020", name: "UPI Collections Account", type: "ASSET" },
    { code: "1100", name: "Accounts Receivable (Debtors)", type: "ASSET" },
    { code: "1200", name: "Inventory Stock Account", type: "ASSET" },
    { code: "1500", name: "Equipment & Machinery", type: "ASSET" },
    { code: "2000", name: "Accounts Payable (Creditors)", type: "LIABILITY" },
    { code: "2100", name: "GST Payable (Output CGST/SGST/IGST)", type: "LIABILITY" },
    { code: "2200", name: "Partner Loan Accounts", type: "LIABILITY" },
    { code: "3010", name: "Partner Capital - Vivek", type: "EQUITY" },
    { code: "3020", name: "Partner Capital - Vineet", type: "EQUITY" },
    { code: "3030", name: "Partner Capital - Varunesh", type: "EQUITY" },
    { code: "4000", name: "Sales Revenue (Food Products)", type: "REVENUE" },
    { code: "5000", name: "Cost of Goods Sold (COGS)", type: "EXPENSE" },
    { code: "5100", name: "Packaging & Materials", type: "EXPENSE" },
    { code: "5200", name: "Marketing & Advertising", type: "EXPENSE" },
    { code: "5300", name: "Shipping & Delivery", type: "EXPENSE" },
    { code: "5400", name: "Equipment Maintenance", type: "EXPENSE" },
    { code: "5500", name: "Depreciation Expense", type: "EXPENSE" },
    { code: "5600", name: "General & Administrative", type: "EXPENSE" },
  ];

  for (const acc of defaultAccounts) {
    await prisma.account.upsert({
      where: {
        companyId_code: {
          companyId: company.id,
          code: acc.code,
        },
      },
      update: {},
      create: {
        companyId: company.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        isActive: true,
      },
    });
  }
  console.log(`✓ Chart of accounts initialized (${defaultAccounts.length} accounts, 0 balances)`);

  // 8. Product Categories (3 Core Lines)
  const categories = [
    { name: "Dairy & Clarified Butter" },
    { name: "Edible Oils & Fats" },
    { name: "Natural Sweeteners & Jaggery" },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const createdCat = await prisma.productCategory.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: cat.name,
        },
      },
      update: {},
      create: {
        companyId: company.id,
        name: cat.name,
      },
    });
    categoryMap.set(cat.name, createdCat.id);
  }
  console.log(`✓ Product categories seeded: ${categories.map((c) => c.name).join(", ")}`);

  // 9. Vedro SKUs (10 Total SKUs)
  const seedProducts = [
    // Ghee
    {
      sku: "VED-GHEE-250ML",
      name: "Pure A2 Desi Cow Bilona Ghee 250ml",
      categoryName: "Dairy & Clarified Butter",
      unit: "JAR",
      hsnCode: "04059020",
      costPricePaise: 28000,
      sellingPricePaise: 39900,
      reorderLevel: 25,
    },
    {
      sku: "VED-GHEE-500ML",
      name: "Pure A2 Desi Cow Bilona Ghee 500ml",
      categoryName: "Dairy & Clarified Butter",
      unit: "JAR",
      hsnCode: "04059020",
      costPricePaise: 55000,
      sellingPricePaise: 74900,
      reorderLevel: 30,
    },
    {
      sku: "VED-GHEE-1LTR",
      name: "Pure A2 Desi Cow Bilona Ghee 1 Litre",
      categoryName: "Dairy & Clarified Butter",
      unit: "JAR",
      hsnCode: "04059020",
      costPricePaise: 105000,
      sellingPricePaise: 144900,
      reorderLevel: 20,
    },
    // Mustard Oil
    {
      sku: "VED-OIL-300ML",
      name: "Cold-Pressed Kachi Ghani Mustard Oil 300ml",
      categoryName: "Edible Oils & Fats",
      unit: "BOTTLE",
      hsnCode: "15149100",
      costPricePaise: 6000,
      sellingPricePaise: 8900,
      reorderLevel: 50,
    },
    {
      sku: "VED-OIL-500ML",
      name: "Cold-Pressed Kachi Ghani Mustard Oil 500ml",
      categoryName: "Edible Oils & Fats",
      unit: "BOTTLE",
      hsnCode: "15149100",
      costPricePaise: 9500,
      sellingPricePaise: 13900,
      reorderLevel: 50,
    },
    {
      sku: "VED-OIL-1LTR",
      name: "Cold-Pressed Kachi Ghani Mustard Oil 1 Litre",
      categoryName: "Edible Oils & Fats",
      unit: "BOTTLE",
      hsnCode: "15149100",
      costPricePaise: 17500,
      sellingPricePaise: 24900,
      reorderLevel: 40,
    },
    {
      sku: "VED-OIL-2LTR",
      name: "Cold-Pressed Kachi Ghani Mustard Oil 2 Litre",
      categoryName: "Edible Oils & Fats",
      unit: "CAN",
      hsnCode: "15149100",
      costPricePaise: 34000,
      sellingPricePaise: 47900,
      reorderLevel: 25,
    },
    {
      sku: "VED-OIL-5LTR",
      name: "Cold-Pressed Kachi Ghani Mustard Oil 5 Litre",
      categoryName: "Edible Oils & Fats",
      unit: "TIN",
      hsnCode: "15149100",
      costPricePaise: 82000,
      sellingPricePaise: 114900,
      reorderLevel: 20,
    },
    // Jaggery
    {
      sku: "VED-JAG-500GM",
      name: "Natural Chemical-Free Organic Jaggery 500g",
      categoryName: "Natural Sweeteners & Jaggery",
      unit: "POUCH",
      hsnCode: "17011490",
      costPricePaise: 4500,
      sellingPricePaise: 6900,
      reorderLevel: 50,
    },
    {
      sku: "VED-JAG-1KG",
      name: "Natural Chemical-Free Organic Jaggery 1kg",
      categoryName: "Natural Sweeteners & Jaggery",
      unit: "POUCH",
      hsnCode: "17011490",
      costPricePaise: 8000,
      sellingPricePaise: 12500,
      reorderLevel: 40,
    },
  ];

  for (const prod of seedProducts) {
    const catId = categoryMap.get(prod.categoryName);
    await prisma.product.upsert({
      where: {
        companyId_sku: {
          companyId: company.id,
          sku: prod.sku,
        },
      },
      update: {},
      create: {
        companyId: company.id,
        sku: prod.sku,
        name: prod.name,
        categoryId: catId,
        unit: prod.unit,
        hsnCode: prod.hsnCode,
        costPricePaise: prod.costPricePaise,
        sellingPricePaise: prod.sellingPricePaise,
        reorderLevel: prod.reorderLevel,
        isActive: true,
      },
    });
  }
  console.log(`✓ 10 Vedro SKUs seeded across Ghee, Mustard Oil, and Jaggery`);

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
