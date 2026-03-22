"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  const isHot = currentStreak > 0;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div 
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
          isHot ? "bg-orange-500/10 text-orange-500" : "bg-zinc-800 text-zinc-500"
        )}
      >
        <Flame className={cn("h-6 w-6", isHot && "animate-pulse")} />
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Current Streak
        </span>
        <div className="flex items-baseline gap-2">
          <motion.span
            key={currentStreak} // Triggers animation on change
            initial={{ y: -10, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className={cn(
              "text-2xl font-bold",
              isHot ? "text-orange-500" : "text-white"
            )}
          >
            {currentStreak}
          </motion.span>
          <span className="text-sm text-zinc-400">
            (Best: {longestStreak})
          </span>
        </div>
      </div>
    </div>
  );
}