import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ProgramCohortRosterRepository } from "./program-cohort-roster.repository.js";

describe("ProgramCohortRosterRepository serializable transactions", () => {
  it("retries a serialization conflict and preserves Serializable isolation", async () => {
    const serializationConflict = new Prisma.PrismaClientKnownRequestError(
      "Transaction write conflict",
      { code: "P2034", clientVersion: "6.19.3" },
    );
    const transaction = vi
      .fn()
      .mockRejectedValueOnce(serializationConflict)
      .mockResolvedValueOnce("ok");
    const repository = new ProgramCohortRosterRepository({
      $transaction: transaction,
    } as never);
    const work = vi.fn();

    await expect(repository.transaction(work)).resolves.toBe("ok");
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenNthCalledWith(1, work, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it("stops after three serialization conflicts", async () => {
    const serializationConflict = new Prisma.PrismaClientKnownRequestError(
      "Transaction write conflict",
      { code: "P2034", clientVersion: "6.19.3" },
    );
    const transaction = vi.fn().mockRejectedValue(serializationConflict);
    const repository = new ProgramCohortRosterRepository({
      $transaction: transaction,
    } as never);

    await expect(repository.transaction(vi.fn())).rejects.toBe(serializationConflict);
    expect(transaction).toHaveBeenCalledTimes(3);
  });
});
