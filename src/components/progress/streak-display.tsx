"use client";

import { Flame, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string | null;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  lastActiveDate,
}: StreakDisplayProps) {
  const isActiveToday = lastActiveDate
    ? new Date(lastActiveDate).toDateString() === new Date().toDateString()
    : false;

  const getEncouragement = () => {
    if (currentStreak === 0) return "Start your journey today!";
    if (currentStreak === 1) return "Great start! Keep going!";
    if (currentStreak < 7) return "Keep it going!";
    if (currentStreak < 30) return "Mashallah! You're doing amazing!";
    return "Incredible dedication!";
  };

  return (
    <Card className="">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Current Streak */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`p-2 sm:p-3 rounded-full ${
                isActiveToday
                  ? "bg-gradient-to-br from-oxblood to-oxblood/80"
                  : "bg-ink/10"
              }`}
            >
              <Flame
                className={`h-6 w-6 sm:h-8 sm:w-8 ${
                  isActiveToday ? "text-white" : "text-ink/40"
                }`}
              />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-navy">
                  {currentStreak}
                </span>
                <span className="text-ink/50 text-sm">day streak</span>
              </div>
              <p className="text-sm text-ink/60 mt-1">{getEncouragement()}</p>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="flex items-center sm:flex-col gap-2 sm:gap-0 sm:text-right">
            <div className="flex items-center gap-2 sm:justify-end text-gold">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm font-medium">Best Streak</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-navy sm:mt-1">
              {longestStreak}
              <span className="text-sm text-ink/50 ml-1">days</span>
            </div>
          </div>
        </div>

        {/* Streak Progress Visual */}
        <div className="mt-4 pt-4 border-t border-gold/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-ink/50">This week</span>
            <span className="text-xs text-ink/50">
              {isActiveToday ? "Active today" : "Complete a session to extend your streak"}
            </span>
          </div>
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => {
              const dayDate = new Date();
              dayDate.setDate(dayDate.getDate() - (6 - i));
              const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
              const isWithinStreak = i >= 7 - currentStreak;
              const isToday = i === 6;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-ink/40">
                    {dayNames[dayDate.getDay()]}
                  </span>
                  <div
                    className={`w-full h-8 rounded ${
                      isWithinStreak
                        ? isToday && isActiveToday
                          ? "bg-gradient-to-br from-oxblood to-oxblood/80"
                          : isWithinStreak && !isToday
                          ? "bg-sage/70"
                          : "bg-ink/10"
                        : "bg-ink/5"
                    } flex items-center justify-center`}
                  >
                    {isWithinStreak && (
                      <Flame
                        className={`h-4 w-4 ${
                          isToday && isActiveToday
                            ? "text-white"
                            : "text-white/80"
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
