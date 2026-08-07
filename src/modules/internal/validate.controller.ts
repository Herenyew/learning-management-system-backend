// lms-backend/src/modules/internal/validate.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../common/auth/jwt.js'; // Your existing verifyToken function
import { AppError } from '../../common/errors/index.js';
import { number } from 'zod';

const prisma = new PrismaClient();

// lms-backend/src/modules/internal/validate.controller.ts

export const validateUserFromEMS = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Verify internal API key
    const apiKey = req.headers['x-internal-api-key'];
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid internal API key'
      });
    }

    const { token, userId, companyId } = req.body;

    console.log('Received token:', token); // Log the token
    console.log('userId:', userId, 'companyId:', companyId);
    
    if (!token || !userId || !companyId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required fields: token, userId, companyId'
      });
    }

    // 2. Verify JWT token (shared secret)
    const tokenPayload = verifyToken(token);
    // tokenPayload contains: { id, company_id, role_id, email?, iat, exp }

    // Compare using LMS fields
    if (tokenPayload.appUserId !== Number(userId) ||
        tokenPayload.companyId !== Number(companyId)) {
      console.log('Mismatch: appUserId=', tokenPayload.appUserId, 'userId=', userId);
      console.log('Mismatch: companyId=', tokenPayload.companyId, 'companyId=', companyId);
      return res.status(401).json({
        status: 'fail',
        message: 'Token does not match user/company'
      });
    }
  // Use tokenPayload.email for user creation
  const lmsUser = await prisma.appUser.upsert({
    where: { id: userId },
    update: {
      email: tokenPayload.email,
      companyId: companyId,
      roleId: tokenPayload.roleId,
      employeeId: tokenPayload.employeeId || null,
      isActive: true,
      lastSyncedAt: new Date(),
    },
    create: {
      id: userId,
      email: tokenPayload.email,
      companyId: companyId,
      roleId: tokenPayload.roleId,
      employeeId: tokenPayload.employeeId || null,
      isActive: true,
      lastSyncedAt: new Date(),
    },
  });
  console.log('User upserted in LMS:', lmsUser);
    // 5. Get LMS permissions for the user's role
    const permissions = await prisma.lmsRolePermission.findMany({
      where: {
        companyId: companyId,
        appRoleId: tokenPayload.roleId,
      },
      select: {
        permission: {
          select: { code: true },
        },
      },
    });

    // 6. Return LMS data to EMS
    res.status(200).json({
      status: 'success',
      data: {
        userId: lmsUser.id,
        companyId: lmsUser.companyId,
        roleId: lmsUser.roleId,
        isActive: lmsUser.isActive,
        permissions: permissions.map(p => p.permission.code),
        synced: true,
      },
    });
console.log('Permissions for user:', permissions);
  } catch (error) {
    console.error('LMS validation error:', error);
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token or user',
    });
  }
};
