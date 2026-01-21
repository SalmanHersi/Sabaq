"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { MushafSessionViewer, type MistakeDetail, type MistakeType, MISTAKE_TYPES } from "@/components/quran/mushaf-session-viewer";
import { Calendar, User, GraduationCap, AlertCircle, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

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
      return "New Memorization";
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
      return "bg-green-100 text-green-800";
    case "REVISION":
      return "bg-blue-100 text-blue-800";
    case "RE_TEST":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-cream text-ink";
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

// Helper to normalize mistake data (handle both old and new formats)
function normalizeMistakeDetails(mistakeAyahs: number[] | MistakeDetail[]): MistakeDetail[] {
  if (!mistakeAyahs || mistakeAyahs.length === 0) return [];

  // Check if it's the new format (array of objects with at least ayah and type)
  if (typeof mistakeAyahs[0] === "object" && "ayah" in mistakeAyahs[0]) {
    // Already in new format - may or may not have wordIndex/wordText
    return mistakeAyahs as MistakeDetail[];
  }

  // Legacy format: convert numbers to MistakeDetail with default type (entire ayah)
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
  if (!session) return null;

  const sessionDate = new Date(session.sessionDate);
  const formattedDate = sessionDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = sessionDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const versesCount = session.endAyah - session.startAyah + 1;
  const mistakeDetails = normalizeMistakeDetails(session.mistakeAyahs || []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Session Details
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Session Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Surah Info */}
            <div className="bg-stone-50 rounded-lg p-4 border">
              <div className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: "Scheherazade New, serif" }}>
                {session.surah.nameArabic}
              </div>
              <div className="text-stone-600">{session.surah.nameEnglish}</div>
              <div className="mt-2 text-sm text-stone-500">
                آية {toArabicNumeral(session.startAyah)} - {toArabicNumeral(session.endAyah)} ({session.startAyah}-{session.endAyah})
                <span className="block mt-1 text-blue-600 font-medium">
                  {toArabicNumeral(versesCount)} verses
                </span>
              </div>
            </div>

            {/* Pass/Fail & Type */}
            <div className="bg-stone-50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSessionTypeColor(session.sessionType)}`}>
                  {formatSessionType(session.sessionType)}
                </span>
                <div className={`px-4 py-1 rounded-full text-lg font-bold ${session.isPassed ? "bg-sage/10 text-sage" : "bg-red-100 text-red-600"}`}>
                  {session.isPassed ? "Passed" : "Needs Practice"}
                </div>
              </div>
              <div className="text-xs text-stone-500 mb-2">
                Quality: {session.quality.replace("_", " ")}
              </div>
              <div className="text-sm text-stone-600">
                {mistakeDetails.length > 0 ? (
                  <div className="space-y-2">
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {mistakeDetails.length} mistake{mistakeDetails.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {mistakeDetails.map((m) => {
                        const config = MISTAKE_TYPES[m.type];
                        const uniqueKey = m.wordIndex
                          ? `${m.ayah}-${m.wordIndex}`
                          : `${m.ayah}`;
                        return (
                          <span
                            key={uniqueKey}
                            className={cn("px-2 py-0.5 rounded text-xs font-medium", config.bgColor, config.color)}
                          >
                            {m.wordIndex && m.wordText ? (
                              // Word-level mistake
                              <span>آية {toArabicNumeral(m.ayah)} "{m.wordText}": {config.label}</span>
                            ) : (
                              // Ayah-level mistake
                              <span>آية {toArabicNumeral(m.ayah)}: {config.label}</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="text-green-600">No mistakes</span>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3 text-stone-600">
              <Calendar className="h-5 w-5 text-stone-400" />
              <div>
                <div className="font-medium">{formattedDate}</div>
                <div className="text-sm text-stone-500">{formattedTime}</div>
              </div>
            </div>

            {/* People */}
            <div className="flex gap-6">
              {showStudent && (
                <div className="flex items-center gap-2 text-stone-600">
                  <GraduationCap className="h-5 w-5 text-stone-400" />
                  <div>
                    <div className="text-xs text-stone-500">Student</div>
                    <div className="font-medium">{session.student.user.name}</div>
                  </div>
                </div>
              )}
              {showTeacher && (
                <div className="flex items-center gap-2 text-stone-600">
                  <User className="h-5 w-5 text-stone-400" />
                  <div>
                    <div className="text-xs text-stone-500">Teacher</div>
                    <div className="font-medium">{session.teacher.user.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mushaf Viewer */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recited Portion
            </h3>
            <MushafSessionViewer
              surahId={session.surahId}
              startAyah={session.startAyah}
              endAyah={session.endAyah}
              mistakeDetails={mistakeDetails}
              mode="view"
            />
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Teacher Notes
              </h3>
              <div className="bg-stone-50 rounded-lg p-4 border text-stone-700 whitespace-pre-wrap">
                {session.notes}
              </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
