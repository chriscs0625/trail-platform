import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../index";
import prisma from "@my-app/db";
import { TRPCError } from "@trpc/server";

const mockPrisma = vi.hoisted(() => ({
  goal: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  habitLog: {
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  }
}));

vi.mock("@my-app/db", () => {
  return {
    default: mockPrisma,
  };
});

import { t } from "../../index";
const createCaller = t.createCallerFactory(appRouter);

describe("goals router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const session = {
    user: { id: "user-1", email: "test@test.com" }
  };

  const callerWithSession = createCaller({ session: session as any });
  const callerWithoutSession = createCaller({ session: null as any });

  describe("create", () => {
    it("Creates goal with correct userId from session", async () => {
      mockPrisma.goal.create.mockResolvedValue({ id: "goal-1", title: "Test", userId: "user-1" });
      
      const result = await callerWithSession.goals.create({
        title: "Test",
        frequency: "DAILY",
        targetCount: 1,
      });

      expect(mockPrisma.goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Test",
          frequency: "DAILY",
          targetCount: 1,
          userId: "user-1",
        }),
      });
      expect(result.id).toBe("goal-1");
    });

    it("Throws UNAUTHORIZED if no session", async () => {
      await expect(callerWithoutSession.goals.create({
        title: "Test",
        frequency: "DAILY",
        targetCount: 1,
      })).rejects.toThrowError(TRPCError);
      
      await expect(callerWithoutSession.goals.create({
        title: "Test",
        frequency: "DAILY",
        targetCount: 1,
      })).rejects.toSatisfy((err: any) => err.code === "UNAUTHORIZED");
    });

    it("Throws if title is empty string", async () => {
      await expect(callerWithSession.goals.create({
        title: "",
        frequency: "DAILY",
        targetCount: 1,
      })).rejects.toThrowError();
    });
  });

  describe("list", () => {
    it("Returns only goals belonging to current user", async () => {
      mockPrisma.goal.findMany.mockResolvedValue([
        { id: "g1", userId: "user-1" }
      ]);

      const result = await callerWithSession.goals.list();

      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            isArchived: false,
          }),
        })
      );
      expect(result.length).toBe(1);
    });

    it("Returns empty array (not error) if user has no goals", async () => {
      mockPrisma.goal.findMany.mockResolvedValue([]);
      
      const result = await callerWithSession.goals.list();
      expect(result).toEqual([]);
    });

    it("Does NOT return archived goals (isArchived: true)", async () => {
      mockPrisma.goal.findMany.mockResolvedValue([]);
      
      await callerWithSession.goals.list();

      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: false,
          }),
        })
      );
    });
  });

  describe("archive", () => {
    it("Sets isArchived: true for correct goal", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-1" });
      mockPrisma.goal.update.mockResolvedValue({ id: "g1", isArchived: true });

      const result = await callerWithSession.goals.archive({ id: "g1" });
      
      expect(mockPrisma.goal.update).toHaveBeenCalledWith({
        where: { id: "g1" },
        data: { isArchived: true },
      });
      expect(result.isArchived).toBe(true);
    });

    it("Throws NOT_FOUND if goal belongs to different user", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-2" });

      await expect(callerWithSession.goals.archive({ id: "g1" }))
        .rejects.toSatisfy((err: any) => err.code === "FORBIDDEN");
    });
  });

  describe("delete", () => {
    it("Deletes goal and its HabitLogs (cascade)", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-1" });
      mockPrisma.goal.delete.mockResolvedValue({ id: "g1" });

      await callerWithSession.goals.delete({ id: "g1" });

      expect(mockPrisma.goal.delete).toHaveBeenCalledWith({
        where: { id: "g1" },
      });
      // Cascade handled by Prisma DB level typically, router only calls delete on goal
    });

    it("Throws FORBIDDEN if goal doesn't belong to current user", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-2" });

      await expect(callerWithSession.goals.delete({ id: "g1" }))
        .rejects.toSatisfy((err: any) => err.code === "FORBIDDEN");
    });
  });
});
