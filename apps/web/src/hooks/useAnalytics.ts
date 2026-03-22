"use client";

import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { format, subDays, isSameDay } from "date-fns";

export interface GoalStat {
  id: string;
  title: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | string;
  targetCount: number;
}

export interface WeeklyData {
  goalId: string;
  title: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | string;
  completedThisWeek: number;
  targetCount: number;
}

export interface AnalyticsData {
  weeklyData: WeeklyData[];
  goalStats: GoalStat[];
  overallRate: number;
  isLoading: boolean;
}

export function useAnalytics(): AnalyticsData {
  const { data: goals = [], isLoading: isLoadingGoals } = trpc.goals.list.useQuery();
  const { data: weeklyDataRaw = [], isLoading: isLoadingWeekly } = trpc.habits.getWeeklySummary.useQuery();

  const totalGoals = goals.length;
  const completionsThisWeek = weeklyDataRaw.reduce((acc: number, curr: WeeklyData) => acc + curr.completedThisWeek, 0);

  const totalWeeklyTargets = weeklyDataRaw.reduce((acc: number, curr: WeeklyData) => acc + curr.targetCount, 0);
  const overallRate = totalWeeklyTargets > 0 ? Math.round((completionsThisWeek / totalWeeklyTargets) * 100) : 0;

  return {
    weeklyData: weeklyDataRaw as WeeklyData[],
    goalStats: goals.map((g: any) => ({
      id: g.id,
      title: g.title,
      frequency: g.frequency,
      targetCount: g.targetCount
    })) as GoalStat[],
    overallRate,
    isLoading: isLoadingGoals || isLoadingWeekly,
  };
}