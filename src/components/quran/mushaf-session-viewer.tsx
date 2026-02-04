"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Loader2,
  MousePointer,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  loadPageFont,
  preloadPageFonts,
  getFontFamily,
  isFontLoaded,
  type FontVersion,
} from "@/lib/mushaf-fonts";

// Mistake types - matching existing QuranViewer interface
export type MistakeType = "FORGOT_AYAH" | "WORD_MISTAKE";

export interface MistakeDetail {
  ayah: number;
  wordIndex?: number;
  wordText?: string;
  type: MistakeType;
}

export const MISTAKE_TYPES: Record<
  MistakeType,
  { label: string; labelAr: string; color: string; bgColor: string; ringColor: string }
> = {
  FORGOT_AYAH: {
    label: "Forgot Ayah",
    labelAr: "نسي الآية",
    color: "text-red-700",
    bgColor: "bg-red-100",
    ringColor: "ring-red-500",
  },
  WORD_MISTAKE: {
    label: "Word Mistake",
    labelAr: "خطأ في كلمة",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    ringColor: "ring-orange-500",
  },
};

// API types
interface MushafWord {
  id: number;
  position: number;
  codeV1: string;
  codeV2: string;
  lineNumber: number;
  textUthmani: string;
  charType: "word" | "end" | "pause";
  audioUrl?: string;
  verseKey: string;
}

interface MushafLine {
  lineNumber: number;
  words: MushafWord[];
}

interface MushafPageData {
  pageNumber: number;
  lines: MushafLine[];
  verses: { verseKey: string; verseNumber: number; chapterId: number }[];
  fontUrl: string;
}

// Surah to page mapping (start pages)
const SURAH_START_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
  31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
  41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
  51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
  61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
  71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585,
  81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 592, 88: 592, 89: 593, 90: 594,
  91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
  101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602, 109: 603,
  110: 603, 111: 603, 112: 604, 113: 604, 114: 604,
};

// Get page range for a surah
const getSurahPageRange = (surahId: number): { start: number; end: number; total: number } => {
  const start = SURAH_START_PAGES[surahId] || 1;
  // Find the end page (start of next surah - 1, or 604 for last surah)
  const nextSurahStart = surahId < 114 ? SURAH_START_PAGES[surahId + 1] : 605;
  const end = nextSurahStart - 1;
  return { start, end, total: end - start + 1 };
};


interface MushafSessionViewerProps {
  surahId: number;
  startAyah?: number | null;
  endAyah?: number | null;
  mistakeDetails?: MistakeDetail[];
  onRangeChange?: (start: number, end: number) => void;
  onMistakeDetailsChange?: (mistakes: MistakeDetail[]) => void;
  mode?: "select" | "mistakes" | "view";
  fontVersion?: FontVersion;
}

// Convert number to Arabic-Indic numerals
const toArabicNumeral = (num: number): string => {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().split("").map((d) => arabicNumerals[parseInt(d)]).join("");
};

// Parse verse key to get ayah number
const getAyahFromKey = (verseKey: string): number => {
  const [, ayah] = verseKey.split(":").map(Number);
  return ayah;
};

// Get chapter from verse key
const getChapterFromKey = (verseKey: string): number => {
  const [chapter] = verseKey.split(":").map(Number);
  return chapter;
};

