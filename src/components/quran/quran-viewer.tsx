"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, MousePointer, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mistake types - simplified to 2 types only
export type MistakeType = "FORGOT_AYAH" | "WORD_MISTAKE";

export interface MistakeDetail {
  ayah: number;
  wordIndex?: number;    // Position of word in ayah (1-based), undefined = entire ayah
  wordText?: string;     // The Arabic word text for display
  type: MistakeType;
}

// Mistake type labels and colors
export const MISTAKE_TYPES: Record<MistakeType, { label: string; labelAr: string; color: string; bgColor: string; borderColor: string }> = {
  FORGOT_AYAH: {
    label: "Forgot Ayah",
    labelAr: "نسي الآية",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-500",
  },
  WORD_MISTAKE: {
    label: "Word Mistake",
    labelAr: "خطأ في كلمة",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-500",
  },
};

interface Word {
  position: number;
  text: string;
}

interface Verse {
  number: number;
  text: string;
  words: Word[];
  pageNumber: number;
}

interface PageData {
  pageNumber: number;
  verses: Verse[];
}

interface SurahData {
  surahId: number;
  nameArabic: string;
  nameEnglish: string;
  bismillahPre: boolean;
  versesCount: number;
  startPage: number;
  endPage: number;
  pages: PageData[];
}

interface QuranViewerProps {
  surahId: number;
  startAyah?: number | null;
  endAyah?: number | null;
  mistakeAyahs?: number[]; // Legacy support
  mistakeDetails?: MistakeDetail[]; // New typed mistakes
  onRangeChange?: (start: number, end: number) => void;
  onMistakesChange?: (mistakes: number[]) => void; // Legacy
  onMistakeDetailsChange?: (mistakes: MistakeDetail[]) => void; // New
  mode?: "select" | "mistakes" | "view";
}

type SelectionState = "start" | "end" | "complete";

// Bismillah text
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

// Convert number to Arabic-Indic numerals
const toArabicNumeral = (num: number): string => {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((d) => arabicNumerals[parseInt(d)])
    .join("");
};

// Decorative Ayah end marker - Quran.com style circular ornament
// Click on ayah number to mark entire ayah as "Forgot Ayah"
const AyahMarker = ({
  number,
  isSelected,
  mistakeType,
  onClick,
  clickable = false
}: {
  number: number;
  isSelected: boolean;
  mistakeType?: MistakeType;
  onClick?: (e: React.MouseEvent) => void;
  clickable?: boolean;
}) => {
  const getMistakeColors = () => {
    if (!mistakeType) return { border: "", inner: "", text: "" };
    const config = MISTAKE_TYPES[mistakeType];
    return {
      border: config.borderColor.replace("border-", "!border-"),
      inner: config.borderColor.replace("border-", "!border-").replace("500", "400"),
      text: config.color.replace("text-", "!text-"),
    };
  };

  const mistakeColors = getMistakeColors();
  const isForgotAyah = mistakeType === "FORGOT_AYAH";

  return (
    <span
      className={cn(
        "ayah-marker select-none",
        clickable && "cursor-pointer hover:scale-110 transition-transform"
      )}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      title={clickable ? "Click to mark as Forgot Ayah" : undefined}
    >
      {/* Outer decorative circle */}
      <span
        className={cn(
          "ayah-marker-circle",
          isSelected && !mistakeType && "!border-blue-500",
          mistakeType && mistakeColors.border,
          clickable && "hover:!border-red-400"
        )}
      />
      {/* Inner decorative circle */}
      <span
        className={cn(
          "ayah-marker-inner",
          isSelected && !mistakeType && "!border-blue-400",
          mistakeType && mistakeColors.inner
        )}
      />
      {/* Number */}
      <span
        className={cn(
          "ayah-marker-number",
          isSelected && !mistakeType && "!text-blue-600",
          mistakeType && mistakeColors.text
        )}
      >
        {toArabicNumeral(number)}
      </span>
    </span>
  );
};

