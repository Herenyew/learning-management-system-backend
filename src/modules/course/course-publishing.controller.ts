import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { coursePublishingService } from "./course-publishing.service.js";
import { coursePublishingRepository } from "./course-publishing.repository.js";
import { getPrismaClient } from "../../config/database.js";

const contextFrom = (req: AuthenticatedRequest) => ({
  companyId: req.user.companyId,
  userId: req.user.appUserId!,
});

export const coursePublishingController = {
  // GET /courses/publishing/workflows — list available workflows for the selector
  listWorkflows: async (req: AuthenticatedRequest, res: Response) => {
    const workflows = await getPrismaClient().$transaction((tx) =>
      coursePublishingRepository.listCourseWorkflows(tx, req.user.companyId),
    );
    res.status(200).json({ success: true, data: workflows });
  },

  // GET /courses/versions/:courseVersionId/preview — read-only course preview for approvers
  getCoursePreview: async (req: AuthenticatedRequest, res: Response) => {
    const courseVersionId = Number(req.params.courseVersionId);
    const preview = await getPrismaClient().courseVersion.findFirst({
      where: { id: courseVersionId, companyId: req.user.companyId, deletedAt: null },
      select: {
        id: true,
        status: true,
        approvalStatus: true,
        majorVersion: true,
        minorVersion: true,
        estimatedDurationMinutes: true,
        requiredAssessmentScore: true,
        completionThreshold: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            category: { select: { name: true } },
            createdByUser: { select: { id: true, email: true } },
          },
        },
        chapters: {
          where: { deletedAt: null },
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            title: true,
            displayOrder: true,
            contents: {
              where: { deletedAt: null },
              orderBy: { displayOrder: "asc" },
              select: {
                id: true,
                title: true,
                displayOrder: true,
                contentType: { select: { name: true, category: true } },
              },
            },
          },
        },
        difficultyLevel: { select: { name: true } },
        instructors: {
          select: {
            employee: { select: { fullName: true } },
            isPrimary: true,
          },
        },
      },
    });

    if (!preview) {
      res.status(404).json({ success: false, error: "Course version not found." });
      return;
    }

    // The Prisma relation is `contents`; expose it as `contentItems` so the
    // frontend CoursePreview contract stays unchanged.
    const data = {
      ...preview,
      chapters: preview.chapters.map(({ contents, ...chapter }) => ({
        ...chapter,
        contentItems: contents,
      })),
    };
    res.status(200).json({ success: true, data });
  },

  // POST /courses/versions/submit-new-draft
  createAndSubmitDraft: async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, workflowId } = req.body as {
      title?: string;
      description?: string;
      workflowId?: number;
    };
    if (!title?.trim()) {
      res.status(400).json({ success: false, error: "A course title is required." });
      return;
    }
    const result = await coursePublishingService.createAndSubmitDraft(contextFrom(req), {
      title,
      description,
      workflowId: workflowId ? Number(workflowId) : undefined,
    });
    res.status(201).json({ success: true, data: result });
  },

  // GET /courses/versions/my-courses — creator fetches the current approval/publish status
  // of their submitted courses so the UI can stay in sync with the backend.
  getMyCourseStatuses: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.appUserId!;
    const companyId = req.user.companyId;

    // Find all CourseVersions created by this user — return enough for badge display
    const versions = await getPrismaClient().courseVersion.findMany({
      where: { companyId, createdBy: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        approvalStatus: true,
        course: { select: { id: true, title: true } },
        approvalInstances: {
          where: { entityType: "COURSE_VERSION" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            latestComment: true,
            decisions: {
              orderBy: { decidedAt: "desc" },
              take: 1,
              select: { status: true, comment: true, decidedAt: true },
            },
          },
        },
      },
    });

    res.status(200).json({ success: true, data: versions });
  },

  // POST /courses/versions/:courseVersionId/submit-for-review — submit an
  // existing course version into the approval workflow and notify reviewers.
  submitForReview: async (req: AuthenticatedRequest, res: Response) => {
    const courseVersionId = Number(req.params.courseVersionId);
    const { comment, workflowId } = req.body as { comment?: string; workflowId?: number };
    const result = await coursePublishingService.submitForReview(
      contextFrom(req),
      courseVersionId,
      comment,
      workflowId ? Number(workflowId) : undefined,
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
