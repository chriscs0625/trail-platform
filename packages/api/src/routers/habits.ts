import { TRPCError } from "@trpc/server";
// @ts-ignore
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { z } from "zod";

import prisma from "@my-app/db";
import { protectedProcedure, router } from "../index";

export const habitsRouter = router({
  toggle: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        date: z.string().datetime(), // e.g. valid ISO 8601 string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const goal = await prisma.goal.findUnique({
        where: { id: input.goalId },
      });

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });
      }

      if (goal.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized for this goal",
        });
      }

      const targetDate = new Date(input.date);
      const start = startOfDay(targetDate);
      const end = endOfDay(targetDate);

      // Check if a habit log already exists for this calendar day
      const existingLog = await prisma.habitLog.findFirst({
        where: {
          goalId: input.goalId,
          userId: ctx.session.user.id,
          completedAt: {
            gte: start,
            lte: end,
          },
        },
      });

      if (existingLog) {
        // Un-check
        await prisma.habitLog.delete({
          where: { id: existingLog.id },
        });
        return { checked: false };
      } else {
        // Check off
        await prisma.habitLog.create({
          data: {
            goalId: input.goalId,
            userId: ctx.session.user.id,
            completedAt: targetDate, // Or new Date() if we want current exact time, but keep it matched to their specific timezone input normally
          },
        });
        return { checked: true };
      }
    }),

  getCompletionsForRange: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        from: z.date(),
        to: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const goal = await prisma.goal.findUnique({
        where: { id: input.goalId },
      });

      if (!goal || goal.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal not found or unauthorized",
        });
      }

      const logs = await prisma.habitLog.findMany({
        where: {
          goalId: input.goalId,
          userId: ctx.session.user.id,
          completedAt: {
            gte: startOfDay(input.from),
            lte: endOfDay(input.to),
          },
        },
        orderBy: {
          completedAt: "asc",
        },
      });

      // Fetch streak calculation internally or import Logic
      const allLogsForStreak = await prisma.habitLog.findMany({
        where: { goalId: input.goalId, userId: ctx.session.user.id },
        orderBy: { completedAt: "desc" },
      });

      const { currentStreak } = calculateStreaks(allLogsForStreak, goal.frequency);

      return {
        logs,
        totalCompleted: logs.length,
        targetCount: goal.targetCount,
        streak: currentStreak,
      };
    }),

  getWeeklySummary: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

    const goals = await prisma.goal.findMany({
      where: {
        userId: ctx.session.user.id,
        isArchived: false,
      },
      include: {
        habitLogs: {
          where: {
            completedAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return goals.map((g) => ({
      goalId: g.id,
      title: g.title,
      frequency: g.frequency,
      completedThisWeek: g.habitLogs.length,
      targetCount: g.targetCount,
    }));
  }),

  getStreak: protectedProcedure
    .input(z.object({ goalId: z.string() }))
    .query(async ({ ctx, input }) => {
      const goal = await prisma.goal.findUnique({
        where: { id: input.goalId },
        include: {
          habitLogs: {
            orderBy: { completedAt: "desc" },
          },
        },
      });

      if (!goal || goal.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal not found",
        });
      }

      return calculateStreaks(goal.habitLogs, goal.frequency);
    }),
});

// Helper function to calculate streaks based on frequency
function calculateStreaks(
  logs: { completedAt: Date }[],
  frequency: string
): { currentStreak: number; longestStreak: number } {
  if (logs.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const now = new Date();
  
  // Normalize periods based on frequency
  const normalizedDates = logs.map((log) => {
    return startOfDay(log.completedAt).getTime();
  });
  
  const uniquePeriods = [...new Set(normalizedDates)].sort((a, b) => b - a);

  let currentStreak = 1;
  let longestStreak = 1;
  let runningStreak = 1;

  // Check if current streak extends to today/current period
  let isActiveStreak = false;

  for (let i = 0; i < uniquePeriods.length - 1; i++) {
    const curr = new Date(uniquePeriods[i]);
    const next = new Date(uniquePeriods[i + 1]);

    let diff = 0;

    if (frequency === "DAILY") {
      diff = differenceInDays(curr, next);
      if (i === 0) {
        isActiveStreak = differenceInDays(now, curr) <= 1;
      }
    } else if (frequency === "WEEKLY") {
      diff = differenceInWeeks(curr, next);
      if (i === 0) isActiveStreak = differenceInWeeks(now, curr) <= 1;
    } else if (frequency === "MONTHLY") {
      diff = differenceInMonths(curr, next);
      if (i === 0) isActiveStreak = differenceInMonths(now, curr) <= 1;
    }

    if (diff === 1) {
      runningStreak++;
      if (typeof isActiveStreak !== 'undefined' && i < currentStreak) {
         currentStreak++;
      }
    } else if (diff > 1) {
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
      runningStreak = 1;
    }
  }

  if (runningStreak > longestStreak) {
    longestStreak = runningStreak;
  }
  
  // Handle edge case of single log being active today
  if (uniquePeriods.length === 1) {
      const curr = new Date(uniquePeriods[0]);
      if (frequency === "DAILY") isActiveStreak = differenceInDays(now, curr) <= 1;
      if (frequency === "WEEKLY") isActiveStreak = differenceInWeeks(now, curr) <= 1;
      if (frequency === "MONTHLY") isActiveStreak = differenceInMonths(now, curr) <= 1;
      
      currentStreak = isActiveStreak ? 1 : 0;
  } else if (!isActiveStreak) {
      currentStreak = 0;
  }

  return { currentStreak, longestStreak };
}