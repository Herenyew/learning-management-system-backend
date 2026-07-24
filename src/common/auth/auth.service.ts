import authRepository from "./auth.repository.js";

import { verifyToken } from "./jwt.js";

import { AppError, ErrorCode } from "../errors/index.js";

class AuthService {
  async authenticate(token: string) {
    const payload = verifyToken(token);

    const user =
      await authRepository.findAuthenticatedUser(
        payload.appUserId
      );

    if (!user || !user.isActive) {
      throw new AppError(
        "User not found.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (!user.employee?.isActive) {
      throw new AppError(
        "Employee is inactive.",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    return {
      appUserId: user.id,

      employeeId: user.employee.id,

      companyId: user.companyId,

      email: user.email,

      roleId: user.roleId,

      permissions:
        user.role?.lmsPermissions.map(
          rp => rp.permission.code
        ),
    };
  }
}

export default new AuthService();