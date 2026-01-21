"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Target, TrendingUp } from "lucide-react";

interface Surah {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  totalAyahs: number;
}

interface Progress {
  surahId: number;
  totalVersesMem: number;
  totalVersesInSurah: number;
  status: string;
  avgGrade: number;
  sessionCount: number;
}

interface QuranProgressGridProps {
  studentId?: string;
  progress?: Progress[];
}

export function QuranProgressGrid({ studentId, progress: initialProgress }: QuranProgressGridProps) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [progress, setProgress] = useState<Progress[]>(initialProgress || []);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/surahs").then((r) => r.json()),
      studentId ? fetch(`/api/progress?studentId=${studentId}`).then((r) => r.json()) : Promise.resolve([]),
    ])
      .then(([surahsData, progressData]) => {
        setSurahs(surahsData);
        if (Array.isArray(progressData)) {
          setProgress(progressData);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  const getProgressForSurah = (surahId: number) => {
    return progress.find((p) => p.surahId === surahId);
  };

  const getStatusColor = (surahId: number) => {
    const prog = getProgressForSurah(surahId);
    if (!prog) return "bg-cream text-ink/40";

    const percent = (prog.totalVersesMem / prog.totalVersesInSurah) * 100;
    if (percent >= 100) return "bg-green-500 text-white";
    if (percent > 0) return "bg-blue-500 text-white";
    return "bg-cream text-ink/40";
  };

  const getTooltip = (surah: Surah) => {
    const prog = getProgressForSurah(surah.id);
    if (!prog) return `${surah.nameEnglish} - Not started`;

    const percent = Math.round((prog.totalVersesMem / prog.totalVersesInSurah) * 100);
    return `${surah.nameEnglish} - ${percent}% (${prog.totalVersesMem}/${prog.totalVersesInSurah} verses)`;
  };

  // Calculate statistics
  const totalVersesMemoized = progress.reduce((sum, p) => sum + p.totalVersesMem, 0);
  const totalVerses = 6236;
  const surahsCompleted = progress.filter(
    (p) => p.totalVersesMem >= p.totalVersesInSurah
  ).length;
  const avgGrade = progress.length > 0
    ? progress.reduce((sum, p) => sum + p.avgGrade, 0) / progress.length
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading progress...</div>
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
              {progress.filter((p) => p.totalVersesMem > 0 && p.totalVersesMem < p.totalVersesInSurah).length}
            </div>
            <p className="text-xs text-ink/50">surahs started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGrade > 0 ? avgGrade.toFixed(1) : "--"}</div>
            <p className="text-xs text-ink/50">out of 10</p>
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
            {surahs.map((surah) => (
              <button
                key={surah.id}
                type="button"
                onClick={() => setSelectedSurah(surah)}
                className={cn(
                  "aspect-square min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] rounded text-xs font-medium transition-all active:scale-95 hover:scale-110 hover:z-10",
                  "flex items-center justify-center cursor-pointer",
                  getStatusColor(surah.id),
                  selectedSurah?.id === surah.id && "ring-2 ring-offset-2 ring-navy"
                )}
                title={getTooltip(surah)}
              >
                {surah.id}
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
                    {selectedSurah.id}. {selectedSurah.nameEnglish}
                  </h3>
                  <p className="text-ink/50 text-sm">{selectedSurah.nameArabic}</p>
                </div>
                <div className="sm:text-right">
                  {(() => {
                    const prog = getProgressForSurah(selectedSurah.id);
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
                            {prog.sessionCount} sessions | Avg: {prog.avgGrade.toFixed(1)}/10
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