export function MushafSessionViewer({
  surahId,
  startAyah,
  endAyah,
  mistakeDetails = [],
  onRangeChange,
  onMistakeDetailsChange,
  mode = "select",
  fontVersion = "v1",
}: MushafSessionViewerProps) {
  const [pageData, setPageData] = useState<MushafPageData | null>(null);
  const [currentPageNumber, setCurrentPageNumber] = useState<number | null>(null); // Start as null until determined
  const [loading, setLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<"select" | "mistakes">(
    mode === "view" ? "select" : mode
  );
  const [selectionState, setSelectionState] = useState<"idle" | "selecting">("idle");
  const [tempStartAyah, setTempStartAyah] = useState<number | null>(null);
  const [pageNumberLoading, setPageNumberLoading] = useState(true); // Track if we're still determining page number
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);

  // Track which pages the selection spans (start and end pages)
  const [selectionPageRange, setSelectionPageRange] = useState<{ startPage: number | null; endPage: number | null }>({
    startPage: null,
    endPage: null,
  });

  const hasSelection = startAyah != null && endAyah != null && startAyah > 0 && endAyah > 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobileView(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobileView && isMobileFullscreen) {
      setIsMobileFullscreen(false);
    }
  }, [isMobileView, isMobileFullscreen]);

  useEffect(() => {
    if (mode === "view" || currentMode !== "select") return;

    if (!hasSelection) {
      setSelectionState("idle");
      setTempStartAyah(null);
      setSelectionPageRange({ startPage: null, endPage: null });
      return;
    }

    if (startAyah === endAyah) {
      setSelectionState("selecting");
      setTempStartAyah(startAyah ?? null);
      if (currentPageNumber !== null) {
        setSelectionPageRange((prev) => {
          if (prev.startPage === null && prev.endPage === null) {
            return { startPage: currentPageNumber, endPage: currentPageNumber };
          }
          return prev;
        });
      }
      return;
    }

    setSelectionState("idle");
    setTempStartAyah(null);
  }, [currentMode, mode, hasSelection, startAyah, endAyah, currentPageNumber]);

  // Track previous surah to detect surah changes
  const prevSurahIdRef = useRef<number | null>(null);
  // Track the initial startAyah when surah changes (for one-time navigation)
  const initialStartAyahRef = useRef<number | null>(null);
  const hasNavigatedRef = useRef(false);

  // Determine the correct page number FIRST, before loading any page data
  useEffect(() => {
    const surahChanged = prevSurahIdRef.current !== surahId;

    if (surahChanged) {
      prevSurahIdRef.current = surahId;
      initialStartAyahRef.current = startAyah ?? null;
      hasNavigatedRef.current = false;
      setSelectionPageRange({ startPage: null, endPage: null });
      setPageNumberLoading(true); // Reset loading state
      setCurrentPageNumber(null); // Reset page number
    }

    // Only navigate once per surah change, using the initial startAyah
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      const ayahToNavigate = initialStartAyahRef.current;

      if (ayahToNavigate && ayahToNavigate > 1) {
        // Fetch the exact page number for this ayah from quran.com API
        setPageNumberLoading(true);
        const verseKey = `${surahId}:${ayahToNavigate}`;
        fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?fields=page_number`)
          .then(res => res.json())
          .then(data => {
            if (data.verse?.page_number) {
              setCurrentPageNumber(data.verse.page_number);
            } else {
              setCurrentPageNumber(SURAH_START_PAGES[surahId] || 1);
            }
          })
          .catch(() => {
            setCurrentPageNumber(SURAH_START_PAGES[surahId] || 1);
          })
          .finally(() => {
            setPageNumberLoading(false);
          });
      } else {
        // No startAyah or ayah 1, go to surah's first page
        setCurrentPageNumber(SURAH_START_PAGES[surahId] || 1);
        setPageNumberLoading(false);
      }
    }
  }, [surahId, startAyah]);

  // Load font for a specific page
  const loadFontForPage = useCallback(async (pageNum: number) => {
    try {
      await loadPageFont(pageNum, fontVersion);
      return true;
    } catch {
      return false;
    }
  }, [fontVersion]);

  // Fetch page data - only when page number is determined
  useEffect(() => {
    // Don't load until we know which page to load
    if (currentPageNumber === null || pageNumberLoading) {
      return;
    }

    setLoading(true);
    setError(null);
    setFontLoaded(false);

    // Load both font and page data in parallel, but wait for both
    const fontPromise = loadFontForPage(currentPageNumber);
    const dataPromise = fetch(`/api/quran/pages/${currentPageNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        return data;
      });

    Promise.all([fontPromise, dataPromise])
      .then(([fontSuccess, data]) => {
        setPageData(data);
        setFontLoaded(true); // Font loaded (or fallback)
        setLoading(false);

        // Preload adjacent pages in background
        const adjacent = [currentPageNumber - 1, currentPageNumber + 1].filter(
          (p) => p >= 1 && p <= 604
        );
        preloadPageFonts(adjacent, fontVersion);
      })
      .catch((err) => {
        setError(err.message || "Failed to load page");
        setLoading(false);
      });
  }, [currentPageNumber, pageNumberLoading, fontVersion, loadFontForPage]);

  // Check if ayah is in selection range
  const isInRange = (ayahNum: number, chapterId: number): boolean => {
    if (!hasSelection || chapterId !== surahId) return false;
    return ayahNum >= startAyah! && ayahNum <= endAyah!;
  };

  // Check if a page is within the selection page range
  const pageIsInSelectionRange = (pageNum: number): boolean => {
    const { startPage, endPage } = selectionPageRange;
    if (!hasSelection || startPage === null || endPage === null) return false;

    const minPage = Math.min(startPage, endPage);
    const maxPage = Math.max(startPage, endPage);

    return pageNum >= minPage && pageNum <= maxPage;
  };

  // Get the number of pages in the selection
  const getSelectionPageCount = (): number => {
    const { startPage, endPage } = selectionPageRange;
    if (startPage === null || endPage === null) return 0;
    return Math.abs(endPage - startPage) + 1;
  };

  // Handle word click
  const handleWordClick = (word: MushafWord) => {
    if (mode === "view") return;

    const chapterId = getChapterFromKey(word.verseKey);
    const ayahNum = getAyahFromKey(word.verseKey);

    // Only allow interaction with current surah
    if (chapterId !== surahId) return;

    if (currentMode === "select") {
      const hasPresetStart =
        selectionState === "idle" &&
        hasSelection &&
        startAyah != null &&
        endAyah != null &&
        startAyah === endAyah;

      if (selectionState === "idle" && !hasPresetStart) {
        setTempStartAyah(ayahNum);
        setSelectionState("selecting");
        setSelectionPageRange({ startPage: currentPageNumber, endPage: currentPageNumber });
        onRangeChange?.(ayahNum, ayahNum);
      } else {
        const baseStart = hasPresetStart ? startAyah! : tempStartAyah!;
        const start = Math.min(baseStart, ayahNum);
        const end = Math.max(baseStart, ayahNum);
        setSelectionPageRange((prev) => ({
          startPage: prev.startPage ?? currentPageNumber,
          endPage: currentPageNumber,
        }));
        onRangeChange?.(start, end);
        setSelectionState("idle");
        setTempStartAyah(null);
      }
    } else if (currentMode === "mistakes") {
      if (!hasSelection || !isInRange(ayahNum, chapterId)) return;

      // Check if entire ayah is marked
      const ayahForgot = mistakeDetails.find(
        (m) => m.ayah === ayahNum && !m.wordIndex && m.type === "FORGOT_AYAH"
      );
      if (ayahForgot) return;

      // Toggle word mistake
      const existing = mistakeDetails.find(
        (m) => m.ayah === ayahNum && m.wordIndex === word.position
      );

      let newMistakes: MistakeDetail[];
      if (existing) {
        newMistakes = mistakeDetails.filter(
          (m) => !(m.ayah === ayahNum && m.wordIndex === word.position)
        );
      } else {
        newMistakes = [
          ...mistakeDetails,
          {
            ayah: ayahNum,
            wordIndex: word.position,
            wordText: word.textUthmani,
            type: "WORD_MISTAKE" as MistakeType,
          },
        ].sort((a, b) => a.ayah - b.ayah || (a.wordIndex || 0) - (b.wordIndex || 0));
      }
      onMistakeDetailsChange?.(newMistakes);
    }
  };

  // Handle ayah marker click (for forgot ayah)
  const handleAyahMarkerClick = (word: MushafWord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "view") return;

    const chapterId = getChapterFromKey(word.verseKey);
    const ayahNum = getAyahFromKey(word.verseKey);

    if (chapterId !== surahId) return;

    if (currentMode === "select") {
      const hasPresetStart =
        selectionState === "idle" &&
        hasSelection &&
        startAyah != null &&
        endAyah != null &&
        startAyah === endAyah;

      if (selectionState === "idle" && !hasPresetStart) {
        setTempStartAyah(ayahNum);
        setSelectionState("selecting");
        setSelectionPageRange({ startPage: currentPageNumber, endPage: currentPageNumber });
        onRangeChange?.(ayahNum, ayahNum);
      } else {
        const baseStart = hasPresetStart ? startAyah! : tempStartAyah!;
        const start = Math.min(baseStart, ayahNum);
        const end = Math.max(baseStart, ayahNum);
        setSelectionPageRange((prev) => ({
          startPage: prev.startPage ?? currentPageNumber,
          endPage: currentPageNumber,
        }));
        onRangeChange?.(start, end);
        setSelectionState("idle");
        setTempStartAyah(null);
      }
      return;
    }

    // Mistakes mode
    if (!hasSelection || !isInRange(ayahNum, chapterId)) return;

    const existing = mistakeDetails.find(
      (m) => m.ayah === ayahNum && !m.wordIndex && m.type === "FORGOT_AYAH"
    );

    let newMistakes: MistakeDetail[];
    if (existing) {
      newMistakes = mistakeDetails.filter(
        (m) => !(m.ayah === ayahNum && !m.wordIndex && m.type === "FORGOT_AYAH")
      );
    } else {
      newMistakes = [
        ...mistakeDetails.filter((m) => m.ayah !== ayahNum),
        { ayah: ayahNum, type: "FORGOT_AYAH" as MistakeType },
      ].sort((a, b) => a.ayah - b.ayah);
    }
    onMistakeDetailsChange?.(newMistakes);
  };

  // Get mistake state for a word
  const getWordMistake = (word: MushafWord): MistakeType | null => {
    const ayahNum = getAyahFromKey(word.verseKey);

    const wordMistake = mistakeDetails.find(
      (m) => m.ayah === ayahNum && m.wordIndex === word.position
    );
    if (wordMistake) return wordMistake.type;

    const ayahMistake = mistakeDetails.find(
      (m) => m.ayah === ayahNum && !m.wordIndex
    );
    if (ayahMistake) return ayahMistake.type;

    return null;
  };

  // Check if ayah has forgot mistake
  const isAyahForgot = (ayahNum: number): boolean => {
    return mistakeDetails.some((m) => m.ayah === ayahNum && !m.wordIndex && m.type === "FORGOT_AYAH");
  };

  const fontFamily = currentPageNumber ? getFontFamily(currentPageNumber, fontVersion) : "";

  // Navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= 604) setCurrentPageNumber(page);
  };

  // Show loading if: determining page number, loading page data, or loading font
  if (pageNumberLoading || loading || !fontLoaded || currentPageNumber === null) {
    return (
      <div className="flex items-center justify-center bg-[#fffef5] rounded-lg border min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
        <div className="text-center space-y-2 sm:space-y-3">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-stone-400 mx-auto" />
          <p className="text-stone-500 text-xs sm:text-sm">
            {!fontLoaded ? "Loading Mushaf font..." : "Loading page..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex items-center justify-center bg-red-50 rounded-lg border min-h-[300px] sm:min-h-[400px] md:min-h-[500px] text-red-600 text-sm">
        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
        {error || "Failed to load page"}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 sm:space-y-3",
        isMobileView &&
          isMobileFullscreen &&
          "fixed inset-0 z-50 bg-[#f9f7f2] p-2 sm:p-3 overflow-y-auto"
      )}
    >
      {/* Mode Toggle */}
      {mode !== "view" && (
        <div className="space-y-2">
          <div className="p-2 sm:p-3 bg-stone-50 rounded-lg border space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={currentMode === "select" ? "default" : "outline"}
                onClick={() => setCurrentMode("select")}
                className="text-xs sm:text-sm"
              >
                <MousePointer className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Select Range
              </Button>
              <Button
                type="button"
                size="sm"
                variant={currentMode === "mistakes" ? "default" : "outline"}
                onClick={() => setCurrentMode("mistakes")}
                disabled={!hasSelection}
                className={cn(
                  "text-xs sm:text-sm",
                  currentMode === "mistakes" && "bg-red-600 hover:bg-red-700",
                  !hasSelection && "opacity-50"
                )}
              >
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Mark Mistakes
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500">
              {currentMode === "select"
                ? selectionState === "selecting"
                  ? `Started at verse ${tempStartAyah} - tap end verse`
                  : "Tap a word to start selecting"
                : `Tap words to mark mistakes (${mistakeDetails.length} marked)`}
            </p>
          </div>

          {currentMode === "mistakes" && hasSelection && (
            <div className="p-2 sm:p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs sm:text-sm">
              <p className="font-medium text-amber-800 mb-1">How to mark mistakes:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-xs text-amber-700">
                <li><span className="text-red-600 font-medium">Click ayah number ۝</span> → Forgot entire ayah</li>
                <li><span className="text-orange-600 font-medium">Click a word</span> → Word mistake</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Selection Info */}
      {hasSelection && (
        <div className="bg-sky-50/70 p-2 sm:p-3 rounded-lg border border-sky-200">
          <div className="flex items-center justify-between text-xs sm:text-sm text-sky-700 flex-wrap gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Selected: Verses {startAyah} - {endAyah} ({endAyah! - startAyah! + 1} verses)
              </span>
              {getSelectionPageCount() > 1 && (
                <span className="text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium">
                  {getSelectionPageCount()} pages
                </span>
              )}
            </div>
            {mistakeDetails.length > 0 && (
              <span className="text-red-600 font-medium">
                {mistakeDetails.length} mistake{mistakeDetails.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mistakes Summary */}
      {mistakeDetails.length > 0 && (
        <div className="flex flex-wrap gap-1 sm:gap-2 p-2 bg-stone-50 rounded-lg border">
          {mistakeDetails.map((m, idx) => {
            const config = MISTAKE_TYPES[m.type];
            return (
              <span
                key={`${m.ayah}-${m.wordIndex || "ayah"}-${idx}`}
                className={cn("px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium", config.bgColor, config.color)}
              >
                {m.wordText ? (
                  <span>Ayah {m.ayah}: "{m.wordText}"</span>
                ) : (
                  <span>Ayah {m.ayah}: {config.labelAr}</span>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Mushaf Page */}
      <div
        className={cn(
          "relative",
          isMobileView && !isMobileFullscreen && "rounded-xl bg-stone-100/70 p-2"
        )}
      >
        {isMobileView && !isMobileFullscreen && (
          <div className="absolute -top-3 right-2 z-10">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsMobileFullscreen(true)}
              className="text-[11px] shadow-sm h-7 px-3"
            >
              Fullscreen
            </Button>
          </div>
        )}

        <div
          className={cn(
            "mushaf-page bg-[#fffef5] border border-stone-300 rounded-lg shadow-xl overflow-x-auto",
            isMobileView && isMobileFullscreen && "rounded-none border-0 shadow-none"
          )}
          style={{ containerType: "inline-size" }}
          dir="rtl"
          translate="no"
          onClick={(event) => event.stopPropagation()}
        >
          {isMobileView && isMobileFullscreen && (
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-stone-200 flex items-center justify-between px-3 py-2">
              <span className="text-xs font-medium text-stone-500">Fullscreen mode</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsMobileFullscreen(false)}
                className="text-xs"
              >
                Exit full screen
              </Button>
            </div>
          )}

          <div className="h-1 sm:h-2 bg-gradient-to-r from-stone-300 via-amber-200 to-stone-300" />

          <div className="px-1 py-3 sm:px-4 sm:py-6 md:px-6 md:py-8">
            <div className="mushaf-lines space-y-0">
              {pageData.lines.map((line) => (
                <div
                  key={line.lineNumber}
                  className="mushaf-line flex justify-center items-baseline flex-wrap"
                  style={{
                    fontFamily: `"${fontFamily}", "KFGQPC Uthmanic Script HAFS", serif`,
                    fontSize: isMobileView && isMobileFullscreen
                      ? "clamp(1.35rem, 6.2cqi, 3rem)"
                      : "clamp(1.15rem, 4.5cqi, 2.5rem)",
                    lineHeight: "2.1",
                  }}
                >
                  {line.words.map((word, idx) => {
                    const chapterId = getChapterFromKey(word.verseKey);
                    const ayahNum = getAyahFromKey(word.verseKey);
                    const inRange = isInRange(ayahNum, chapterId);
                    const mistakeType = getWordMistake(word);
                    const isEndMarker = word.charType === "end";
                    const glyphCode = fontVersion === "v1" ? word.codeV1 : word.codeV2;
                    const ayahForgot = isAyahForgot(ayahNum);
                    const isCurrentSurah = chapterId === surahId;

                    // Ayah end marker
                    if (isEndMarker) {
                      return (
                        <span
                          key={`${word.verseKey}-end-${idx}`}
                          onClick={(e) => handleAyahMarkerClick(word, e)}
                          className={cn(
                            "cursor-pointer transition-all px-0.5",
                            "hover:scale-110",
                            inRange && "text-blue-600",
                            ayahForgot && "text-red-600 scale-110",
                            currentMode === "mistakes" && inRange && "hover:text-red-500",
                            !isCurrentSurah && "opacity-40"
                          )}
                          title={`Ayah ${ayahNum} - Click to mark as forgot`}
                        >
                          {glyphCode || word.textUthmani}
                        </span>
                      );
                    }

                    return (
                      <span
                        key={`${word.verseKey}-${word.position}-${idx}`}
                        onClick={() => handleWordClick(word)}
                        className={cn(
                          "cursor-pointer transition-all duration-150",
                          // Dim words from other surahs
                          !isCurrentSurah && "opacity-40",
                          // Selection highlighting - lighter color with padding to eliminate gaps
                          inRange && !mistakeType && "bg-sky-100/30 py-1 -my-1",
                          // Selection in progress
                          selectionState === "selecting" &&
                            ayahNum === tempStartAyah &&
                            isCurrentSurah &&
                            "bg-sky-200/50 rounded py-1 -my-1",
                          // Mistake highlighting
                          mistakeType === "WORD_MISTAKE" && "bg-orange-200/70 rounded px-0.5",
                          mistakeType === "FORGOT_AYAH" && "bg-red-200/60",
                          // Hover states
                          isCurrentSurah && mode !== "view" && currentMode === "select" && "hover:bg-sky-100/40",
                          isCurrentSurah &&
                            mode !== "view" &&
                            currentMode === "mistakes" &&
                            inRange &&
                            !ayahForgot &&
                            "hover:bg-orange-100/60"
                        )}
                        title={word.textUthmani}
                      >
                        {glyphCode || word.textUthmani}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Page number (Arabic) */}
          <div className="py-2 sm:py-3 border-t border-stone-200 bg-stone-50/50 text-center">
            <span className="text-base sm:text-lg text-stone-500">{toArabicNumeral(currentPageNumber)}</span>
          </div>

          <div className="h-1 sm:h-2 bg-gradient-to-r from-stone-300 via-amber-200 to-stone-300" />
        </div>
      </div>

      {/* Page Navigation - Now at bottom */}
      {(() => {
        const surahPages = getSurahPageRange(surahId);
        const currentSurahPage = currentPageNumber - surahPages.start + 1;
        const isFirstSurahPage = currentPageNumber <= surahPages.start;
        const isLastSurahPage = currentPageNumber >= surahPages.end;

        return (
          <div className="bg-stone-100 p-2 sm:p-3 rounded-lg space-y-2">
            {/* Main navigation */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToPage(currentPageNumber - 1)}
                disabled={isFirstSurahPage}
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline ml-1">السابق</span>
              </Button>

              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-stone-500" />
                  <span className="text-xs sm:text-sm font-medium text-stone-700">
                    Page {currentSurahPage} of {surahPages.total}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-stone-400">
                  (Mushaf page {currentPageNumber})
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToPage(currentPageNumber + 1)}
                disabled={isLastSurahPage}
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <span className="hidden sm:inline mr-1">التالي</span>
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Page number buttons */}
            {surahPages.total > 1 && (
              <div className="flex justify-center gap-1 flex-wrap">
                {Array.from({ length: surahPages.total }, (_, i) => {
                  const pageNum = surahPages.start + i;
                  const isActive = pageNum === currentPageNumber;
                  const isInSelectionRange = pageIsInSelectionRange(pageNum);

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      className={cn(
                        "min-w-[28px] h-7 px-1.5 sm:min-w-[32px] sm:h-8 sm:px-2 rounded text-xs sm:text-sm font-medium transition-all duration-200",
                        isActive
                          ? isInSelectionRange
                            ? "bg-sky-600 text-white shadow-md ring-2 ring-sky-300"
                            : "bg-stone-700 text-white shadow-md"
                          : isInSelectionRange
                            ? "bg-sky-100 border-2 border-sky-400 text-sky-700 hover:bg-sky-200 shadow-sm"
                            : "bg-white border border-stone-300 text-stone-600 hover:bg-stone-200"
                      )}
                      title={isInSelectionRange ? `Page ${i + 1} - In selection range` : `Go to page ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Legend - Compact on mobile */}
      {mode !== "view" && (
        <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-stone-500 justify-center">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-sky-100" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-sky-100 border-2 border-sky-400" />
            <span>Page w/ selection</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-200/60" />
            <span>Forgot</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-200/70" />
            <span>Mistake</span>
          </div>
        </div>
      )}
    </div>
  );
}
