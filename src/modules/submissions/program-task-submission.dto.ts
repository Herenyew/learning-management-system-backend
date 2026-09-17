import { z } from "zod";

export const programEnrollmentIdSchema = z.coerce.number().int().positive();
export const programTaskIdSchema = z.coerce.number().int().positive();
export const submissionIdSchema = z.coerce.number().int().positive();

const allowedUploadTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "image/jpeg",
  "image/png",
] as const;

export const createProgramTaskUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(allowedUploadTypes),
  fileSizeBytes: z.coerce.number().int().positive().max(25 * 1024 * 1024),
}).strict();

export const submitProgramTaskSchema = z.discriminatedUnion("submissionType", [
  z
    .object({
      submissionType: z.literal("TEXT_INPUT"),
      textAnswer: z.string().trim().min(1).max(100_000),
    })
    .strict(),
  z
    .object({
      submissionType: z.literal("LINK"),
      submissionUrl: z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
        message: "Only HTTP and HTTPS links are supported.",
      }),
    })
    .strict(),
  z.object({
    submissionType: z.literal("FILE_UPLOAD"),
    fileId: z.coerce.number().int().positive(),
  }).strict(),
]);

export const reviewSubmissionSchema = z
  .object({
    score: z.coerce.number().min(0).max(100).optional(),
    reviewComment: z.string().trim().max(10_000).optional(),
  })
  .strict();

export const rejectSubmissionSchema = z
  .object({ reviewComment: z.string().trim().min(1).max(10_000) })
  .strict();

export const peerReviewSchema = z
  .object({
    reviewText: z.string().trim().min(1).max(10_000).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  })
  .strict()
  .refine((value) => value.reviewText != null || value.rating != null, {
    message: "A review comment or rating is required.",
  });

export type CreateProgramTaskUploadInput = z.infer<typeof createProgramTaskUploadSchema>;
export type SubmitProgramTaskInput = z.infer<typeof submitProgramTaskSchema>;
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>;
export type PeerReviewInput = z.infer<typeof peerReviewSchema>;
