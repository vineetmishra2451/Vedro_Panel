import assert from "node:assert";
import {
  calculateNetRevenue,
  calculateGrossProfit,
  calculateGrossMargin,
  calculateOperatingProfit,
  calculateNetProfit,
  calculateROAS,
  calculateCAC,
  calculateAOV,
  calculateInventoryValue,
  calculateBreakEvenSales,
  calculateRunway,
} from "./src/lib/kpi.ts";
import { formatINR, rupeesToPaise, formatCompactINR } from "./src/lib/format.ts";

console.log("🧪 Running Vedro Business Dashboard Core Logic Tests...\n");

// 1. Currency & Paise conversions
console.log("Testing currency formatting and paise conversion...");
assert.strictEqual(rupeesToPaise(100), 10000);
assert.strictEqual(rupeesToPaise("₹1,234.50"), 123450);
assert.strictEqual(formatINR(10000), "₹100.00");
assert.strictEqual(formatINR(12345600), "₹1,23,456.00");
assert.strictEqual(formatCompactINR(15000000), "₹1.50 L");
assert.strictEqual(formatCompactINR(2500000000), "₹2.50 Cr");
console.log("✓ Currency formatting & conversion passed!\n");

// 2. Net Revenue & Gross Profit (PRD §9)
console.log("Testing PRD §9 Revenue & Margin formulas...");
const grossSales = 5000000; // ₹50,000
const discounts = 200000;   // ₹2,000
const returns = 300000;     // ₹3,000
const netRevenue = calculateNetRevenue(grossSales, discounts, returns);
assert.strictEqual(netRevenue, 4500000); // ₹45,000

const cogs = 2500000; // ₹25,000
const grossProfit = calculateGrossProfit(netRevenue, cogs);
assert.strictEqual(grossProfit, 2000000); // ₹20,000

const grossMargin = calculateGrossMargin(netRevenue, cogs);
assert(grossMargin !== null && Math.abs(grossMargin - 44.44) < 0.1);

// Zero revenue check (should not divide by zero or show fake values)
assert.strictEqual(calculateGrossMargin(0, 0), null);
console.log("✓ Revenue & Gross Profit formulas passed!\n");

// 3. Operating Profit & Net Profit
console.log("Testing Operating & Net profit calculations...");
const opex = 800000; // ₹8,000
const depreciation = 200000; // ₹2,000
const operatingProfit = calculateOperatingProfit(grossProfit, opex, depreciation);
assert.strictEqual(operatingProfit, 1000000); // ₹10,000

const netProfit = calculateNetProfit(operatingProfit, 50000, 100000, 150000);
assert.strictEqual(netProfit, 800000); // ₹8,000
console.log("✓ Operating & Net Profit calculations passed!\n");

// 4. Marketing Metrics (ROAS ≠ Profit safeguard)
console.log("Testing Marketing ROAS & CAC safeguards...");
const adSpend = 1000000; // ₹10,000
const attributedRev = 3500000; // ₹35,000
const roas = calculateROAS(attributedRev, adSpend);
assert.strictEqual(roas, 3.5);
assert.strictEqual(calculateROAS(100, 0), null); // no division by 0

const cac = calculateCAC(adSpend, 25);
assert.strictEqual(cac, 40000); // ₹400 per customer
console.log("✓ Marketing formulas passed!\n");

// 5. Inventory & Runway
console.log("Testing Inventory Valuation & Cash Runway...");
const inventoryVal = calculateInventoryValue(250, 4000); // 250 units @ ₹40
assert.strictEqual(inventoryVal, 1000000); // ₹10,000

const runway = calculateRunway(10000000, 2000000); // ₹1L cash ÷ ₹20k monthly burn
assert.strictEqual(runway, 5); // 5 months
assert.strictEqual(calculateRunway(1000000, -50000), null); // cash generative
console.log("✓ Inventory & Runway formulas passed!\n");

// 6. Partner Capital Calculations (Vivek, Vineet, Varunesh starting at 0)
console.log("Testing Partner Capital balance tracking...");
let vivekBalance = 0;
let vineetBalance = 0;
let varuneshBalance = 0;

// Vivek adds 50k capital
vivekBalance += rupeesToPaise(50000);
assert.strictEqual(vivekBalance, 5000000);

// Vineet adds 75k capital
vineetBalance += rupeesToPaise(75000);
assert.strictEqual(vineetBalance, 7500000);

// Varunesh adds 50k capital
varuneshBalance += rupeesToPaise(50000);
assert.strictEqual(varuneshBalance, 5000000);

// Vivek withdraws 10k
vivekBalance -= rupeesToPaise(10000);
assert.strictEqual(vivekBalance, 4000000);

const totalPartnershipCapital = vivekBalance + vineetBalance + varuneshBalance;
assert.strictEqual(totalPartnershipCapital, 16500000); // ₹1,65,000
assert.strictEqual(formatINR(totalPartnershipCapital), "₹1,65,000.00");
console.log("✓ Partner Capital balance math verified!\n");

console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀");