export function QuranViewer({
  surahId,
  startAyah,
  endAyah,
  mistakeAyahs = [],
  mistakeDetails = [],
  onRangeChange,
  onMistakesChange,
  onMistakeDetailsChange,
  mode = "select",
}: QuranViewerProps) {
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectionState, setSelectionState] = useState<SelectionState>("complete");
  const [tempStart, setTempStart] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<"select" | "mistakes">(mode === "view" ? "select" : mode);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Use new mistakeDetails if provided, otherwise fall back to legacy mistakeAyahs
  const useNewMistakeSystem = onMistakeDetailsChange !== undefined;
  const effectiveMistakeDetails: MistakeDetail[] = mistakeDetails.length > 0
    ? mistakeDetails
    : mistakeAyahs.map(ayah => ({ ayah, type: "WORD_MISTAKE" as MistakeType }));

  // Check if user has made a selection
  const hasSelection = startAyah != null && endAyah != null && startAyah > 0 && endAyah > 0;

  useEffect(() => {
    if (!surahId) return;

    setLoading(true);
    setError("");
    setCurrentPageIndex(0);
    setSelectionState("complete");
    setTempStart(null);

    fetch(`/api/quran/ayahs/${surahId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setSurahData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load Quran text");
        setLoading(false);
      });
  }, [surahId]);

  // Handle ayah click for verse range selection (not used for mistakes anymore)
  const handleAyahClick = (ayahNumber: number) => {
    if (mode === "view") return;

    // In mistakes mode, ayah body click does nothing (use ayah marker for forgot, words for word mistakes)
    if (currentMode === "mistakes") return;

    // Selection mode
    if (selectionState === "complete" || selectionState === "end") {
      setTempStart(ayahNumber);
      setSelectionState("start");
      onRangeChange?.(ayahNumber, ayahNumber);
    } else if (selectionState === "start") {
      const start = Math.min(tempStart!, ayahNumber);
      const end = Math.max(tempStart!, ayahNumber);
      onRangeChange?.(start, end);
      setSelectionState("complete");
      setTempStart(null);
    }
  };

  // Handle ayah marker (number) click - marks entire ayah as "Forgot Ayah"
  const handleAyahMarkerClick = (ayahNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "view") return;
    if (currentMode !== "mistakes") {
      // In select mode, treat as regular ayah click
      handleAyahClick(ayahNumber);
      return;
    }

    // Must have a selection before marking mistakes
    if (!hasSelection || !startAyah || !endAyah) return;
    if (ayahNumber < startAyah || ayahNumber > endAyah) return;

    // Toggle "Forgot Ayah" mistake for entire ayah
    const existingAyahMistake = effectiveMistakeDetails.find(
      m => m.ayah === ayahNumber && m.wordIndex === undefined && m.type === "FORGOT_AYAH"
    );
    let newMistakes: MistakeDetail[];

    if (existingAyahMistake) {
      // Remove the forgot ayah mistake
      newMistakes = effectiveMistakeDetails.filter(
        m => !(m.ayah === ayahNumber && m.wordIndex === undefined && m.type === "FORGOT_AYAH")
      );
    } else {
      // Add forgot ayah mistake (also remove any word-level mistakes for this ayah)
      newMistakes = [
        ...effectiveMistakeDetails.filter(m => m.ayah !== ayahNumber),
        { ayah: ayahNumber, type: "FORGOT_AYAH" as MistakeType }
      ].sort((a, b) => a.ayah - b.ayah);
    }
    onMistakeDetailsChange?.(newMistakes);
  };

  // Handle word click - marks specific word as "Word Mistake"
  const handleWordClick = (ayahNumber: number, wordPosition: number, wordText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "view") return;

    // In select mode, trigger ayah selection
    if (currentMode !== "mistakes") {
      handleAyahClick(ayahNumber);
      return;
    }

    // Must have a selection before marking mistakes
    if (!hasSelection || !startAyah || !endAyah) return;
    if (ayahNumber < startAyah || ayahNumber > endAyah) return;

    // Check if entire ayah is marked as forgot - if so, don't allow word-level marking
    const entireAyahForgot = effectiveMistakeDetails.find(
      m => m.ayah === ayahNumber && m.wordIndex === undefined && m.type === "FORGOT_AYAH"
    );
    if (entireAyahForgot) return; // Can't mark individual words if entire ayah is forgotten

    // Toggle word-level "Word Mistake"
    const existingMistake = effectiveMistakeDetails.find(
      m => m.ayah === ayahNumber && m.wordIndex === wordPosition
    );
    let newMistakes: MistakeDetail[];

    if (existingMistake) {
      // Remove the word mistake
      newMistakes = effectiveMistakeDetails.filter(
        m => !(m.ayah === ayahNumber && m.wordIndex === wordPosition)
      );
    } else {
      // Add word mistake
      newMistakes = [
        ...effectiveMistakeDetails,
        { ayah: ayahNumber, wordIndex: wordPosition, wordText, type: "WORD_MISTAKE" as MistakeType }
      ].sort((a, b) => {
        if (a.ayah !== b.ayah) return a.ayah - b.ayah;
        return (a.wordIndex || 0) - (b.wordIndex || 0);
      });
    }

    if (onMistakeDetailsChange) {
      onMistakeDetailsChange(newMistakes);
    } else if (onMistakesChange) {
      onMistakesChange(newMistakes.map(m => m.ayah));
    }
  };

  const isInRange = (ayahNumber: number) => {
    if (!hasSelection || !startAyah || !endAyah) return false;
    return ayahNumber >= startAyah && ayahNumber <= endAyah;
  };

  const getMistakeType = (ayahNumber: number): MistakeType | undefined => {
    const mistake = effectiveMistakeDetails.find(m => m.ayah === ayahNumber);
    return mistake?.type;
  };

  const isMistake = (ayahNumber: number) => {
    return effectiveMistakeDetails.some(m => m.ayah === ayahNumber);
  };

  // Check if a specific word has a mistake
  const getWordMistakeType = (ayahNumber: number, wordPosition: number): MistakeType | undefined => {
    const mistake = effectiveMistakeDetails.find(
      m => m.ayah === ayahNumber && m.wordIndex === wordPosition
    );
    return mistake?.type;
  };

  // Check if the entire ayah is marked (no wordIndex)
  const isEntireAyahMistake = (ayahNumber: number): boolean => {
    return effectiveMistakeDetails.some(m => m.ayah === ayahNumber && m.wordIndex === undefined);
  };

  // Get word styling classes
  const getWordClasses = (ayahNumber: number, wordPosition: number) => {
    const inRange = isInRange(ayahNumber);
    const wordMistakeType = getWordMistakeType(ayahNumber, wordPosition);
    const entireAyahMistake = isEntireAyahMistake(ayahNumber);
    const ayahMistakeType = getMistakeType(ayahNumber);

    // Get word-specific mistake style using box-shadow (no layout shift)
    const getWordMistakeStyle = () => {
      if (wordMistakeType) {
        const config = MISTAKE_TYPES[wordMistakeType];
        // Use ring (box-shadow) instead of border to prevent layout shift
        return `${config.bgColor} ring-2 ring-inset ${config.borderColor.replace("border-", "ring-")}`;
      }
      return "";
    };

    return cn(
      "quran-word cursor-pointer transition-all duration-150 rounded",
      // Hover effect in mistakes mode when in range - use ring instead of border
      mode !== "view" && currentMode === "mistakes" && inRange && "hover:bg-red-50 hover:ring-1 hover:ring-inset hover:ring-red-300",
      // Word has a mistake marked
      wordMistakeType && getWordMistakeStyle(),
      // If entire ayah is mistake and no specific word mistake, inherit ayah highlight
      !wordMistakeType && entireAyahMistake && ayahMistakeType && MISTAKE_TYPES[ayahMistakeType].bgColor
    );
  };

  const getAyahClasses = (ayahNumber: number) => {
    const inRange = isInRange(ayahNumber);
    const mistakeType = getMistakeType(ayahNumber);

    // Get mistake-specific background color
    const getMistakeBg = () => {
      if (!mistakeType) return "";
      const config = MISTAKE_TYPES[mistakeType];
      return config.bgColor;
    };

    return cn(
      "inline cursor-pointer transition-colors duration-200 rounded-sm",
      mode !== "view" && "hover:bg-stone-100/50",
      inRange && !mistakeType && "bg-blue-50/70",
      mistakeType && getMistakeBg(),
      selectionState === "start" && ayahNumber === tempStart && "ring-2 ring-blue-400"
    );
  };

  const goToPage = (direction: "prev" | "next") => {
    if (!surahData) return;
    if (direction === "prev" && currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (direction === "next" && currentPageIndex < surahData.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-stone-50 rounded-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400 mr-3" />
        <span className="text-stone-500">Loading Quran...</span>
      </div>
    );
  }

  if (error || !surahData) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg text-red-600 border border-red-200">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error || "Failed to load Quran text"}
      </div>
    );
  }

  const currentPage = surahData.pages[currentPageIndex];
  const isFirstPage = currentPageIndex === 0;
  const showBismillah = surahData.bismillahPre && isFirstPage;

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      {mode !== "view" && (
        <div className="space-y-3">
          <div className="p-3 bg-stone-50 rounded-lg border space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={currentMode === "select" ? "default" : "outline"}
                onClick={() => setCurrentMode("select")}
              >
                <MousePointer className="h-4 w-4 mr-1" />
                Select Range
              </Button>
              <Button
                type="button"
                size="sm"
                variant={currentMode === "mistakes" ? "default" : "outline"}
                onClick={() => setCurrentMode("mistakes")}
                disabled={!hasSelection}
                className={cn(
                  currentMode === "mistakes" ? "bg-red-600 hover:bg-red-700" : "",
                  !hasSelection && "opacity-50 cursor-not-allowed"
                )}
                title={!hasSelection ? "Select a verse range first" : ""}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Mark Mistakes
              </Button>
            </div>
            <div className="text-xs sm:text-sm text-stone-500">
              {currentMode === "select" ? (
                selectionState === "start" ? (
                  <span className="text-blue-600 font-medium">Tap end verse to complete selection</span>
                ) : (
                  <span>Tap a verse to start selecting</span>
                )
              ) : (
                <span>
                  Tap to mark mistakes{" "}
                  {effectiveMistakeDetails.length > 0 && (
                    <span className="text-red-600 font-medium">
                      ({effectiveMistakeDetails.length} marked)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Mistake Instructions */}
          {currentMode === "mistakes" && (
            <div className="p-3 bg-stone-100 rounded-lg border text-sm text-stone-600">
              <p className="font-medium mb-1">How to mark mistakes:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><span className="text-red-600 font-medium">Click the ayah number</span> → Mark entire verse as "Forgot Ayah"</li>
                <li><span className="text-orange-600 font-medium">Click a word</span> → Mark that word as "Word Mistake"</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Selection Info */}
      {hasSelection && startAyah && endAyah ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
            <span className="text-blue-800">
              Selected: آية {toArabicNumeral(startAyah)} - {toArabicNumeral(endAyah)} ({startAyah}-{endAyah})
              <span className="font-medium"> • {toArabicNumeral(endAyah - startAyah + 1)} verses</span>
            </span>
            {effectiveMistakeDetails.length > 0 && (
              <span className="text-red-600 font-medium">
                {effectiveMistakeDetails.length} mistake{effectiveMistakeDetails.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {/* Mistake Details Summary */}
          {effectiveMistakeDetails.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-stone-50 rounded-lg border">
              {effectiveMistakeDetails.map((m) => {
                const config = MISTAKE_TYPES[m.type];
                const uniqueKey = m.wordIndex
                  ? `${m.ayah}-${m.wordIndex}`
                  : `${m.ayah}`;
                return (
                  <span
                    key={uniqueKey}
                    className={cn("px-2 py-1 rounded text-xs font-medium", config.bgColor, config.color)}
                  >
                    {m.wordIndex && m.wordText ? (
                      // Word-level mistake
                      <span>
                        آية {toArabicNumeral(m.ayah)} "{m.wordText}": {config.label}
                      </span>
                    ) : (
                      // Ayah-level mistake
                      <span>
                        آية {toArabicNumeral(m.ayah)}: {config.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm bg-stone-50 p-3 rounded-lg border border-stone-200 text-stone-600 text-center">
          اضغط على آية لبدء التحديد - Click on a verse to start selecting
        </div>
      )}

      {/* Page Navigation */}
      <div className="flex items-center justify-between bg-stone-100 p-2 rounded-lg">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => goToPage("prev")}
          disabled={currentPageIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <div className="text-sm text-stone-600">
          Page {currentPage.pageNumber} of Mushaf
          <span className="text-stone-400 mx-2">|</span>
          {currentPageIndex + 1} of {surahData.pages.length} in {surahData.nameEnglish}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => goToPage("next")}
          disabled={currentPageIndex === surahData.pages.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Quran Page Display - Mushaf style */}
      <div
        className="quran-container bg-[#fffef5] border border-stone-300 rounded-lg shadow-xl overflow-hidden"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.1), inset 0 0 60px rgba(0,0,0,0.02)',
        }}
        ref={(el) => {
          if (el) pageRefs.current.set(currentPage.pageNumber, el);
        }}
      >
        {/* Decorative top border */}
        <div className="h-2 bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300" />

        {/* Surah Header (only on first page of surah) */}
        {isFirstPage && (
          <div className="surah-header bg-stone-100/50 py-5 px-6 border-b border-stone-200 text-center">
            <div className="surah-name-arabic text-4xl font-bold text-stone-800">{surahData.nameArabic}</div>
            <div className="surah-name-english mt-2 text-stone-500">{surahData.nameEnglish}</div>
          </div>
        )}

        {/* Bismillah */}
        {showBismillah && (
          <div className="bismillah border-b border-stone-200">
            {BISMILLAH}
          </div>
        )}

        {/* Verses for current page - Responsive Mushaf layout */}
        <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8">
          <div className="quran-text-mushaf">
            {currentPage.verses.map((verse) => (
              <span
                key={verse.number}
                onClick={() => handleAyahClick(verse.number)}
                className={getAyahClasses(verse.number)}
              >
                {/* Render words individually if available, otherwise fall back to full text */}
                {verse.words && verse.words.length > 0 ? (
                  <>
                    {verse.words.map((word, index) => (
                      <span
                        key={`${verse.number}-${word.position}`}
                        onClick={(e) => handleWordClick(verse.number, word.position, word.text, e)}
                        className={getWordClasses(verse.number, word.position)}
                        role="button"
                        tabIndex={0}
                      >
                        {word.text}
                        {/* Add space after each word except the last */}
                        {index < verse.words.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </>
                ) : (
                  <span>{verse.text}</span>
                )}
                <AyahMarker
                  number={verse.number}
                  isSelected={isInRange(verse.number)}
                  mistakeType={isEntireAyahMistake(verse.number) ? "FORGOT_AYAH" : undefined}
                  onClick={(e) => handleAyahMarkerClick(verse.number, e)}
                  clickable={mode !== "view" && currentMode === "mistakes" && isInRange(verse.number)}
                />
              </span>
            ))}
          </div>
        </div>

        {/* Page Number Footer - Mushaf style */}
        <div className="py-3 sm:py-4 border-t border-stone-200 bg-stone-50/50">
          <div className="text-center text-lg sm:text-xl text-stone-500 font-medium" style={{ fontFamily: "'Amiri Quran', 'Scheherazade New', serif" }}>
            {toArabicNumeral(currentPage.pageNumber)}
          </div>
        </div>

        {/* Decorative bottom border */}
        <div className="h-2 bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300" />
      </div>

      {/* Page Thumbnails / Quick Navigation */}
      {surahData.pages.length > 1 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {surahData.pages.map((page, index) => {
            const hasSelectedVerses = hasSelection && page.verses.some(v => isInRange(v.number));
            const hasMistakes = page.verses.some(v => isMistake(v.number));

            return (
              <button
                key={page.pageNumber}
                type="button"
                onClick={() => setCurrentPageIndex(index)}
                className={cn(
                  "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                  "border-2 flex items-center justify-center",
                  currentPageIndex === index
                    ? "bg-stone-800 text-white border-stone-800"
                    : hasSelectedVerses
                    ? "bg-blue-100 border-blue-300 text-blue-800"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-400",
                  hasMistakes && "ring-2 ring-red-400 ring-offset-1"
                )}
              >
                {page.pageNumber}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-stone-500 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
          <span>Selected Range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span>Forgot Ayah (click ayah #)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
          <span>Word Mistake (click word)</span>
        </div>
      </div>
    </div>
  );
}
