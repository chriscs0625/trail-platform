"use client";

import Link from "next/link";
import { Archive, Flame, Target } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import type { AppRouter } from "@my-app/api";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type GoalType = RouterOutputs["goals"]["list"][number];

interface GoalCardProps {
  goal: GoalType;
}

export function GoalCard({ goal }: GoalCardProps) {
  const utils = trpc.useUtils();

  // Assuming `getStreak` query exists and is fast enough to parallel fetch per card. 
  // For a more optimized approach, the streak could be calculated server-side in `goals.list`.
  // Wait, user asked to "Shows: ... a streak count...". Let's fetch the actual streak!
  const { data: streakData } = trpc.habits.getStreak.useQuery({ goalId: goal.id });

  const archiveMutation = trpc.goals.archive.useMutation({
    onSuccess: () => {
      toast.success("Goal archived");
      utils.goals.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to archive goal");
    },
  });

  const getFrequencyBadgeColor = (freq: string) => {
    switch (freq) {
      case "DAILY":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "WEEKLY":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "MONTHLY":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500";
    }
  };

  return (
    <Card className="group relative flex flex-col transition-all hover:border-zinc-500">
      <Link href={`/goals/${goal.id}`} className="absolute inset-0 z-0" />
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-1">{goal.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {goal.description || "No description provided."}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              archiveMutation.mutate({ id: goal.id });
            }}
            disabled={archiveMutation.isPending}
          >
            <Archive className="h-4 w-4 text-zinc-400 hover:text-red-400" />
            <span className="sr-only">Archive</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4 pt-2 relative z-10">
        <Badge variant="secondary" className={`mb-4 ${getFrequencyBadgeColor(goal.frequency)}`}>
          {goal.frequency}
        </Badge>
        
        <div className="mt-2 space-y-2">
          {/* Total completion vs target logic is simplified here as we show total historical vs something */}
          <div className="flex items-center text-sm">
            <Target className="mr-2 h-4 w-4 text-zinc-400" />
            <span className="text-zinc-300">
              Target: <span className="font-semibold text-white">{goal.targetCount}</span> per {goal.frequency.toLowerCase()}
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <Flame className={`mr-2 h-4 w-4 ${streakData?.currentStreak && streakData.currentStreak > 0 ? "text-orange-500" : "text-zinc-400"}`} />
            <span className="text-zinc-300">
              Current Streak: <span className="font-semibold text-white">{streakData?.currentStreak ?? 0}</span>
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-border bg-muted/20 px-6 py-3 relative z-10">
        <div className="flex w-full items-center justify-between text-xs text-zinc-500">
          <span>Total Logs: {goal._count.habitLogs}</span>
          <span>Started {new Date(goal.startDate).toLocaleDateString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}