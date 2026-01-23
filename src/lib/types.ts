// User roles
export type UserRole = "SUPER_ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

// Assignment status
export type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

// Session types
export type SessionType = "NEW_MEMORIZATION" | "REVISION" | "RE_TEST";

// Progress status
export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "MEMORIZED" | "NEEDS_REVIEW";

// Quality rating
export type QualityRating = "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT";

// Milestone types
export type MilestoneType = "SURAH_COMPLETE" | "JUZ_COMPLETE" | "STREAK_3" | "STREAK_7" | "STREAK_30" | "FIRST_SESSION";

export interface SurahInfo {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  nameTranslit: string;
  totalAyahs: number;
  revelationType: string;
}

export interface StudentProgressInfo {
  surahId: number;
  surahName: string;
  surahNameArabic: string;
  totalVerses: number;
  memorizedVerses: number;
  percentComplete: number;
  status: ProgressStatus;
  avgGrade: number;
  sessionCount: number;
  lastReviewDate: Date | null;
}

export interface SessionInfo {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  surahId: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  mistakeCount: number;
  grade: number;
  sessionType: SessionType;
  sessionDate: Date;
  notes: string | null;
  flagged: boolean;
}

export interface AssignmentInfo {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  surahId: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  status: AssignmentStatus;
  dueDate: Date | null;
  instructions: string | null;
  createdAt: Date;
}

export interface OverallStats {
  totalVersesMemoized: number;
  totalVersesInQuran: number;
  surahsCompleted: number;
  totalSurahs: number;
  averageGrade: number;
  totalSessions: number;
  percentComplete: number;
}

// Quran API Types
export interface QuranChapter {
  id: number;
  revelationPlace: string;
  revelationOrder: number;
  bismillahPre: boolean;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  pages: number[];
  translatedName: {
    languageName: string;
    name: string;
  };
}

export interface QuranWord {
  id: number;
  position: number;
  audioUrl?: string;
  charTypeName: string;
  textUthmani: string;
  textImlaei?: string;
  pageNumber: number;
  lineNumber: number;
  translation?: {
    text: string;
    languageName: string;
  };
  transliteration?: {
    text: string;
    languageName: string;
  };
}

export interface QuranTranslation {
  resourceId: number;
  text: string;
}

export interface QuranVerse {
  id: number;
  verseNumber: number;
  verseKey: string;
  hizbNumber: number;
  rubElHizbNumber: number;
  rukuNumber: number;
  manzilNumber: number;
  sajdahNumber?: number;
  pageNumber: number;
  juzNumber: number;
  textUthmani: string;
  textImlaei?: string;
  words?: QuranWord[];
  translations?: QuranTranslation[];
}

export interface QuranAudioSegment {
  verseKey: string;
  timestampFrom: number;
  timestampTo: number;
  duration: number;
  segments: number[][]; // Word-level timing [wordIndex, startMs, endMs]
}

export interface QuranRecitation {
  audioUrl: string;
  reciterId: number;
  chapterNumber: number;
  audioSegments?: QuranAudioSegment[];
}

export interface QuranSearchResult {
  verseKey: string;
  text: string;
  highlightedText: string;
  translations: QuranTranslation[];
}
