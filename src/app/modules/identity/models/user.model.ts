/** An employee. Employees sign in with their username and password. */
export interface User {
  id: number; employeeCode: string; username: string; fullName: string;
  mobile: string | null; email: string | null; designation: string | null; joiningDate: string | null;
  roleId: number | null; roleName: string | null; isActive: boolean; createdAt: string;
}

export interface EmployeeDetails {
  employeeCode: string | null; mobile: string | null; email: string | null; designation: string | null; joiningDate: string | null;
}

export interface UserCreateInput extends EmployeeDetails {
  username: string; fullName: string; password: string; roleId: number | null; isActive: boolean;
}

export interface UserUpdateInput extends EmployeeDetails {
  fullName: string; roleId: number | null; isActive: boolean; newPassword: string | null;
}
