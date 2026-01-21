"use client";

import {
  Award,
  BookOpen,
  Flame,
  Star,
  Trophy,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Milestone {
  id: string;
  type: string;
  surahId?: number | null;
  juzNumber?: number | null;
  earnedAt: string;
}

interface MilestoneBadgesProps {
  milestones: Milestone[];
  showAll?: boolean;
}

const milestoneConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  FIRST_SESSION: {
    icon: Star,
    label: "First Steps",
    color: "text-gold",
    bgColor: "bg-gold/10",
  },
  STREAK_3: {
    icon: Flame,
    label: "3-Day Streak",
    color: "text-oxblood",
    bgColor: "bg-oxblood/10",
  },
  STREAK_7: {
    icon: Flame,
    label: "7-Day Streak",
    color: "text-oxblood",
    bgColor: "bg-oxblood/10",
  },
  STREAK_30: {
    icon: Trophy,
    label: "30-Day Streak",
    color: "text-gold",
    bgColor: "bg-gold/10",
  },
  SURAH_COMPLETE: {
    icon: BookOpen,
    label: "Surah Complete",
    color: "text-sage",
    bgColor: "bg-sage/10",
  },
  JUZ_COMPLETE: {
    icon: Award,
    label: "Juz Complete",
    color: "text-navy",
    bgColor: "bg-navy/10",
  },
};

// Surah names for display (subset - full list in seed data)
const surahNames: Record<number, string> = {
  1: "Al-Fatihah",
  2: "Al-Baqarah",
  3: "Ali 'Imran",
  112: "Al-Ikhlas",
  113: "Al-Falaq",
  114: "An-Nas",
};

export function MilestoneBadges({ milestones, showAll = false }: MilestoneBadgesProps) {
  const displayedMilestones = showAll ? milestones : milestones.slice(0, 6);
  const recentMilestones = milestones.filter((m) => {
    const earnedDate = new Date(m.earnedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return earnedDate > weekAgo;
  });

  if (milestones.length === 0) {
    return (
      <Card className="border-gold/20 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy">
            <Award className="h-5 w-5 text-gold" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-ink/50">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-gold/40" />
            <p className="font-medium text-navy">No milestones yet</p>
            <p className="text-sm mt-1">
              Complete sessions and build streaks to earn badges!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gold/20 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-navy">
          <Award className="h-5 w-5 text-gold" />
          Milestones
          <span className="text-sm font-normal text-ink/50 ml-2">
            {milestones.length} earned
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {displayedMilestones.map((milestone) => {
            const config = milestoneConfig[milestone.type] || {
              icon: Award,
              label: milestone.type,
              color: "text-ink",
              bgColor: "bg-ink/10",
            };
            const Icon = config.icon;
            const isRecent = recentMilestones.some((m) => m.id === milestone.id);

            let label = config.label;
            if (milestone.type === "SURAH_COMPLETE" && milestone.surahId) {
              label = surahNames[milestone.surahId] || `Surah ${milestone.surahId}`;
            }

            return (
              <div
                key={milestone.id}
                className={`relative p-4 rounded-lg ${config.bgColor} border ${
                  isRecent ? "border-gold ring-2 ring-gold/20" : "border-transparent"
                } transition-all hover:scale-105`}
              >
                {isRecent && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-gold text-white rounded-full">
                    New!
                  </span>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={`p-2 rounded-full ${config.bgColor} mb-2`}>
                    <Icon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  <span className="font-medium text-sm text-navy">{label}</span>
                  <span className="text-xs text-ink/50 mt-1">
                    {format(new Date(milestone.earnedAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {!showAll && milestones.length > 6 && (
          <p className="text-center text-sm text-ink/50 mt-4">
            +{milestones.length - 6} more milestones
          </p>
        )}
      </CardContent>
    </Card>
  );
}
