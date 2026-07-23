export interface CurrentUser {
  appUserId: number;

  employeeId: string;

  companyId: number;

  email: string;

  roleId: number;

  permissions: string[];
}