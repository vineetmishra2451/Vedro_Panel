/**
 * Centralized Business & Accounting KPI Calculation Formulas (PRD §9)
 * All monetary amounts are handled as integer paise (1 INR = 100 paise)
 */

/**
 * Net Sales/Revenue: Gross Sales less Discounts and Sales Returns, excluding GST.
 */
export function calculateNetRevenue(
  grossSalesPaise: number,
  discountsPaise: number,
  returnsPaise: number
): number {
  return Math.max(0, grossSalesPaise - discountsPaise - returnsPaise);
}

/**
 * Gross Profit: Net Revenue - COGS
 */
export function calculateGrossProfit(netRevenuePaise: number, cogsPaise: number): number {
  return netRevenuePaise - cogsPaise;
}

/**
 * Gross Margin %: Gross Profit ÷ Net Revenue × 100
 * Undefined (returns null) when net revenue is zero.
 */
export function calculateGrossMargin(netRevenuePaise: number, cogsPaise: number): number | null {
  if (netRevenuePaise <= 0) return null;
  const grossProfit = calculateGrossProfit(netRevenuePaise, cogsPaise);
  return (grossProfit / netRevenuePaise) * 100;
}

/**
 * Operating Profit / Loss: Gross Profit - Operating Expenses (including depreciation)
 */
export function calculateOperatingProfit(
  grossProfitPaise: number,
  operatingExpensesPaise: number,
  depreciationPaise: number = 0
): number {
  return grossProfitPaise - operatingExpensesPaise - depreciationPaise;
}

/**
 * Net Profit: Operating Profit + Other Income - Finance Costs - Taxes
 */
export function calculateNetProfit(
  operatingProfitPaise: number,
  otherIncomePaise: number = 0,
  financeCostsPaise: number = 0,
  taxExpensesPaise: number = 0
): number {
  return operatingProfitPaise + otherIncomePaise - financeCostsPaise - taxExpensesPaise;
}

/**
 * ROAS (Return On Ad Spend): Attributed Ad Revenue ÷ Ad Spend
 * Returns null if ad spend is 0. Note: ROAS is not profit.
 */
export function calculateROAS(attributedRevenuePaise: number, adSpendPaise: number): number | null {
  if (adSpendPaise <= 0) return null;
  return attributedRevenuePaise / adSpendPaise;
}

/**
 * CAC (Customer Acquisition Cost): Defined Acquisition Spend ÷ New Customers
 * Returns null if new customers is 0.
 */
export function calculateCAC(acquisitionSpendPaise: number, newCustomersCount: number): number | null {
  if (newCustomersCount <= 0) return null;
  return acquisitionSpendPaise / newCustomersCount;
}

/**
 * AOV (Average Order Value): Net Sales ÷ Eligible Completed Orders
 * Returns null if completed orders is 0.
 */
export function calculateAOV(netSalesPaise: number, completedOrderCount: number): number | null {
  if (completedOrderCount <= 0) return null;
  return Math.round(netSalesPaise / completedOrderCount);
}

/**
 * Inventory Value: On-hand quantity × approved cost per unit
 */
export function calculateInventoryValue(onHandQuantity: number, costPricePaise: number): number {
  return Math.max(0, onHandQuantity * costPricePaise);
}

/**
 * Contribution Margin Ratio: (Net Revenue - Variable Costs) / Net Revenue
 */
export function calculateContributionMarginRatio(
  netRevenuePaise: number,
  variableCostsPaise: number
): number | null {
  if (netRevenuePaise <= 0) return null;
  return (netRevenuePaise - variableCostsPaise) / netRevenuePaise;
}

/**
 * Break-even Sales: Fixed Costs ÷ Contribution Margin Ratio (when ratio > 0)
 */
export function calculateBreakEvenSales(
  fixedCostsPaise: number,
  contributionMarginRatio: number | null
): number | null {
  if (!contributionMarginRatio || contributionMarginRatio <= 0) return null;
  return Math.round(fixedCostsPaise / contributionMarginRatio);
}

/**
 * Runway (in months): Available Cash ÷ Forecast Monthly Net Cash Burn (when burn > 0)
 * Returns null if burn <= 0 (positive or neutral cash generation)
 */
export function calculateRunway(cashPaise: number, monthlyNetBurnPaise: number): number | null {
  if (monthlyNetBurnPaise <= 0) return null;
  return cashPaise / monthlyNetBurnPaise;
}
