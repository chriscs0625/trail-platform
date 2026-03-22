import { TRPCError } from "@trpc/server";
import { z } from "zod";

import prisma from "@my-app/db";
import { protectedProcedure, router } from "../index";

export const goalsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
        targetCount: z.number().int().positive(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const goal = await prisma.goal.create({
          data: {
            ...input,
            userId: ctx.session.user.id,
          },
        });
        return goal;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create goal",
        });
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.goal.findMany({
      where: {
        userId: ctx.session.user.id,
        isArchived: false,
      },
      include: {
        _count: {
          select: { habitLogs: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const goal = await prisma.goal.findUnique({
        where: { id: input.id },
        include: { habitLogs: true },
      });

      if (!goal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal not found",
        });
      }

      if (goal.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this goal",
        });
      }

      return goal;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
        targetCount: z.number().int().positive().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existingGoal = await prisma.goal.findUnique({
        where: { id },
      });

      if (!existingGoal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });
      }

      if (existingGoal.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to update this goal",
        });
      }

      return prisma.goal.update({
        where: { id },
        data,
      });
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingGoal = await prisma.goal.findUnique({
        where: { id: input.id },
      });

      if (!existingGoal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });
      }

      if (existingGoal.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to archive this goal",
        });
      }

      return prisma.goal.update({
        where: { id: input.id },
        data: { isArchived: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingGoal = await prisma.goal.findUnique({
        where: { id: input.id },
      });

      if (!existingGoal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });
      }

      if (existingGoal.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this goal",
        });
      }

      return prisma.goal.delete({
        where: { id: input.id },
      });
    }),
});
