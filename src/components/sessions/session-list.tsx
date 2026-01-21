"use client";

import { useState } from "react";
import { SessionDetail } from "./session-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, BookOpen } from "lucide-react";
import { type MistakeDetail } from "@/components/quran/mushaf-session-viewer";

// Convert number to Arabic-Indic numerals
const toArabicNumeral = (num: number): string => {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((d) => arabicNumerals[parseInt(d)])
    .join("");
};

// Format session type for display
const formatSessionType = (type: string): string => {
  switch (type) {
    case "NEW_MEMORIZATION":
      return "New";
    case "REVISION":
      return "Revision";
    case "RE_TEST":
      return "Re-test";
    default:
      return type;
  }
};

// Get session type color
const getSessionTypeColor = (type: string): string => {
  switch (type) {
    case "NEW_MEMORIZATION":
      return "bg-green-100 text-green-700";
    case "REVISION":
      return "bg-blue-100 text-blue-700";
    case "RE_TEST":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-cream text-ink/70";
  }
};

interface Session {
  id: string;
  surahId: number;
  startAyah: number;
  endAyah: number;
  mistakeCount: number;
  mistakeAyahs?: number[] | MistakeDetail[]; // Optional - simplified schema
  isPassed: boolean;
  quality: string;
  sessionType: string;
  sessionDate: string;
  notes?: string | null;
  surah: {
    id: number;
    nameEnglish: string;
    nameArabic: string;
    totalAyahs?: number;
  };
  student: {
    user: { name: string };
  };
  teacher: {
    user: { name: string };
  };
}

interface SessionListProps {
  sessions: Session[];
  showStudent?: boolean;
  showTeacher?: boolean;
  title?: string;
  emptyMessage?: string;
}

export function SessionList({
  sessions,
  showStudent = false,
  showTeacher = false,
  title = "Recent Sessions",
  emptyMessage = "No sessions recorded yet.",
}: SessionListProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleSessionClick = (session: Session) => {
    // Normalize the session data
    const normalizedSession: Session = {
      ...session,
      mistakeAyahs: session.mistakeAyahs || [],
      surah: {
        ...session.surah,
        totalAyahs: session.surah.totalAyahs || 0,
      },
    };
    setSelectedSession(normalizedSession);
    setDetailOpen(true);
  };

  const handleClose = () => {
    setDetailOpen(false);
    setSelectedSession(null);
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-ink/50 text-center py-4 text-sm">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            {title}
            <span className="text-xs text-ink/50 font-normal">({sessions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {sessions.map((session) => {
            const sessionDate = new Date(session.sessionDate);
            const formattedDate = sessionDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 hover:border-stone-300 cursor-pointer transition-all"
              >
                {/* Surah & Verses */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-stone-800 truncate">
                      {session.surah.nameEnglish}
                    </span>
                    <span className="text-xs text-stone-500">
                      {session.startAyah}-{session.endAyah}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span>{formattedDate}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${getSessionTypeColor(session.sessionType)}`}>
                      {formatSessionType(session.sessionType)}
                    </span>
                    {session.mistakeCount > 0 && (
                      <span className="text-red-500">
                        {session.mistakeCount} mistake{session.mistakeCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pass/Fail */}
                <div
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    session.isPassed
                      ? "bg-sage/10 text-sage"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {session.isPassed ? "Pass" : "Fail"}
                </div>
                <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      <SessionDetail
        session={selectedSession}
        open={detailOpen}
        onClose={handleClose}
        showStudent={showStudent}
        showTeacher={showTeacher}
      />
    </>
  );
}
