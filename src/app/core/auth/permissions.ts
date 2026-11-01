/** Mirrors the permission keys of the backend (StockPilot.Common.Permissions). */
export const PERM = {
  dashboardView: 'dashboard.view',
  itemsView: 'items.view',
  itemsManage: 'items.manage',
  categoriesManage: 'categories.manage',
  suppliersManage: 'suppliers.manage',
  purchaseOrdersManage: 'purchaseorders.manage',
  salesCreate: 'sales.create',
  salesReport: 'sales.report',
  salesStatus: 'sales.status',
  customersManage: 'customers.manage',
  customersRead: 'customers.read',
  usersManage: 'users.manage',
  rolesManage: 'roles.manage',
  auditView: 'audit.view'
} as const;
