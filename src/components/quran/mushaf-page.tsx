"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  loadPageFont,
  preloadPageFonts,
  getFontFamily,
  isFontLoaded,
  type FontVersion,
} from "@/lib/mushaf-fonts";

// Types from the API
interface MushafWord {
  id: number;
  position: number;
  codeV1: string;
  codeV2: string;
  lineNumber: number;
  textUthmani: string;
  charType: "word" | "end" | "pause";
  audioUrl?: string;
  verseKey?: string;
}

interface MushafLine {
  lineNumber: number;
  words: (MushafWord & { verseKey: string })[];
}

interface MushafPageData {
  pageNumber: number;
  lines: MushafLine[];
  fontUrl: string;
  fontUrlV2: string;
  cached?: boolean;
}

interface MushafPageProps {
  pageNumber: number;
  fontVersion?: FontVersion;
  highlightedVerseKey?: string;
  highlightedWordId?: number;
  onWordClick?: (word: MushafWord & { verseKey: string }) => void;
  onVerseClick?: (verseKey: string) => void;
  className?: string;
}

// Total lines per Mushaf page (standard Madina Mushaf)
const LINES_PER_PAGE = 15;

// Convert number to Arabic-Indic numerals
const toArabicNumeral = (num: number): string => {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((d) => arabicNumerals[parseInt(d)])
    .join("");
};

export function MushafPage({
  pageNumber,
  fontVersion = "v1",
  highlightedVerseKey,
  highlightedWordId,
  onWordClick,
  onVerseClick,
  className,
}: MushafPageProps) {
  const [pageData, setPageData] = useState<MushafPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load font for this page
  const loadFont = useCallback(async () => {
    try {
      await loadPageFont(pageNumber, fontVersion);
      setFontLoaded(true);

      // Preload adjacent pages for smoother navigation
      const adjacentPages = [pageNumber - 1, pageNumber + 1].filter(
        (p) => p >= 1 && p <= 604
      );
      preloadPageFonts(adjacentPages, fontVersion);
    } catch (err) {
      console.error("Font loading error:", err);
      // Continue without font - will fall back to text_uthmani
      setFontLoaded(true);
    }
  }, [pageNumber, fontVersion]);

  // Fetch page data
  useEffect(() => {
    setLoading(true);
    setError(null);
    setFontLoaded(isFontLoaded(pageNumber, fontVersion));

    // Start loading font immediately
    loadFont();

    // Fetch page data
    fetch(`/api/quran/pages/${pageNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setPageData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load page");
        setLoading(false);
      });
  }, [pageNumber, fontVersion, loadFont]);

  const handleWordClick = (word: MushafWord & { verseKey: string }) => {
    if (onWordClick) {
      onWordClick(word);
    }
    if (onVerseClick) {
      onVerseClick(word.verseKey);
    }
  };

  const fontFamily = getFontFamily(pageNumber, fontVersion);

  if (loading || !fontLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#fffef5] rounded-lg border border-stone-300",
          "min-h-[600px]",
          className
        )}
      >
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400 mx-auto" />
          <p className="text-stone-500 text-sm">
            {!fontLoaded ? "Loading Mushaf font..." : "Loading page..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-red-50 rounded-lg border border-red-200",
          "min-h-[600px] text-red-600",
          className
        )}
      >
        {error || "Failed to load page"}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mushaf-page bg-[#fffef5] border border-stone-300 rounded-lg shadow-xl overflow-hidden",
        className
      )}
      style={{
        boxShadow:
          "0 4px 20px rgba(0,0,0,0.1), inset 0 0 60px rgba(0,0,0,0.02)",
      }}
      dir="rtl"
      translate="no"
    >
      {/* Decorative top border */}
      <div className="h-2 bg-gradient-to-r from-stone-300 via-amber-200 to-stone-300" />

      {/* Page content */}
      <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8">
        {/* Render lines */}
        <div className="mushaf-lines space-y-0">
          {pageData.lines.map((line) => (
            <div
              key={line.lineNumber}
              className="mushaf-line flex justify-center items-baseline leading-[1.8] sm:leading-[2]"
              style={{
                fontFamily: `"${fontFamily}", "KFGQPC Uthmanic Script HAFS", serif`,
                fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                minHeight: "3rem",
              }}
            >
              {line.words.map((word, idx) => {
                const isHighlightedWord = word.id === highlightedWordId;
                const isHighlightedVerse = word.verseKey === highlightedVerseKey;
                const isEndMarker = word.charType === "end";
                const glyphCode = fontVersion === "v1" ? word.codeV1 : word.codeV2;

                return (
                  <span
                    key={`${word.verseKey}-${word.position}-${idx}`}
                    onClick={() => handleWordClick(word)}
                    className={cn(
                      "mushaf-word cursor-pointer transition-all duration-150 px-0.5",
                      "hover:text-blue-700",
                      isHighlightedWord && "bg-yellow-200 rounded",
                      isHighlightedVerse && !isHighlightedWord && "text-blue-600",
                      isEndMarker && "text-stone-500"
                    )}
                    title={word.textUthmani}
                    data-verse={word.verseKey}
                    data-word-id={word.id}
                  >
                    {glyphCode || word.textUthmani}
                  </span>
                );
              })}
            </div>
          ))}

          {/* Fill empty lines if page has fewer than 15 lines */}
          {pageData.lines.length < LINES_PER_PAGE &&
            Array.from({ length: LINES_PER_PAGE - pageData.lines.length }).map(
              (_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="mushaf-line"
                  style={{ minHeight: "3rem" }}
                />
              )
            )}
        </div>
      </div>

      {/* Page number footer */}
      <div className="py-3 sm:py-4 border-t border-stone-200 bg-stone-50/50">
        <div
          className="text-center text-lg sm:text-xl text-stone-500 font-medium"
          style={{ fontFamily: "'Amiri Quran', serif" }}
        >
          {toArabicNumeral(pageNumber)}
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="h-2 bg-gradient-to-r from-stone-300 via-amber-200 to-stone-300" />
    </div>
  );
}

// Helper hook for managing Mushaf page state
export function useMushafNavigation(initialPage: number = 1) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= 604) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === 604,
  };
}
