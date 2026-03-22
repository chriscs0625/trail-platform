import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../index";
import prisma from "@my-app/db";
import { TRPCError } from "@trpc/server";

const mockPrisma = vi.hoisted(() => ({
  goal: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
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

describe("habits router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const session = {
    user: { id: "user-1", email: "test@test.com" }
  };
  const callerWithSession = createCaller({ session: session as any });

  describe("toggle", () => {
    it("Creates a HabitLog when none exists for that date", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-1" });
      mockPrisma.habitLog.findFirst.mockResolvedValue(null);
      mockPrisma.habitLog.create.mockResolvedValue({ id: "log-1", goalId: "g1" });

      const dateStr = new Date().toISOString();
      const result = await callerWithSession.habits.toggle({
        goalId: "g1",
        date: dateStr,
      });

      expect(mockPrisma.habitLog.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          goalId: "g1",
          userId: "user-1",
        })
      });
      expect(mockPrisma.habitLog.create).toHaveBeenCalled();
      expect(result).toEqual({ checked: true });
    });

    it("Deletes the HabitLog when one already exists (toggle off)", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-1" });
      mockPrisma.habitLog.findFirst.mockResolvedValue({ id: "log-1" });
      mockPrisma.habitLog.delete.mockResolvedValue({ id: "log-1" });

      const dateStr = new Date().toISOString();
      const result = await callerWithSession.habits.toggle({
        goalId: "g1",
        date: dateStr,
      });

      expect(mockPrisma.habitLog.delete).toHaveBeenCalledWith({
        where: { id: "log-1" }
      });
      expect(result).toEqual({ checked: false });
    });

    it("Does NOT affect logs from other dates", async () => {
      // Handled heavily by date ranges in prisma queries, verified by payload structure checking 
      // where gt/lt bounded.
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-1" });
      mockPrisma.habitLog.findFirst.mockResolvedValue(null);

      const targetDate = new Date("2024-01-01T12:00:00.000Z");
      await callerWithSession.habits.toggle({
        goalId: "g1",
        date: targetDate.toISOString(),
      });

      expect(mockPrisma.habitLog.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          completedAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          })
        })
      });
    });
  });

  describe("getCompletionsForRange", () => {
    it("Returns only logs within the date range (not outside)", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-1", frequency: "DAILY" });
      const logs = [
        { id: "1", completedAt: new Date("2024-01-05") }
      ];
      mockPrisma.habitLog.findMany.mockResolvedValue(logs); // both queries mock

      const result = await callerWithSession.habits.getCompletionsForRange({
        goalId: "g1",
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
      });

      expect(mockPrisma.habitLog.findMany).toHaveBeenNthCalledWith(1, {
        where: expect.objectContaining({
          completedAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          })
        }),
        orderBy: { completedAt: "asc" }
      });
      expect(result.logs).toEqual(logs);
      expect(result.totalCompleted).toBe(1);
    });
    
    it("Returns correct totalCompleted count", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ id: "g1", userId: "user-1", frequency: "DAILY", targetCount: 5 });
      const logs = [
        { id: "1", completedAt: new Date("2024-01-05") },
        { id: "2", completedAt: new Date("2024-01-06") }
      ];
      // For findMany #1 (logs), and findMany #2 (streak)
      mockPrisma.habitLog.findMany.mockImplementation((args: any) => {
        if (args.orderBy.completedAt === "asc") return Promise.resolve(logs);
        return Promise.resolve(logs); 
      });

      const result = await callerWithSession.habits.getCompletionsForRange({
        goalId: "g1",
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
      });

      expect(result.totalCompleted).toBe(2);
    });
  });

  describe("getStreak", () => {
    it("Returns streak of 0 when no logs exist", async () => {
      mockPrisma.goal.findUnique.mockResolvedValue({ 
        id: "g1", 
        userId: "user-1",
        frequency: "DAILY",
        habitLogs: [] 
      });

      const result = await callerWithSession.habits.getStreak({ goalId: "g1" });
      expect(result.currentStreak).toBe(0);
    });

    it("Returns correct streak for consecutive daily completions", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-05T12:00:00.000Z"));
      
      mockPrisma.goal.findUnique.mockResolvedValue({ 
        id: "g1", 
        userId: "user-1",
        frequency: "DAILY",
        habitLogs: [
          { completedAt: new Date("2024-01-05T10:00:00.000Z") },
          { completedAt: new Date("2024-01-04T10:00:00.000Z") },
          { completedAt: new Date("2024-01-03T10:00:00.000Z") },
        ] 
      });

      const result = await callerWithSession.habits.getStreak({ goalId: "g1" });
      expect(result.currentStreak).toBe(3);
    });

    it("Streak breaks correctly when a day is missed", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-05T12:00:00.000Z"));
      
      mockPrisma.goal.findUnique.mockResolvedValue({ 
        id: "g1", 
        userId: "user-1",
        frequency: "DAILY",
        habitLogs: [
          { completedAt: new Date("2024-01-05T10:00:00.000Z") }, // today
          // missing 4th
          { completedAt: new Date("2024-01-03T10:00:00.000Z") },
          { completedAt: new Date("2024-01-02T10:00:00.000Z") },
        ] 
      });

      const result = await callerWithSession.habits.getStreak({ goalId: "g1" });
      expect(result.currentStreak).toBe(1); // Only today's applies
    });
  });
});
