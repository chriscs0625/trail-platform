"use client";

import { useMemo } from "react";
import { 
  addMonths, 
  eachDayOfInterval, 
  endOfMonth, 
  format, 
  getDay, 
  isFuture, 
  isSameDay, 
  isSameMonth, 
  isToday, 
  startOfMonth, 
  subMonths 
} from "date-fns";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

interface HabitCalendarProps {
  goalId: string;
  completedDates: string[]; // ISO strings
  frequency: string;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function HabitCalendar({ 
  goalId, 
  completedDates, 
  frequency, 
  currentDate, 
  onDateChange 
}: HabitCalendarProps) {
  const utils = trpc.useUtils();
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Calculate padding days to correctly align the 1st of the month
  const startingDayIndex = getDay(monthStart); // 0 = Sunday if using certain local, but date-fns standard is 0 = Sunday
  
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  const parsedCompletedDates = completedDates.map(dateStr => new Date(dateStr));

  const toggleMutation = trpc.habits.toggle.useMutation({
    onMutate: async ({ date }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await utils.habits.getCompletionsForRange.cancel({ 
        goalId, 
        from: monthStart, 
        to: monthEnd 
      });

      // Snapshot the previous value
      const previousData = utils.habits.getCompletionsForRange.getData({ 
        goalId, 
        from: monthStart, 
        to: monthEnd 
      });

      if (previousData) {
        // Optimistically update to the new value
        const targetDate = new Date(date);
        const exists = previousData.logs.some(l => isSameDay(new Date(l.completedAt), targetDate));
        
        let newLogs;
        if (exists) {
          newLogs = previousData.logs.filter(l => !isSameDay(new Date(l.completedAt), targetDate));
        } else {
          newLogs = [...previousData.logs, { 
            id: `temp-${Date.now()}`,
            goalId,
            userId: 'temp',
            completedAt: targetDate.toISOString() as any,
            note: null
          }];
        }

        utils.habits.getCompletionsForRange.setData({ 
          goalId, 
          from: monthStart, 
          to: monthEnd 
        }, {
          ...previousData,
          logs: newLogs,
          totalCompleted: newLogs.length
        });
      }

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      // Rollback on failure
      toast.error("Failed to update habit status.");
      if (context?.previousData) {
        utils.habits.getCompletionsForRange.setData({ 
          goalId, 
          from: monthStart, 
          to: monthEnd 
        }, context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure strict sync
      utils.habits.getCompletionsForRange.invalidate({ 
        goalId, 
        from: monthStart, 
        to: monthEnd 
      });
      // Optionally invalidate streak
      utils.habits.getStreak.invalidate({ goalId });
      utils.goals.getById.invalidate({ id: goalId });
      utils.goals.list.invalidate();
    },
  });

  const handleDayClick = (day: Date) => {
    if (isFuture(day)) return;

    // Use a precise localized ISO string slice to prevent timezone shifts matching backend expected: YYYY-MM-DD
    // format from date-fns accurately matches local boundary
    const dateString = format(day, "yyyy-MM-dd");
    toggleMutation.mutate({ goalId, date: dateString });
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            disabled={isSameMonth(currentDate, new Date())}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Days of week headers */}
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="mb-2 text-center text-xs font-medium text-zinc-500">
            {day}
          </div>
        ))}

        {/* Empty padding day cells */}
        {Array.from({ length: startingDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12 w-full rounded-md bg-transparent" />
        ))}

        {/* Actual days */}
        {daysInMonth.map((day: Date) => {
          const completed = parsedCompletedDates.some(completedDate => isSameDay(completedDate, day));
          const future = isFuture(day);
          const active = isToday(day);

          return (
            <button
              key={day.toISOString()}
              disabled={future}
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative flex h-12 w-full items-center justify-center rounded-lg border transition-all",
                // Future states
                future && "cursor-not-allowed border-transparent text-zinc-700 opacity-50",
                // Past & Today generic styles 
                !future && "cursor-pointer hover:border-zinc-500",
                // Checked visually
                !future && !completed && "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:bg-zinc-800",
                completed && "border-green-500/50 bg-green-500/10 text-green-500 hover:bg-green-500/20",
                // Today highlighted explicitly if not completed
                active && !completed && "border-zinc-500 text-white"
              )}
            >
              <span className="text-sm font-medium z-10">
                {format(day, "d")}
              </span>
              
              {completed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="h-8 w-8 rounded-full border-2 border-green-500/50 opacity-40 ring-2 ring-green-400 ring-offset-2 ring-offset-zinc-950/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]"></span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}