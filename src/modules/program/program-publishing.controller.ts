import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { programPublishingService } from "./program-publishing.service.js";

const contextFrom = (req: AuthenticatedRequest) => ({
  companyId: req.user.companyId,
  userId: req.user.appUserId!,
});

export const programPublishingController = {
  // POST /programs/publishing/versions/:learningProgramId/submit-for-review
  submitForReview: async (req: AuthenticatedRequest, res: Response) => {
    const learningProgramId = Number(req.params.learningProgramId);
    const { comment } = req.body as { comment?: string };
    const result = await programPublishingService.submitForReview(
      contextFrom(req),
      learningProgramId,
      comment,
    );
    res.status(200).json({ success: true, data: result });
  },

  // POST /programs/publishing/instances/:instanceId/approve
  approve: async (req: AuthenticatedRequest, res: Response) => {
    const instanceId = Number(req.params.instanceId);
    const { comment } = req.body as { comment?: string };
    const result = await programPublishingService.approveProgram(
      contextFrom(req),
      instanceId,
      comment,
    );
    res.status(200).json({ success: true, data: result });
  },

  // POST /programs/publishing/instances/:instanceId/reject
  reject: async (req: AuthenticatedRequest, res: Response) => {
    const instanceId = Number(req.params.instanceId);
    const { comment } = req.body as { comment: string };
    if (!comment?.trim()) {
      res.status(400).json({ success: false, error: "A rejection reason is required." });
      return;
    }
    const result = await programPublishingService.rejectProgram(
      contextFrom(req),
      instanceId,
      comment,
    );
    res.status(200).json({ success: true, data: result });
  },

  // POST /programs/publishing/instances/:instanceId/request-changes
  requestChanges: async (req: AuthenticatedRequest, res: Response) => {
    const instanceId = Number(req.params.instanceId);
    const { comment } = req.body as { comment: string };
    if (!comment?.trim()) {
      res.status(400).json({ success: false, error: "A change request comment is required." });
      return;
    }
    const result = await programPublishingService.requestChanges(
      contextFrom(req),
      instanceId,
      comment,
    );
    res.status(200).json({ success: true, data: result });
  },

  // GET /programs/publishing/pending
  listPending: async (req: AuthenticatedRequest, res: Response) => {
    const result = await programPublishingService.listPendingReviews(
      req.user.companyId,
    );
    res.status(200).json({ success: true, data: result });
  },
};
