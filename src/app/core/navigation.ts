import { PERM } from './auth/permissions';
import { IconName } from './icon-name';

/** One page in the menu. `soon: true` shows a greyed "Soon" entry until the page exists. */
export interface NavItem { path: string; label: string; permissions: string[]; soon?: boolean; }
/** A single link at the top of the menu (no sub menu). */
export interface NavLinkDef extends NavItem { icon: IconName; }
/** A parent menu with its sub menus. */
export interface NavGroupDef { id: string; label: string; icon: IconName; items: NavItem[]; }

export const NAV_TOP: NavLinkDef[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', permissions: [PERM.dashboardView] }
];

/** Parent menus, in the order they appear. A user sees a sub menu only with its permission. */
export const NAV_GROUPS: NavGroupDef[] = [
  {
    id: 'configuration', label: 'Configurations', icon: 'settings', items: [
      { path: '/settings', label: 'System settings', permissions: [PERM.usersManage], soon: true }
    ]
  },
  {
    id: 'inventory', label: 'Inventory Management', icon: 'inventory', items: [
      { path: '/categories', label: 'Categories', permissions: [PERM.categoriesManage] },
      { path: '/items', label: 'Items', permissions: [PERM.itemsView, PERM.itemsManage] },
      { path: '/suppliers', label: 'Suppliers', permissions: [PERM.suppliersManage] }
    ]
  },
  {
    id: 'purchasing', label: 'Purchase Order', icon: 'purchase', items: [
      { path: '/purchase-orders/place', label: 'Place PO', permissions: [PERM.purchaseOrdersManage] },
      { path: '/purchase-orders/find', label: 'Find PO', permissions: [PERM.purchaseOrdersManage] },
    ]
  },
  {
    id: 'sales', label: 'Sale Register', icon: 'sales', items: [
      { path: '/pos', label: 'Sell Screen', permissions: [PERM.salesCreate] },
      { path: '/sales/find', label: 'Find sales', permissions: [PERM.salesReport] }
    ]
  },
  {
    id: 'users', label: 'User Management', icon: 'users', items: [
      { path: '/users', label: 'Employees', permissions: [PERM.usersManage] },
      { path: '/roles', label: 'User Roles', permissions: [PERM.rolesManage] },
      { path: '/audit', label: 'Audit Logs', permissions: [PERM.auditView] }
    ]
  },
  {
    id: 'maintenance', label: 'Maintenance Tools', icon: 'tools', items: [
      { path: '/customers', label: 'Customers', permissions: [PERM.customersManage] },
    ]
  }
];

/** Every page that exists today (entries marked soon are left out). */
export const NAV_LINKS: NavItem[] = [...NAV_TOP, ...NAV_GROUPS.flatMap(g => g.items)].filter(i => !i.soon);

/** After sign-in a user lands on the first page here that they may open. */
const HOME_FIRST = ['/dashboard', '/pos'];
export const HOME_LINKS: NavItem[] = [
  ...HOME_FIRST.flatMap(p => NAV_LINKS.filter(l => l.path === p)),
  ...NAV_LINKS.filter(l => !HOME_FIRST.includes(l.path))
];

/** The menu name of a page, found from its route path ('items/new' gives 'Items'). Used for page headings. */
export const menuLabel = (routePath: string | undefined): string | undefined => {
  const path = '/' + (routePath ?? '');
  const exact = NAV_LINKS.find(l => l.path === path);
  if (exact) return exact.label;
  return NAV_LINKS.filter(l => path.startsWith(l.path + '/')).sort((a, b) => b.path.length - a.path.length)[0]?.label;
};
