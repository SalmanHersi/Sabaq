"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SessionList } from "@/components/sessions/session-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ClipboardList, Flame, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function StudentDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user, isLoading: userLoading } = useCurrentUser();

  const studentProfile = useQuery(api.students.getMine, isAuthenticated ? {} : "skip");

  // Get student's sessions - only query when authenticated
  const sessions = useQuery(api.sessions.list, isAuthenticated ? { limit: 5 } : "skip");
  const summary = useQuery(
    api.progress.getSummary,
    studentProfile?._id ? { studentId: studentProfile._id } : "skip"
  );
  const assignments = useQuery(
    api.assignments.list,
    isAuthenticated ? { includeCompleted: false } : "skip"
  );

  const studentProfileId = studentProfile?._id;

  if (
    authLoading ||
    userLoading ||
    sessions === undefined ||
    studentProfile === undefined ||
    summary === undefined ||
    assignments === undefined
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
          <p className="text-sm text-ink/50">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const nextAssignment = assignments?.[0];
  const lastSession = sessions?.[0];

  // Transform sessions to match SessionList expected format
  const formattedSessions = sessions?.map((session) => ({
    id: session._id,
    surahId: session.surahNumber,
    surah: session.surah ? {
      id: session.surah.surahNumber,
      nameEnglish: session.surah.nameEnglish,
      nameArabic: session.surah.nameArabic,
      totalAyahs: session.surah.totalAyahs,
    } : {
      id: session.surahNumber,
      nameEnglish: "Unknown",
      nameArabic: "",
    },
    startAyah: session.startAyah,
    endAyah: session.endAyah,
    isPassed: session.isPassed,
    quality: session.quality,
    mistakeCount: session.mistakeCount,
    mistakeAyahs: session.mistakeDetails,
    sessionType: session.sessionType,
    sessionDate: new Date(session.sessionDate).toISOString(),
    notes: session.notes,
    student: {
      user: { name: session.student?.user?.name || "Student" },
    },
    teacher: {
      user: { name: session.teacher?.user?.name || "Teacher" },
    },
  })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <p className="text-sm font-medium text-gold">Your Journey</p>
        </div>
        <h1 className="text-3xl font-bold text-navy font-[family-name:var(--font-display)] tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-ink/55">Here&apos;s what to focus on today</p>
      </div>

      {/* Action Snapshot */}
      <div className="grid gap-4 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-navy text-base">Next assignment</CardTitle>
          </CardHeader>
          <CardContent>
            {nextAssignment ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{nextAssignment.title}</p>
                  <div className="flex items-center gap-2 text-sm text-ink/60 mt-1">
                    <ClipboardList className="h-4 w-4" />
                    <span>From {nextAssignment.teacher?.user?.name || "Teacher"}</span>
                    {nextAssignment.dueDate && (
                      <>
                        <span className="text-ink/30">•</span>
                        <Calendar className="h-4 w-4" />
                        <span>Due {format(new Date(nextAssignment.dueDate), "MMM d")}</span>
                      </>
                    )}
                  </div>
                </div>
                <Link href="/student/assignments">
                  <Button className="bg-oxblood hover:bg-oxblood/90">View assignment</Button>
                </Link>
              </div>
            ) : (
              <div className="text-sm text-ink/60 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-ink/40" />
                No active assignments right now.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-navy text-base">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-oxblood/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-oxblood" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{summary?.currentStreak ?? 0}</p>
                <p className="text-xs text-ink/50">day streak</p>
              </div>
            </div>
            <p className="text-xs text-ink/50 mt-3">
              Best streak: {summary?.longestStreak ?? 0} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <div className="animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
        <SessionList
          sessions={formattedSessions}
          title="Recent Sessions"
          emptyMessage="No sessions recorded yet. Start memorizing to see your progress!"
          detailHrefBase="/student/history"
        />
      </div>

      {/* Progress Snapshot */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-ink/55 uppercase tracking-wide">
              Verses Memorized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">
              {summary?.totalVersesMemorized?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-ink/45 mt-0.5">of 6,236 total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-ink/55 uppercase tracking-wide">
              Surahs Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">
              {summary?.surahsCompleted ?? 0}
            </div>
            <p className="text-xs text-ink/45 mt-0.5">of 114 surahs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-ink/55 uppercase tracking-wide">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">
              {summary?.surahsInProgress ?? 0}
            </div>
            <p className="text-xs text-ink/45 mt-0.5">surahs started</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/student/progress">
          <Button variant="outline" className="border-gold/30 text-navy">
            <TrendingUp className="h-4 w-4 mr-2" />
            View full progress
          </Button>
        </Link>
        <Link href="/student/history">
          <Button variant="outline" className="border-gold/30 text-navy">
            View history
          </Button>
        </Link>
      </div>

    </div>
  );
}
