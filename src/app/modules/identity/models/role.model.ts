export interface PermissionInfo { key: string; group: string; label: string; }
export interface Role { id: number; name: string; description: string | null; permissions: string[]; isSystem: boolean; userCount: number; }
export interface RoleInput { name: string; description: string | null; permissions: string[]; }
