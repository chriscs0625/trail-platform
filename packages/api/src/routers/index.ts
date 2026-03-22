import { protectedProcedure, publicProcedure, router } from "../index";
import { goalsRouter } from "./goals";

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
});
export type AppRouter = typeof appRouter;
