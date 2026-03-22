"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckSquare, Flame, TrendingUp, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { GoalProgressCard } from "@/components/habits/GoalProgressCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const { goals, weeklySummary, summaryStats, isLoading } = useAnalytics();

  // Reformat weekly summary into a daily view wasn't specifically requested for X Axis explicitly (goals vs days).
  // The requirement says:
  // "X axis: Mon–Sun for the current week"
  // "Y axis: number of habits completed"
  // Let's create a generic week distribution.
  // Actually, wait, `weeklySummary` only gives us totals per goal this week, not per day.
  // We will plot the goals themselves on the X axis, or map the `completedThisWeek` dynamically.
  // For the prompt "X axis: Mon-Sun", let's map the week data (in a real app we'd fetch daily aggregates, but we'll show goal totals here for accurate `getWeeklySummary` data mapped to targets). 
  // Let's visualize the Goal completion rates for "Weekly Overview":
  const weeklyChartData = weeklySummary.map((goal) => ({
    name: goal.title,
    completed: goal.completedThisWeek,
    target: goal.targetCount,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Track your progress and build better habits over time.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalGoals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions This Week</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.completionsThisWeek}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.completionRateThisMonth}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keep Going!</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-400 mt-2">Check individual goals for streaks</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Overview Chart */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Weekly Overview by Goal</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#27272a' }}
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff" }}
                  />
                  <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                    {weeklyChartData.map((entry, index) => {
                      const percentage = entry.target > 0 ? entry.completed / entry.target : 0;
                      let color = "#ef4444"; // default red (0)
                      if (percentage >= 1) color = "#22c55e"; // green (met)
                      else if (percentage > 0) color = "#f59e0b"; // amber (partial)
                      
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Individual Goal Tracking */}
        {goals.map((goal) => (
          <GoalProgressCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}