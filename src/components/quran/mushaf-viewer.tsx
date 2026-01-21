"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MushafPage, useMushafNavigation } from "./mushaf-page";
import type { FontVersion } from "@/lib/mushaf-fonts";

// Mushaf page ranges for each surah
// This maps surah number to [startPage, endPage]
const SURAH_PAGE_MAPPING: Record<number, [number, number]> = {
  1: [1, 1],
  2: [2, 49],
  3: [50, 76],
  4: [77, 106],
  5: [106, 127],
  6: [128, 150],
  7: [151, 176],
  8: [177, 186],
  9: [187, 207],
  10: [208, 221],
  11: [221, 235],
  12: [235, 248],
  13: [249, 255],
  14: [255, 261],
  15: [262, 267],
  16: [267, 281],
  17: [282, 293],
  18: [293, 304],
  19: [305, 312],
  20: [312, 321],
  21: [322, 331],
  22: [332, 341],
  23: [342, 349],
  24: [350, 359],
  25: [359, 366],
  26: [367, 376],
  27: [377, 385],
  28: [385, 396],
  29: [396, 404],
  30: [404, 410],
  31: [411, 414],
  32: [415, 417],
  33: [418, 427],
  34: [428, 434],
  35: [434, 440],
  36: [440, 445],
  37: [446, 452],
  38: [453, 458],
  39: [458, 467],
  40: [467, 476],
  41: [477, 482],
  42: [483, 489],
  43: [489, 495],
  44: [496, 498],
  45: [499, 502],
  46: [502, 507],
  47: [507, 511],
  48: [511, 515],
  49: [515, 517],
  50: [518, 520],
  51: [520, 523],
  52: [523, 525],
  53: [526, 528],
  54: [528, 531],
  55: [531, 534],
  56: [534, 537],
  57: [537, 541],
  58: [542, 545],
  59: [545, 548],
  60: [549, 551],
  61: [551, 552],
  62: [553, 554],
  63: [554, 555],
  64: [556, 557],
  65: [558, 559],
  66: [560, 561],
  67: [562, 564],
  68: [564, 566],
  69: [566, 568],
  70: [568, 570],
  71: [570, 571],
  72: [572, 573],
  73: [574, 575],
  74: [575, 577],
  75: [577, 578],
  76: [578, 580],
  77: [580, 581],
  78: [582, 583],
  79: [583, 584],
  80: [585, 585],
  81: [586, 586],
  82: [587, 587],
  83: [587, 589],
  84: [589, 590],
  85: [590, 591],
  86: [591, 591],
  87: [592, 592],
  88: [592, 593],
  89: [593, 594],
  90: [594, 595],
  91: [595, 595],
  92: [595, 596],
  93: [596, 596],
  94: [596, 596],
  95: [597, 597],
  96: [597, 597],
  97: [598, 598],
  98: [598, 599],
  99: [599, 599],
  100: [599, 600],
  101: [600, 600],
  102: [600, 600],
  103: [601, 601],
  104: [601, 601],
  105: [601, 601],
  106: [602, 602],
  107: [602, 602],
  108: [602, 602],
  109: [603, 603],
  110: [603, 603],
  111: [603, 603],
  112: [604, 604],
  113: [604, 604],
  114: [604, 604],
};

interface MushafViewerProps {
  initialPage?: number;
  surahId?: number;
  fontVersion?: FontVersion;
  onWordClick?: (verseKey: string, wordId: number) => void;
  onPageChange?: (pageNumber: number) => void;
  className?: string;
}

// Convert number to Arabic-Indic numerals
const toArabicNumeral = (num: number): string => {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((d) => arabicNumerals[parseInt(d)])
    .join("");
};

export function MushafViewer({
  initialPage = 1,
  surahId,
  fontVersion = "v1",
  onWordClick,
  onPageChange,
  className,
}: MushafViewerProps) {
  // Determine initial page from surah if provided
  const startPage = surahId ? SURAH_PAGE_MAPPING[surahId]?.[0] || 1 : initialPage;

  const { currentPage, goToPage, nextPage, prevPage, isFirstPage, isLastPage } =
    useMushafNavigation(startPage);

  const [highlightedVerseKey, setHighlightedVerseKey] = useState<string | undefined>();

  // Notify parent of page changes
  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  const handleWordClick = (word: { verseKey: string; id: number }) => {
    setHighlightedVerseKey(word.verseKey);
    onWordClick?.(word.verseKey, word.id);
  };

  // Get surah range for current page (for display)
  const getSurahsOnPage = (page: number): number[] => {
    const surahs: number[] = [];
    for (const [surah, [start, end]] of Object.entries(SURAH_PAGE_MAPPING)) {
      if (page >= start && page <= end) {
        surahs.push(parseInt(surah));
      }
    }
    return surahs;
  };

  const surahsOnPage = getSurahsOnPage(currentPage);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Navigation Header */}
      <div className="flex items-center justify-between bg-stone-100 p-3 rounded-lg">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={prevPage}
          disabled={isFirstPage}
          className="gap-1"
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>

        <div className="flex items-center gap-3 text-sm text-stone-600">
          <BookOpen className="h-4 w-4" />
          <span>
            صفحة {toArabicNumeral(currentPage)} من ٦٠٤
          </span>
          {surahsOnPage.length > 0 && (
            <>
              <span className="text-stone-300">|</span>
              <span className="text-stone-500">
                سورة {surahsOnPage.map((s) => toArabicNumeral(s)).join("، ")}
              </span>
            </>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={nextPage}
          disabled={isLastPage}
          className="gap-1"
        >
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Mushaf Page */}
      <MushafPage
        pageNumber={currentPage}
        fontVersion={fontVersion}
        highlightedVerseKey={highlightedVerseKey}
        onWordClick={handleWordClick}
      />

      {/* Page Jump */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-stone-500">Go to page:</span>
        <input
          type="number"
          min={1}
          max={604}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (!isNaN(page)) goToPage(page);
          }}
          className="w-20 px-2 py-1 text-center border rounded-md text-sm"
        />
        <span className="text-sm text-stone-400">/ 604</span>
      </div>

      {/* Quick Navigation to Juz */}
      <div className="flex flex-wrap gap-1 justify-center">
        {[1, 5, 10, 15, 20, 25, 30].map((juz) => {
          // Approximate page for each juz start
          const juzStartPages: Record<number, number> = {
            1: 1,
            5: 82,
            10: 177,
            15: 262,
            20: 332,
            25: 398,
            30: 518,
          };
          return (
            <Button
              key={juz}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(juzStartPages[juz])}
              className={cn(
                "text-xs",
                currentPage >= juzStartPages[juz] &&
                  currentPage < (juzStartPages[juz + 5] || 605) &&
                  "bg-stone-200"
              )}
            >
              جزء {toArabicNumeral(juz)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Export the page mapping for use elsewhere
export { SURAH_PAGE_MAPPING };
