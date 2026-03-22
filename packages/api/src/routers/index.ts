import { protectedProcedure, publicProcedure, router } from "../index";
import { goalsRouter } from "./goals";
import { habitsRouter } from "./habits";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  goals: goalsRouter,
  habits: habitsRouter,
});
export type AppRouter = typeof appRouter;
