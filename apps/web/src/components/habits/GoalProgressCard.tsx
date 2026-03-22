"use client";

import { Flame } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format, subDays, isSameDay } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import type { AppRouter } from "@my-app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type GoalType = RouterOutputs["goals"]["list"][number];

interface GoalProgressCardProps {
  goal: GoalType;
}

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const { data: streak } = trpc.habits.getStreak.useQuery({ goalId: goal.id });
  
  // Get last 30 days of completions
  const endDate = new Date();
  const startDate = subDays(endDate, 30);
  
  const { data: completions } = trpc.habits.getCompletionsForRange.useQuery({
    goalId: goal.id,
    from: startDate,
    to: endDate,
  });

  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(endDate, 29 - i);
    const count = completions?.logs.filter(l => isSameDay(new Date(l.completedAt), d)).length || 0;
    return {
      date: format(d, "MMM dd"),
      completed: count,
    };
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base truncate">{goal.title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {goal.frequency}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">
              Streak: {streak?.currentStreak ?? 0}
            </span>
          </div>
          <div className="text-sm text-zinc-500">
            Best: {streak?.longestStreak ?? 0}
          </div>
        </div>

        <div className="h-[100px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <Tooltip 
                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                itemStyle={{ color: "#fff" }}
              />
              <Line 
                type="stepAfter" 
                dataKey="completed" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}