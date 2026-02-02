"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MushafSessionViewer, type MistakeDetail, type MistakeType, MISTAKE_TYPES } from "@/components/quran/mushaf-session-viewer";
import { X, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

interface Session {
  id: string;
  surahId: number;
  startAyah: number;
  endAyah: number;
  mistakeCount: number;
  mistakeAyahs?: number[] | MistakeDetail[];
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

// Helper to normalize mistake data
function normalizeMistakeDetails(mistakeAyahs: number[] | MistakeDetail[]): MistakeDetail[] {
  if (!mistakeAyahs || mistakeAyahs.length === 0) return [];
  if (typeof mistakeAyahs[0] === "object" && "ayah" in mistakeAyahs[0]) {
    return mistakeAyahs as MistakeDetail[];
  }
  return (mistakeAyahs as number[]).map((ayah) => ({
    ayah,
    type: "WORD_MISTAKE" as MistakeType,
  }));
}

interface SessionDetailProps {
  session: Session | null;
  open: boolean;
  onClose: () => void;
  showStudent?: boolean;
  showTeacher?: boolean;
}

export function SessionDetail({
  session,
  open,
  onClose,
  showStudent = true,
  showTeacher = true,
}: SessionDetailProps) {
  const [showMushaf, setShowMushaf] = useState(false);

  if (!session) return null;

  const sessionDate = new Date(session.sessionDate);
  const formattedDate = sessionDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = sessionDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const versesCount = session.endAyah - session.startAyah + 1;
  const mistakeDetails = normalizeMistakeDetails(session.mistakeAyahs || []);
  const sessionTypeInfo = formatSessionType(session.sessionType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden bg-parchment">
        {/* Header - Elegant top section */}
        <div className="relative">
          {/* Decorative top border */}
          <div className="h-1.5 sm:h-1 bg-gradient-to-r from-gold/30 via-gold to-gold/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-4 sm:right-4 sm:top-4 p-2.5 sm:p-2 rounded-full hover:bg-cream/80 transition-colors z-10 group"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4 text-ink/40 group-hover:text-ink/70 transition-colors" />
          </button>

          {/* Main header content */}
          <div className="px-5 sm:px-8 pt-8 sm:pt-6 pb-6 sm:pb-5">
            {/* Surah name - Arabic prominent */}
            <div className="text-center mb-5 sm:mb-4">
              <h2
                className="text-4xl sm:text-3xl font-semibold text-navy mb-2 sm:mb-1"
                style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}
              >
                {session.surah.nameArabic}
              </h2>
              <p className="text-base sm:text-sm text-ink/50 tracking-wide">
                {session.surah.nameEnglish}
              </p>
            </div>

            {/* Verse range - elegant display */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-5 flex-wrap">
              <span className="text-ink/40 text-sm">Verses</span>
              <div className="flex items-center gap-2 px-5 sm:px-4 py-2 sm:py-1.5 bg-cream/60 rounded-full">
                <span className="text-xl sm:text-lg font-semibold text-navy font-[family-name:var(--font-display)]">
                  {session.startAyah}
                </span>
                <span className="text-ink/30">—</span>
                <span className="text-xl sm:text-lg font-semibold text-navy font-[family-name:var(--font-display)]">
                  {session.endAyah}
                </span>
              </div>
              <span className="text-ink/40 text-sm">({versesCount} {versesCount === 1 ? 'verse' : 'verses'})</span>
            </div>

            {/* Status row - Pass/Fail + Type + Quality */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              {/* Pass/Fail indicator */}
              <div className={cn(
                "flex items-center gap-2 px-5 sm:px-4 py-2.5 sm:py-2 rounded-xl",
                session.isPassed
                  ? "bg-sage/10 text-sage"
                  : "bg-red-50 text-red-600"
              )}>
                {session.isPassed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-semibold text-base sm:text-sm">
                  {session.isPassed ? "Passed" : "Needs Practice"}
                </span>
              </div>

              {/* Session type */}
              <div className={cn("text-base sm:text-sm font-medium", sessionTypeInfo.color)}>
                {sessionTypeInfo.label}
              </div>

              {/* Quality indicator */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full transition-colors",
                      session.quality === "EXCELLENT" && "bg-sage",
                      session.quality === "GOOD" && (i < 2 ? "bg-gold" : "bg-gold/20"),
                      session.quality === "NEEDS_IMPROVEMENT" && (i < 1 ? "bg-amber-500" : "bg-amber-500/20"),
                    )}
                  />
                ))}
                <span className="text-sm sm:text-xs text-ink/40 ml-1 capitalize">
                  {session.quality.toLowerCase().replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider with date */}
        <div className="relative px-5 sm:px-8 py-2">
          <div className="absolute inset-x-5 sm:inset-x-8 top-1/2 h-px bg-gold/20" />
          <div className="relative flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1 bg-parchment text-ink/50 text-sm">
              <Clock className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span>{formattedDate} at {formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Mistakes section - only if there are mistakes */}
        {mistakeDetails.length > 0 && (
          <div className="px-5 sm:px-8 py-4">
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base sm:text-sm font-medium text-red-700">
                  {mistakeDetails.length} {mistakeDetails.length === 1 ? 'Mistake' : 'Mistakes'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mistakeDetails.map((m) => {
                  const config = MISTAKE_TYPES[m.type];
                  const uniqueKey = m.wordIndex ? `${m.ayah}-${m.wordIndex}` : `${m.ayah}`;
                  return (
                    <span
                      key={uniqueKey}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-sm sm:text-xs font-medium",
                        config.bgColor, config.color
                      )}
                    >
                      <span style={{ fontFamily: "'Scheherazade New', serif" }}>
                        آية {toArabicNumeral(m.ayah)}
                      </span>
                      {m.wordText && (
                        <span className="opacity-70">"{m.wordText}"</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* People row - minimal */}
        {(showStudent || showTeacher) && (
          <div className="px-5 sm:px-8 py-4 sm:py-3 flex items-center justify-center gap-4 sm:gap-6 text-base sm:text-sm flex-wrap">
            {showStudent && (
              <div className="flex items-center gap-2 text-ink/60">
                <span className="text-ink/40">Student:</span>
                <span className="font-medium text-navy">{session.student.user.name}</span>
              </div>
            )}
            {showStudent && showTeacher && (
              <span className="text-ink/20 hidden sm:inline">•</span>
            )}
            {showTeacher && (
              <div className="flex items-center gap-2 text-ink/60">
                <span className="text-ink/40">Teacher:</span>
                <span className="font-medium text-navy">{session.teacher.user.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes - if present */}
        {session.notes && (
          <div className="px-5 sm:px-8 py-3">
            <div className="bg-cream/50 rounded-xl p-4 border border-gold/10">
              <p className="text-base sm:text-sm text-ink/70 italic leading-relaxed">
                "{session.notes}"
              </p>
            </div>
          </div>
        )}

        {/* Mushaf viewer toggle */}
        <div className="px-5 sm:px-8 pb-8 sm:pb-6 pt-3 sm:pt-2">
          <button
            onClick={() => setShowMushaf(!showMushaf)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 sm:py-3 rounded-xl border transition-all duration-200",
              showMushaf
                ? "bg-cream border-gold/30 text-navy"
                : "bg-transparent border-gold/20 text-ink/60 hover:border-gold/40 hover:text-navy"
            )}
          >
            <span className="text-base sm:text-sm font-medium">
              {showMushaf ? "Hide" : "View"} Quran Text
            </span>
            {showMushaf ? (
              <ChevronUp className="h-5 w-5 sm:h-4 sm:w-4" />
            ) : (
              <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4" />
            )}
          </button>

          {/* Mushaf viewer - collapsible */}
          {showMushaf && (
            <div className="mt-4 animate-fade-in">
              <MushafSessionViewer
                surahId={session.surahId}
                startAyah={session.startAyah}
                endAyah={session.endAyah}
                mistakeDetails={mistakeDetails}
                mode="view"
              />
            </div>
          )}
        </div>

        {/* Decorative bottom border */}
        <div className="h-1.5 sm:h-1 bg-gradient-to-r from-gold/30 via-gold/50 to-gold/30" />
      </DialogContent>
    </Dialog>
  );
}
