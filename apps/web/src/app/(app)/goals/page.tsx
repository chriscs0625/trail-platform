"use client";

import { CheckSquare } from "lucide-react";

import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { GoalCard } from "@/components/goals/GoalCard";
import { trpc } from "@/utils/trpc";
import { GoalCardSkeleton } from "@/components/ui/GoalCardSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export default function GoalsPage() {
  const { data: goals, isLoading, error } = trpc.goals.list.useQuery();

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Goals</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your daily, weekly, and monthly tracking targets.
          </p>
        </div>
        <CreateGoalDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GoalCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage 
          title="Failed to load goals" 
          message={error.message || "Please refresh the page or try again later."} 
        />
      ) : goals?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-24 text-center bg-zinc-950/50">
          <div className="mb-4 rounded-full bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
            <CheckSquare className="h-12 w-12 text-zinc-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-zinc-200">No goals yet</h3>
          <p className="mb-6 max-w-sm text-sm text-zinc-400">
            You don't have any active goals yet. Create one to start tracking your habits and building streaks!
          </p>
          <CreateGoalDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {goals?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}