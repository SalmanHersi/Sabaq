"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Target, TrendingUp, Loader2, ChevronRight } from "lucide-react";

interface QuranProgressGridProps {
  studentId?: string;
  showStats?: boolean;
  showGrid?: boolean;
}

export function QuranProgressGrid({
  studentId,
  showStats = true,
  showGrid = true,
}: QuranProgressGridProps) {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);

  const surahs = useQuery(api.quran.listSurahs, showGrid ? {} : "skip");
  const progress = useQuery(
    api.progress.getByStudent,
    studentId && (showStats || showGrid) ? { studentId: studentId as Id<"studentProfiles"> } : "skip"
  );

  if (!showStats && !showGrid) {
    return null;
  }

  const loading = (showGrid && surahs === undefined) || ((showStats || showGrid) && studentId && progress === undefined);

  const getProgressForSurah = (surahNumber: number) => {
    return progress?.find((p) => p.surahNumber === surahNumber);
  };

  const getStatusColor = (surahNumber: number) => {
    const prog = getProgressForSurah(surahNumber);
    if (!prog) return "bg-cream/80 text-ink/30 border border-gold/10";

    const percent = (prog.totalVersesMem / prog.totalVersesInSurah) * 100;
    if (percent >= 100) return "bg-gradient-to-br from-sage to-sage/90 text-white shadow-[0_2px_8px_rgba(107,142,35,0.25)]";
    if (percent > 0) return "bg-gradient-to-br from-navy to-navy/90 text-white shadow-[0_2px_8px_rgba(44,62,80,0.2)]";
    return "bg-cream/80 text-ink/30 border border-gold/10";
  };

  const getTooltip = (surahNumber: number, nameEnglish: string, totalAyahs: number) => {
    const prog = getProgressForSurah(surahNumber);
    if (!prog) return `${nameEnglish} - Not started`;

    const percent = Math.round((prog.totalVersesMem / prog.totalVersesInSurah) * 100);
    return `${nameEnglish} - ${percent}% (${prog.totalVersesMem}/${prog.totalVersesInSurah} verses)`;
  };

  // Calculate statistics
  const totalVersesMemoized = progress?.reduce((sum, p) => sum + p.totalVersesMem, 0) || 0;
  const totalVerses = 6236;
  const surahsCompleted = progress?.filter(
    (p) => p.totalVersesMem >= p.totalVersesInSurah
  ).length || 0;
  const avgGrade = progress && progress.length > 0
    ? progress.reduce((sum, p) => sum + p.avgMistakes, 0) / progress.length
    : 0;

  const selectedSurah = showGrid ? surahs?.find((s) => s.surahNumber === selectedSurahNumber) : undefined;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood mx-auto" />
          <p className="mt-3 text-ink/50 text-sm">Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: "Verses Memorized",
      value: totalVersesMemoized.toLocaleString(),
      subtitle: `of ${totalVerses.toLocaleString()} total`,
      icon: BookOpen,
      iconColor: "text-sage",
      iconBg: "bg-sage/10",
      progress: (totalVersesMemoized / totalVerses) * 100,
      progressColor: "bg-sage",
    },
    {
      title: "Surahs Completed",
      value: surahsCompleted,
      subtitle: "of 114 surahs",
      icon: Trophy,
      iconColor: "text-gold",
      iconBg: "bg-gold/10",
    },
    {
      title: "In Progress",
      value: progress?.filter((p) => p.totalVersesMem > 0 && p.totalVersesMem < p.totalVersesInSurah).length || 0,
      subtitle: "surahs started",
      icon: Target,
      iconColor: "text-navy",
      iconBg: "bg-navy/10",
    },
    {
      title: "Avg Mistakes",
      value: avgGrade > 0 ? avgGrade.toFixed(1) : "--",
      subtitle: "per session",
      icon: TrendingUp,
      iconColor: "text-oxblood",
      iconBg: "bg-oxblood/10",
    },
  ];

  return (
    <div className="space-y-6">
      {showStats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={stat.title}
              className="group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-ink/55 uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                  stat.iconBg
                )}>
                  <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy font-[family-name:var(--font-display)]">
                  {stat.value}
                </div>
                <p className="text-xs text-ink/45 mt-0.5">{stat.subtitle}</p>
                {stat.progress !== undefined && (
                  <div className="mt-3 h-1.5 bg-cream rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", stat.progressColor)}
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showGrid && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Quran Progress</CardTitle>
              <span className="text-xs text-ink/45 font-medium">114 Surahs</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 xl:grid-cols-19 gap-1.5">
              {surahs?.map((surah) => (
                <button
                  key={surah._id}
                  type="button"
                  onClick={() => setSelectedSurahNumber(surah.surahNumber)}
                  className={cn(
                    "aspect-square min-h-[36px] min-w-[36px] rounded-lg text-xs font-semibold",
                    "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "active:scale-90 hover:scale-110 hover:z-10",
                    "flex items-center justify-center cursor-pointer",
                    getStatusColor(surah.surahNumber),
                    selectedSurahNumber === surah.surahNumber && "ring-2 ring-offset-2 ring-oxblood scale-110 z-10"
                  )}
                  title={getTooltip(surah.surahNumber, surah.nameEnglish, surah.totalAyahs)}
                >
                  {surah.surahNumber}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 sm:gap-8 mt-6 pt-4 border-t border-gold/10">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-sage to-sage/90 shadow-sm" />
                <span className="text-xs text-ink/60 font-medium">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-navy to-navy/90 shadow-sm" />
                <span className="text-xs text-ink/60 font-medium">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cream/80 border border-gold/10" />
                <span className="text-xs text-ink/60 font-medium">Not Started</span>
              </div>
            </div>

            {/* Selected Surah Detail */}
            {selectedSurah && (
              <div className="mt-6 p-5 bg-gradient-to-br from-parchment via-parchment to-cream/50 rounded-xl border border-gold/10 animate-scale-in">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-lg text-navy font-[family-name:var(--font-display)]">
                      {selectedSurah.surahNumber}. {selectedSurah.nameEnglish}
                    </h3>
                    <p className="text-ink/45 text-base mt-0.5" dir="rtl">
                      {selectedSurah.nameArabic}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    {(() => {
                      const prog = getProgressForSurah(selectedSurah.surahNumber);
                      if (!prog) return (
                        <span className="inline-flex items-center gap-1 text-ink/45 text-sm">
                          Not started
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      );
                      const percent = Math.round((prog.totalVersesMem / prog.totalVersesInSurah) * 100);
                      return (
                        <div className="space-y-1">
                          <p className="text-3xl font-bold text-navy font-[family-name:var(--font-display)]">
                            {percent}%
                          </p>
                          <p className="text-sm text-ink/50">
                            {prog.totalVersesMem}/{prog.totalVersesInSurah} verses
                          </p>
                          {prog.sessionCount > 0 && (
                            <p className="text-xs text-ink/40">
                              {prog.sessionCount} sessions | Avg: {prog.avgMistakes.toFixed(1)} mistakes
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
