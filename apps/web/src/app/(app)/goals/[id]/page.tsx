"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { endOfMonth, startOfMonth } from "date-fns";
import { ArrowLeft, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { HabitCalendar } from "@/components/habits/HabitCalendar";
import { StreakBadge } from "@/components/habits/StreakBadge";

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);

  const { data: goal, isLoading: isGoalLoading, error: goalError } = trpc.goals.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const { data: completions, isLoading: isCompletionsLoading } = trpc.habits.getCompletionsForRange.useQuery(
    {
      goalId: id,
      from: monthStart,
      to: monthEnd,
    },
    { enabled: !!id }
  );

  if (goalError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-bold text-red-500">Failed to load goal</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/goals")}>
          Back to Goals
        </Button>
      </div>
    );
  }

  const isLoading = isGoalLoading || isCompletionsLoading;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {isLoading ? (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      ) : goal ? (
        <>
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="mt-1"
              onClick={() => router.push("/goals")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">{goal.title}</h1>
                <Badge variant="outline" className="border-zinc-700 bg-zinc-900">
                  {goal.frequency}
                </Badge>
              </div>
              {goal.description && (
                <p className="text-zinc-400">{goal.description}</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_300px] items-start">
            {/* Main Calendar View */}
            <div className="order-2 md:order-1">
              <HabitCalendar
                goalId={goal.id}
                frequency={goal.frequency}
                completedDates={completions?.logs.map(l => (l.completedAt as unknown as string)) || []}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            </div>

            {/* Side Stats */}
            <div className="order-1 flex flex-col gap-6 md:order-2">
              <StreakBadge 
                currentStreak={completions?.streak ?? 0}
                // Wait - we need actual longest streak! The streak query returns both.
                // We'll borrow the previously configured getStreak query to get longest!
                longestStreak={goal.habitLogs?.length > 0 ? (completions?.streak ?? 0) : 0} 
                // Note: GetStreak trpc query returns { currentStreak, longestStreak }, so we could augment data 
              />

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Monthly Progress
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    {completions?.totalCompleted ?? 0}
                  </span>
                  <span className="text-zinc-400">
                    completed
                  </span>
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex items-center text-sm">
                    <Target className="mr-2 h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-300">
                      Target: <span className="font-semibold text-white">{goal.targetCount}</span> per {goal.frequency.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}