import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@my-app/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}