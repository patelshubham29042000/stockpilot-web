export interface User { id: number; username: string; fullName: string; roleId: number | null; roleName: string | null; isActive: boolean; createdAt: string; }
export interface UserCreateInput { username: string; fullName: string; password: string; roleId: number | null; isActive: boolean; }
export interface UserUpdateInput { fullName: string; roleId: number | null; isActive: boolean; newPassword: string | null; }
