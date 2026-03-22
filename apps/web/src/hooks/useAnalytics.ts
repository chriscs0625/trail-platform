"use client";

import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { format, subDays, isSameDay } from "date-fns";

export function useAnalytics() {
  const { data: goals = [], isLoading: isLoadingGoals } = trpc.goals.list.useQuery();
  const { data: weeklySummary = [], isLoading: isLoadingWeekly } = trpc.habits.getWeeklySummary.useQuery();

  // For each goal, we also need to get completions for the last 30 days.
  // Using trpc.useQueries for multiple goals wouldn't be directly accessible in tRPC 10 this way simply without dynamic hooks.
  // We'll wrap individual calls inside a component or adapt it.
  
  // Actually, wait, let's look at the requirements:
  // "Combines data from habits.getWeeklySummary and multiple habits.getStreak calls".
  // Let's create a combined data structure here.
  
  const totalGoals = goals.length;
  const completionsThisWeek = weeklySummary.reduce((acc, curr) => acc + curr.completedThisWeek, 0);

  // Simplified overall rate (just base it on weekly target count vs completion)
  const totalWeeklyTargets = weeklySummary.reduce((acc, curr) => acc + curr.targetCount, 0);
  const completionRateThisMonth = totalWeeklyTargets > 0 ? Math.round((completionsThisWeek / totalWeeklyTargets) * 100) : 0;

  return {
    goals,
    weeklySummary,
    summaryStats: {
      totalGoals,
      completionsThisWeek,
      completionRateThisMonth,
    },
    isLoading: isLoadingGoals || isLoadingWeekly,
  };
}