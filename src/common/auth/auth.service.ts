import authRepository, { type AuthenticatedUser } from "./auth.repository.js";
import { verifyToken } from "./jwt.js";
import { AppError, ErrorCode } from "../errors/index.js";
import type { CurrentUser } from "./current-user.js";

class AuthService {
  async authenticate(token: string): Promise<CurrentUser> {
    const payload = verifyToken(token);

    const user: AuthenticatedUser = await authRepository.findAuthenticatedUser(
      payload.appUserId
    );

    if (!user || !user.isActive) {
      throw new AppError(
        "User not found or inactive.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    // Tenant safety check against JWT payload
    if (user.companyId !== payload.companyId) {
      throw new AppError(
        "Invalid tenant session.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (!user.employee || !user.employee.isActive) {
      throw new AppError(
        "Associated employee record is inactive.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    // Extract permission codes safely (defaults to empty array if no role assigned)
    const permissions: string[] = user.role?.lmsPermissions
      ? user.role.lmsPermissions.map((rp) => rp.permission.code)
      : [];

    return {
      appUserId: user.id,
      employeeId: user.employee.id,
      companyId: user.companyId,
      email: user.email,
      roleId: user.roleId ?? 0,
      permissions,
    };
  }
}

export default new AuthService();