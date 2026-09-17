import { z } from "zod";

export const liveSessionIdSchema = z.coerce.number().int().positive();
export const checkInSchema = z.object({ challenge: z.string().min(20).max(4_000) }).strict();

const attendanceRecordSchema = z
  .object({
    enrollmentId: z.coerce.number().int().positive(),
    attendanceStatus: z.enum(["PRESENT", "ABSENT", "LATE", "PARTIAL", "NO_SHOW"]),
    attendancePercentage: z.coerce.number().min(0).max(100).nullable().optional(),
    remarks: z.string().trim().max(10_000).nullable().optional(),
  })
  .strict();

export const finalizeAttendanceSchema = z
  .object({ records: z.array(attendanceRecordSchema).min(1).max(10_000) })
  .strict()
  .refine((value) => new Set(value.records.map((record) => record.enrollmentId)).size === value.records.length, {
    message: "Each enrollment may appear only once.",
    path: ["records"],
  });

export type FinalizeAttendanceInput = z.infer<typeof finalizeAttendanceSchema>;
