import { PERM } from '@core/auth';
import { IconName } from '@core/icon-name';

export interface PermissionChild { key: string; label: string; hint: string; }
export interface PermissionParent { id: string; label: string; icon: IconName; children: PermissionChild[]; }

/**
 * The role form shows permissions as a tree that follows the sidebar menu:
 * a parent menu, then the pages inside it. When a new page needs a permission, add one line here.
 */
export const PERMISSION_TREE: PermissionParent[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: 'dashboard', children: [
      { key: PERM.dashboardView, label: 'Dashboard', hint: 'See stock and sales numbers' }
    ]
  },
  {
    id: 'inventory', label: 'Inventory Management', icon: 'inventory', children: [
      { key: PERM.categoriesManage, label: 'Categories', hint: 'Add, rename and delete categories' },
      { key: PERM.itemsView, label: 'Items: view', hint: 'See the item list' },
      { key: PERM.itemsManage, label: 'Items: manage', hint: 'Add, edit, import and export items' },
      { key: PERM.suppliersManage, label: 'Suppliers', hint: 'Add, edit and remove suppliers' }
    ]
  },
  {
    id: 'purchasing', label: 'Purchase Order', icon: 'purchase', children: [
      { key: PERM.purchaseOrdersManage, label: 'Place PO and Find PO', hint: 'Create purchase orders and mark them received' }
    ]
  },
  {
    id: 'sales', label: 'Sale Register', icon: 'sales', children: [
      { key: PERM.salesCreate, label: 'Sell Screen', hint: 'Make sales at the counter' },
      { key: PERM.salesReport, label: 'Find sales and reports', hint: 'See and export sales' },
      { key: PERM.salesStatus, label: 'Change sale status', hint: 'Complete, return or void a sale' }
    ]
  },
  {
    id: 'users', label: 'User Management', icon: 'users', children: [
      { key: PERM.usersManage, label: 'Employees', hint: 'Add employees, activate them and assign roles' },
      { key: PERM.rolesManage, label: 'User Roles', hint: 'Create and edit roles' },
      { key: PERM.auditView, label: 'Audit Logs', hint: 'See who did what and when' }
    ]
  },
  { id: 'maintenance', label: 'Maintenance Tools', icon: 'tools', children: [
  { key: PERM.customersManage, label: 'Customers', hint: 'Add, edit and deactivate customers' }
] }
];
