export interface TokenPayload {
  sub: string;

  appUserId: number;

  employeeId: string;

  companyId: number;

  email: string;

  roleId: number;

  iat: number;

  exp: number;
}