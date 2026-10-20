/** Paths of the Catalog service. The /api prefix is added by ApiService. */
export const CATALOG_API = {
  items: '/items',
  itemsImport: '/items/import',
  itemsExport: '/items/export',
  categories: '/categories',
  suppliers: '/suppliers',
  dashboardStock: '/dashboard/stock',
  audit: '/audit/catalog'
} as const;
