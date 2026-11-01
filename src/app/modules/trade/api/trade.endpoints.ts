/** Paths of the Trade service. The /api prefix is added by ApiService. */
export const TRADE_API = {
  purchaseOrders: '/purchaseorders',
  sales: '/sales',
  salesExport: '/sales/export',
  dashboardSales: '/dashboard/sales',
  customers: '/customers',
  audit: '/audit/trade'
} as const;
