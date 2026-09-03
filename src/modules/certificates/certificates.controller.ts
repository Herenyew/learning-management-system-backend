import type { Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "../../common/errors/http-errors.js";
import { certificatesService } from "./certificates.service.js";

const issueCertificateSchema = z.object({
  userId: z.coerce.number().int().positive(),
  templateId: z.coerce.number().int().positive(),
  courseId: z.coerce.number().int().positive().optional(),
  programId: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
});

const contextFrom = (req: Request) => {
  const reqAny = req as any;
  const user = reqAny.user || reqAny.currentUser;
  const companyId = user?.companyId ? Number(user.companyId) : (reqAny.companyId ? Number(reqAny.companyId) : undefined);
  const userId = user?.appUserId ?? (user?.id ? Number(user.id) : undefined);
  if (!companyId || !userId) throw new UnauthorizedError("Authenticated user context is required.");
  return { companyId, userId };
};

export const certificatesController = {
  issue: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const body = issueCertificateSchema.parse(req.body);
    const certificate = await certificatesService.issue(
      { companyId: context.companyId, actorUserId: context.userId },
      body,
    );
    return res.status(201).json({ success: true, data: certificate });
  },

  listOwn: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const certificates = await certificatesService.listOwn(context);
    return res.status(200).json({ success: true, data: certificates });
  },

  processExpiry: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const result = await certificatesService.processExpiry(context.companyId);
    return res.status(200).json({ success: true, data: result });
  },
};
