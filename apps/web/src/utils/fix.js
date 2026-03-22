const fs = require('fs');
fs.writeFileSync('c:/Users/chris/OneDrive/Documents/trail-platform/my-app/apps/web/src/utils/trpc.ts', `
import type { AppRouter } from "@my-app/api/routers/index";
import { QueryCache, MutationCache, QueryClient } from "@tanstack/react-query"; 
import { createTRPCReact } from "@trpc/react-query";
import { toast } from "sonner";
import { httpBatchLink } from "@trpc/client";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(error.message, {
        action: { label: "retry", onClick: () => query.invalidate() }
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => { toast.error(error.message || "An unexpected error occurred"); },
  }),
});

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      fetch(url, options) {
        return fetch(url as any, { ...(options as any), credentials: "include" });
      },
    }),
  ],
});
`);
