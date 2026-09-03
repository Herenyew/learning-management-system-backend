import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { coursePublishingService } from "./course-publishing.service.js";

const contextFrom = (req: AuthenticatedRequest) => ({
  companyId: req.user.companyId,
  userId: req.user.appUserId!,
});

export const coursePublishingController = {
  // POST /courses/versions/:courseVersionId/submit-for-review
  submitForReview: async (req: AuthenticatedRequest, res: Response) => {
    const courseVersionId = Number(req.params.courseVersionId);
    const { comment } = req.body as { comment?: string };
    const result = await coursePublishingService.submitForReview(
      contextFrom(req),
      courseVersionId,
      comment,
    );
    res.status(200).json({ success: true, data: result });
  },

  // POST /courses/publishing/instances/:instanceId/approve
  approve: async (req: AuthenticatedRequest, res: Response) => {
    const instanceId = Number(req.params.instanceId);
    const { comment } = req.body as { comment?: string };
    const result = await coursePublishingService.approveCourse(
      contextFrom(req),
      instanceId,
      comment,
    );
    res.status(200).json({ success: true, data: result });
  },

  // POST /courses/publishing/instances/:instanceId/reject
  reject: async (req: AuthenticatedRequest, res: Response) => {
    const instanceId = Number(req.params.instanceId);
    const { comment } = req.body as { comment: string };
    if (!comment?.trim()) {
      res.status(400).json({ success: false, error: "A rejection reason is required." });
      return;
    }
    const result = await coursePublishingService.rejectCourse(
      contextFrom(req),
      instanceId,
      comment,
    );
    res.status(200).json({ success: true, data: result });
  },

  // POST /courses/publishing/instances/:instanceId/request-changes
  requestChanges: async (req: AuthenticatedRequest, res: Response) => {
    const instanceId = Number(req.params.instanceId);
    const { comment } = req.body as { comment: string };
    if (!comment?.trim()) {
      res.status(400).json({ success: false, error: "A change request comment is required." });
      return;
    }
    const result = await coursePublishingService.requestChanges(
      contextFrom(req),
      instanceId,
      comment,
    );
    res.status(200).json({ success: true, data: result });
  },

  // GET /courses/publishing/pending
  listPending: async (req: AuthenticatedRequest, res: Response) => {
    const result = await coursePublishingService.listPendingReviews(
      req.user.companyId,
    );
    res.status(200).json({ success: true, data: result });
  },
};
