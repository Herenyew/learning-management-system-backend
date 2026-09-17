import { describe, expect, it } from "vitest";
import { checkInSchema, finalizeAttendanceSchema } from "./live-session-attendance.dto.js";

describe("live-session attendance DTOs", () => {
  it("accepts a strict check-in challenge", () => {
    expect(checkInSchema.parse({ challenge: "x".repeat(20) })).toEqual({ challenge: "x".repeat(20) });
    expect(() => checkInSchema.parse({ challenge: "short" })).toThrow();
  });

  it("validates statuses, percentages, and unique enrollments", () => {
    expect(
      finalizeAttendanceSchema.parse({
        records: [
          { enrollmentId: 1, attendanceStatus: "PRESENT" },
          { enrollmentId: 2, attendanceStatus: "PARTIAL", attendancePercentage: 60 },
        ],
      }).records,
    ).toHaveLength(2);
    expect(() =>
      finalizeAttendanceSchema.parse({
        records: [
          { enrollmentId: 1, attendanceStatus: "PRESENT" },
          { enrollmentId: 1, attendanceStatus: "ABSENT" },
        ],
      }),
    ).toThrow();
    expect(() =>
      finalizeAttendanceSchema.parse({
        records: [{ enrollmentId: 1, attendanceStatus: "PARTIAL", attendancePercentage: 101 }],
      }),
    ).toThrow();
  });
});
