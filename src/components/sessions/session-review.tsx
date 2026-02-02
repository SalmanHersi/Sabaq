"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MushafSessionViewer,
  type MistakeDetail,
  MISTAKE_TYPES,
} from "@/components/quran/mushaf-session-viewer";

interface SessionReviewProps {
  session: {
    surahNumber: number;
    startAyah: number;
    endAyah: number;
    mistakeCount: number;
    mistakeDetails?: MistakeDetail[];
    isPassed: boolean;
    quality: string;
    sessionType: string;
    sessionDate: number;
    notes?: string | null;
    surah?: {
      nameEnglish?: string;
      nameArabic?: string;
      totalAyahs?: number;
    } | null;
    student?: {
      user?: { name?: string | null } | null;
    } | null;
    teacher?: {
      user?: { name?: string | null } | null;
    } | null;
  };
  backHref: string;
  backLabel?: string;
  showStudent?: boolean;
  showTeacher?: boolean;
}

const formatSessionType = (type: string): { label: string; color: string } => {
  switch (type) {
    case "NEW_MEMORIZATION":
      return { label: "New", color: "text-emerald-600" };
    case "REVISION":
      return { label: "Revision", color: "text-sky-600" };
    case "RE_TEST":
      return { label: "Re-test", color: "text-amber-600" };
    default:
      return { label: type, color: "text-ink/60" };
  }
};

export function SessionReview({
  session,
  backHref,
  backLabel = "Back",
  showStudent = true,
  showTeacher = true,
}: SessionReviewProps) {
  const sessionDate = new Date(session.sessionDate);
  const formattedDate = sessionDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = sessionDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const versesCount = session.endAyah - session.startAyah + 1;
  const sessionTypeInfo = formatSessionType(session.sessionType);
  const mistakes = session.mistakeDetails ?? [];
  const surahEnglish = session.surah?.nameEnglish ?? "Unknown";
  const surahArabic = session.surah?.nameArabic ?? "-";

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-2 w-fit"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <Card className="relative overflow-hidden border-gold/20 bg-parchment/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold/20 via-gold/70 to-gold/20" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3 min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/40">
                Session Review
              </p>
              <div>
                <h1
                  className="text-4xl sm:text-5xl font-semibold text-navy leading-tight"
                  style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}
                >
                  {surahArabic}
                </h1>
                <p className="text-base sm:text-sm text-ink/60 tracking-wide">
                  {surahEnglish}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-ink/50">
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/70 px-3 py-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Verses {session.startAyah}-{session.endAyah} ({versesCount})
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/70 px-3 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formattedDate} - {formattedTime}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                  session.isPassed
                    ? "bg-sage/15 text-sage"
                    : "bg-red-100 text-red-600"
                )}
              >
                {session.isPassed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {session.isPassed ? "Passed" : "Needs Practice"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/70 px-4 py-2 text-sm font-medium",
                  sessionTypeInfo.color
                )}
              >
                {sessionTypeInfo.label}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/70 px-4 py-2 text-sm text-ink/60">
                <Sparkles className="h-4 w-4 text-gold" />
                {session.quality.toLowerCase().replace("_", " ")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-[11px] uppercase text-ink/40">Verse Range</p>
                  <p className="text-lg font-semibold text-navy">
                    {session.startAyah}-{session.endAyah}
                  </p>
                  <p className="text-[11px] text-ink/45">{versesCount} verses</p>
                </div>
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-[11px] uppercase text-ink/40">Session Type</p>
                  <p className={cn("text-lg font-semibold", sessionTypeInfo.color)}>
                    {sessionTypeInfo.label}
                  </p>
                  <p className="text-[11px] text-ink/45">{session.isPassed ? "Passed" : "Needs review"}</p>
                </div>
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-[11px] uppercase text-ink/40">Mistakes</p>
                  <p className="text-lg font-semibold text-navy">{session.mistakeCount}</p>
                  <p className="text-[11px] text-ink/45">Recorded issues</p>
                </div>
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-[11px] uppercase text-ink/40">Quality</p>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          session.quality === "EXCELLENT" && "bg-sage",
                          session.quality === "GOOD" && (i < 2 ? "bg-gold" : "bg-gold/20"),
                          session.quality === "NEEDS_IMPROVEMENT" &&
                            (i < 1 ? "bg-amber-500" : "bg-amber-500/20")
                        )}
                      />
                    ))}
                    <span className="ml-1 text-[11px] text-ink/45 capitalize">
                      {session.quality.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {(showStudent || showTeacher) && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4 text-oxblood/60" />
                  People
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-ink/70">
                {showStudent && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink/40">Student</span>
                    <span className="font-medium text-navy">
                      {session.student?.user?.name || "Student"}
                    </span>
                  </div>
                )}
                {showTeacher && (
                  <div className="flex items-center justify-between">
                    <span className="text-ink/40">Teacher</span>
                    <span className="font-medium text-navy">
                      {session.teacher?.user?.name || "Teacher"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {mistakes.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-red-400" />
                  Mistakes ({mistakes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {mistakes.map((m) => {
                  const config = MISTAKE_TYPES[m.type];
                  const key = m.wordIndex ? `${m.ayah}-${m.wordIndex}` : `${m.ayah}`;
                  return (
                    <span
                      key={key}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                        config.bgColor,
                        config.color
                      )}
                    >
                      <span>Ayah {m.ayah}</span>
                      {m.wordText && <span className="opacity-70">"{m.wordText}"</span>}
                      <span className="text-[10px] uppercase opacity-60">{config.label}</span>
                    </span>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {session.notes && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-ink/50" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-gold/10 bg-cream/60 p-4 text-sm text-ink/70 italic leading-relaxed">
                  "{session.notes}"
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4 border-b border-gold/10 bg-white/80">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-oxblood/60" />
              Quran Text
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <MushafSessionViewer
              surahId={session.surahNumber}
              startAyah={session.startAyah}
              endAyah={session.endAyah}
              mistakeDetails={mistakes}
              mode="view"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
