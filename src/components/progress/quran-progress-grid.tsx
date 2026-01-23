"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Target, TrendingUp, Loader2 } from "lucide-react";

interface QuranProgressGridProps {
  studentId?: string;
}

export function QuranProgressGrid({ studentId }: QuranProgressGridProps) {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);

  const surahs = useQuery(api.quran.listSurahs, {});
  const progress = useQuery(
    api.progress.getByStudent,
    studentId ? { studentId: studentId as Id<"studentProfiles"> } : "skip"
  );

  const loading = surahs === undefined || (studentId && progress === undefined);

  const getProgressForSurah = (surahNumber: number) => {
    return progress?.find((p) => p.surahNumber === surahNumber);
  };

  const getStatusColor = (surahNumber: number) => {
    const prog = getProgressForSurah(surahNumber);
    if (!prog) return "bg-cream text-ink/40";

    const percent = (prog.totalVersesMem / prog.totalVersesInSurah) * 100;
    if (percent >= 100) return "bg-green-500 text-white";
    if (percent > 0) return "bg-blue-500 text-white";
    return "bg-cream text-ink/40";
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

  const selectedSurah = surahs?.find((s) => s.surahNumber === selectedSurahNumber);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood mx-auto" />
          <p className="mt-2 text-ink/50">Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verses Memorized</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVersesMemoized.toLocaleString()}</div>
            <p className="text-xs text-ink/50">of {totalVerses.toLocaleString()} total</p>
            <div className="mt-2 h-2 bg-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(totalVersesMemoized / totalVerses) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surahs Completed</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surahsCompleted}</div>
            <p className="text-xs text-ink/50">of 114 surahs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress?.filter((p) => p.totalVersesMem > 0 && p.totalVersesMem < p.totalVersesInSurah).length || 0}
            </div>
            <p className="text-xs text-ink/50">surahs started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Mistakes</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGrade > 0 ? avgGrade.toFixed(1) : "--"}</div>
            <p className="text-xs text-ink/50">per session</p>
          </CardContent>
        </Card>
      </div>

      {/* Surah Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Quran Progress - 114 Surahs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 xl:grid-cols-19 gap-1.5 sm:gap-1">
            {surahs?.map((surah) => (
              <button
                key={surah._id}
                type="button"
                onClick={() => setSelectedSurahNumber(surah.surahNumber)}
                className={cn(
                  "aspect-square min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] rounded text-xs font-medium transition-all active:scale-95 hover:scale-110 hover:z-10",
                  "flex items-center justify-center cursor-pointer",
                  getStatusColor(surah.surahNumber),
                  selectedSurahNumber === surah.surahNumber && "ring-2 ring-offset-2 ring-navy"
                )}
                title={getTooltip(surah.surahNumber, surah.nameEnglish, surah.totalAyahs)}
              >
                {surah.surahNumber}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 sm:gap-6 mt-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cream" />
              <span>Not Started</span>
            </div>
          </div>

          {/* Selected Surah Detail */}
          {selectedSurah && (
            <div className="mt-4 p-3 sm:p-4 bg-cream rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">
                    {selectedSurah.surahNumber}. {selectedSurah.nameEnglish}
                  </h3>
                  <p className="text-ink/50 text-sm">{selectedSurah.nameArabic}</p>
                </div>
                <div className="sm:text-right">
                  {(() => {
                    const prog = getProgressForSurah(selectedSurah.surahNumber);
                    if (!prog) return <span className="text-ink/50">Not started</span>;
                    const percent = Math.round((prog.totalVersesMem / prog.totalVersesInSurah) * 100);
                    return (
                      <>
                        <p className="text-2xl font-bold">{percent}%</p>
                        <p className="text-sm text-ink/50">
                          {prog.totalVersesMem}/{prog.totalVersesInSurah} verses
                        </p>
                        {prog.sessionCount > 0 && (
                          <p className="text-sm text-ink/50">
                            {prog.sessionCount} sessions | Avg mistakes: {prog.avgMistakes.toFixed(1)}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
