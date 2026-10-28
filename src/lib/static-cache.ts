/**
 * In-memory singleton metadata cache for server-side route handlers.
 * Eliminates redundant database round-trips for fixed lookup entities:
 * (Default Company, Default Location, Sales Channels, Seeded Partner Accounts, Chart of Accounts).
 * 
 * In serverless environments, these variables stay in memory across warm lambda executions.
 */

interface AccountLookup {
  id: string;
  code: string;
  name: string;
  type: string;
}

const globalForStatic = globalThis as unknown as {
  __vedro_company_ensured?: boolean;
  __vedro_products_seeded?: boolean;
  __vedro_partners_ensured?: boolean;
  __vedro_location_id?: string;
  __vedro_channel_id?: string;
  __vedro_account_cache?: Map<string, AccountLookup>;
};

// 1. Company verification flag
export function isCompanyEnsured(): boolean {
  return Boolean(globalForStatic.__vedro_company_ensured);
}
export function setCompanyEnsured(): void {
  globalForStatic.__vedro_company_ensured = true;
}

// 2. Default catalog products seeding flag
export function isProductsSeeded(): boolean {
  return Boolean(globalForStatic.__vedro_products_seeded);
}
export function setProductsSeeded(): void {
  globalForStatic.__vedro_products_seeded = true;
}

// 3. Partners ensured flag
export function isPartnersEnsured(): boolean {
  return Boolean(globalForStatic.__vedro_partners_ensured);
}
export function setPartnersEnsured(): void {
  globalForStatic.__vedro_partners_ensured = true;
}

// 4. Default Storage Location ID
export function getCachedLocationId(): string | undefined {
  return globalForStatic.__vedro_location_id;
}
export function setCachedLocationId(id: string): void {
  globalForStatic.__vedro_location_id = id;
}

// 5. Default Sales Channel ID
export function getCachedChannelId(): string | undefined {
  return globalForStatic.__vedro_channel_id;
}
export function setCachedChannelId(id: string): void {
  globalForStatic.__vedro_channel_id = id;
}

// 6. Chart of Accounts in-memory cache
export function getAccountFromCache(code: string): AccountLookup | undefined {
  if (!globalForStatic.__vedro_account_cache) {
    globalForStatic.__vedro_account_cache = new Map<string, AccountLookup>();
  }
  return globalForStatic.__vedro_account_cache.get(code);
}
export function setAccountInCache(code: string, account: AccountLookup): void {
  if (!globalForStatic.__vedro_account_cache) {
    globalForStatic.__vedro_account_cache = new Map<string, AccountLookup>();
  }
  globalForStatic.__vedro_account_cache.set(code, account);
}
