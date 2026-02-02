"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuranProgressGrid } from "@/components/progress/quran-progress-grid";
import { SessionList } from "@/components/sessions/session-list";
import { Loader2, Sparkles } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function StudentDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user, isLoading: userLoading } = useCurrentUser();

  // Get student's sessions - only query when authenticated
  const sessions = useQuery(api.sessions.list, isAuthenticated ? { limit: 5 } : "skip");

  // We need to get the student profile ID from the sessions or current user
  // The sessions list will return the student's sessions when logged in as a student
  const studentProfileId = sessions?.[0]?.student?._id;

  if (authLoading || userLoading || sessions === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
          <p className="text-sm text-ink/50">Loading your progress...</p>
        </div>
      </div>
    );
  }

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
          My Progress
        </h1>
        <p className="text-ink/55">Track your Quran memorization journey</p>
      </div>

      {/* Progress Grid */}
      <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <QuranProgressGrid studentId={studentProfileId} />
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
    </div>
  );
}
