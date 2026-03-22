"use client";

import { BarChart, CheckSquare, Settings, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Goals", href: "/goals", icon: CheckSquare },
  { label: "Analytics", href: "/analytics", icon: BarChart },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ 
  user 
}: { 
  user: { name: string; email: string; image?: string | null } 
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col justify-between border-r border-border bg-zinc-950 px-4 py-6 text-zinc-300">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2 text-white">
          <CheckSquare className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold tracking-tight">Tracker</span>
        </div>

        <nav className="flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-white",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "hover:bg-zinc-900/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800">
          {user.image ? (
            <img src={user.image} alt={user.name} className="h-10 w-10 rounded-full" />
          ) : (
            <span className="text-sm font-bold text-white">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-medium text-white">
            {user.name}
          </span>
          <span className="truncate text-xs text-zinc-500">
            {user.email}
          </span>
        </div>
      </div>
    </div>
  );
}