"use client";

import { useEffect, useState } from "react";
import { QuranProgressGrid } from "@/components/progress/quran-progress-grid";
import { SessionList } from "@/components/sessions/session-list";
import { Loader2 } from "lucide-react";

interface Session {
  id: string;
  surahId: number;
  surah: {
    id: number;
    nameEnglish: string;
    nameArabic: string;
    totalAyahs?: number;
  };
  startAyah: number;
  endAyah: number;
  isPassed: boolean;
  quality: string;
  mistakeCount: number;
  sessionType: string;
  sessionDate: string;
  notes?: string | null;
  student: {
    user: { name: string };
  };
  teacher: {
    user: { name: string };
  };
}

export default function StudentDashboard() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get student profile first
    fetch("/api/students")
      .then((r) => r.json())
      .then(async (data) => {
        // For a student user, fetch their own sessions
        const sessionsRes = await fetch("/api/sessions?limit=5");
        const sessionsData = await sessionsRes.json();

        if (Array.isArray(sessionsData)) {
          setSessions(sessionsData);
          // Extract studentId from first session if available
          if (sessionsData.length > 0) {
            setStudentId(sessionsData[0].studentId);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-oxblood" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">My Progress</h1>
        <p className="text-ink/60 text-sm">Track your Quran memorization journey</p>
      </div>

      {/* Progress Grid */}
      <QuranProgressGrid studentId={studentId || undefined} />

      {/* Recent Sessions */}
      <SessionList
        sessions={sessions}
        showTeacher={true}
        title="Recent Sessions"
        emptyMessage="No sessions recorded yet. Start memorizing to see your progress!"
      />
    </div>
  );
}
