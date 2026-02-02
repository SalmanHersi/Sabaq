"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, BookOpen, Calendar } from "lucide-react";
import { type MistakeDetail } from "@/components/quran/mushaf-session-viewer";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
const getSessionTypeStyles = (type: string): string => {
  switch (type) {
    case "NEW_MEMORIZATION":
      return "bg-sage/10 text-sage border-sage/20";
    case "REVISION":
      return "bg-navy/10 text-navy border-navy/20";
    case "RE_TEST":
      return "bg-gold/10 text-gold border-gold/20";
    default:
      return "bg-cream text-ink/70 border-gold/20";
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
  detailHrefBase?: string;
  getDetailHref?: (session: Session) => string;
  title?: string;
  emptyMessage?: string;
}

export function SessionList({
  sessions,
  detailHrefBase,
  getDetailHref,
  title = "Recent Sessions",
  emptyMessage = "No sessions recorded yet.",
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-ink/40" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-cream/80 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-ink/25" />
            </div>
            <p className="text-ink/50 text-sm">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-oxblood/60" />
            {title}
            <span className="text-xs text-ink/40 font-normal ml-1">
              ({sessions.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {sessions.map((session, index) => {
            const sessionDate = new Date(session.sessionDate);
            const formattedDate = sessionDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const href = getDetailHref
              ? getDetailHref(session)
              : `${detailHrefBase ?? ""}/${session.id}`;

            return (
              <Link
                key={session.id}
                href={href}
                style={{ animationDelay: `${index * 0.05}s` }}
                className={cn(
                  "group flex items-center gap-4 px-4 py-3.5 rounded-xl",
                  "border border-gold/10 bg-white/80",
                  "hover:bg-parchment hover:border-gold/20 hover:shadow-[0_2px_8px_rgba(197,160,101,0.08)]",
                  "cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "animate-fade-in opacity-0"
                )}
              >
                {/* Status indicator */}
                <div className={cn(
                  "w-1.5 h-10 rounded-full flex-shrink-0",
                  session.isPassed ? "bg-sage" : "bg-red-500"
                )} />

                {/* Surah & Verses */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-navy truncate">
                      {session.surah.nameEnglish}
                    </span>
                    <span className="text-xs text-ink/40 font-medium">
                      {session.startAyah}-{session.endAyah}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-ink/45">{formattedDate}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                      getSessionTypeStyles(session.sessionType)
                    )}>
                      {formatSessionType(session.sessionType)}
                    </span>
                    {session.mistakeCount > 0 && (
                      <span className="text-xs text-red-500/80 font-medium">
                        {session.mistakeCount} mistake{session.mistakeCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pass/Fail Badge */}
                <div
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0",
                    session.isPassed
                      ? "bg-sage/10 text-sage"
                      : "bg-red-100 text-red-600"
                  )}
                >
                  {session.isPassed ? "Pass" : "Fail"}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-ink/20 group-hover:text-ink/40 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
