"use client";

import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { data: summary, isLoading, error } = trpc.habits.getWeeklySummary.useQuery();
  const { data: user } = trpc.privateData.useQuery();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user?.user?.name ? `, ${user.user.name}` : ""}! 🚀
        </h1>
        <p className="text-muted-foreground mt-2">
          Here is how your habits are looking for this week.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[100px] mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-500">
          Error loading dashboard data.
        </div>
      ) : summary?.length === 0 ? (
        <Card className="border-dashed bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="mb-2 text-lg font-semibold">No goals yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              You haven't set up any goals or habits. Let's change that!
            </p>
            {/* We'll link this out later */}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summary?.map((goal) => {
            const isCompleted = goal.completedThisWeek >= goal.targetCount;

            return (
              <Card key={goal.goalId} className={isCompleted ? "border-purple-500/50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{goal.title}</CardTitle>
                    <span className="text-xs text-muted-foreground">{goal.frequency}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {goal.completedThisWeek} / {goal.targetCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isCompleted ? "Goal met! 🎉" : "Progress this week"}
                  </p>
                  
                  {/* Visual progress bar representation */}
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className={`h-full transition-all ${isCompleted ? 'bg-purple-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, (goal.completedThisWeek / goal.targetCount) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}