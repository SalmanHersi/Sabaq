import { NextRequest, NextResponse } from "next/server";

interface QuranComWord {
  id: number;
  position: number;
  audio_url?: string;
  char_type_name: string;
  code_v1: string;
  code_v2: string;
  line_number: number;
  page_number: number;
  text_uthmani: string;
  verse_key: string;
}

interface QuranComVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  words: QuranComWord[];
}

interface QuranComResponse {
  verses: QuranComVerse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

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
  globalOrder: number; // For correct sorting across verses
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
  fontUrlV2: string;
}

// Cache for page data (in-memory, will reset on server restart)
const pageCache = new Map<number, { data: MushafPageData; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageNumber: string }> }
) {
  const { pageNumber: pageNumberStr } = await params;
  const pageNumber = parseInt(pageNumberStr, 10);

  if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 604) {
    return NextResponse.json(
      { error: "Invalid page number. Must be between 1 and 604." },
      { status: 400 }
    );
  }

  // Check cache
  const cached = pageCache.get(pageNumber);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  try {
    // Fetch from Quran.com (QDC) API using the QCF mushaf layout (Madani V1).
    // This matches Quran.com's own reading view line breaks.
    const mushafId = 2; // QCF V1 (Madani V1) per quran.com
    const apiUrl =
      `https://api.qurancdn.com/api/qdc/verses/by_page/${pageNumber}` +
      `?words=true&per_page=all&filter_page_words=true` +
      `&mushaf=${mushafId}` +
      `&word_fields=code_v1,code_v2,text_uthmani,line_number,position,char_type_name,page_number`;

    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Quran.com API error: ${response.status}`);
    }

    const data: QuranComResponse = await response.json();

    // Transform the data into our format
    const linesMap = new Map<number, MushafWord[]>();
    const verses: { verseKey: string; verseNumber: number; chapterId: number }[] = [];

    // Global order counter to maintain correct reading order across verses
    let globalOrder = 0;

    for (const verse of data.verses) {
      const [chapterStr, verseStr] = verse.verse_key.split(":");
      const chapterId = parseInt(chapterStr, 10);
      const verseNumber = parseInt(verseStr, 10);

      verses.push({
        verseKey: verse.verse_key,
        verseNumber,
        chapterId,
      });

      for (const word of verse.words) {
        // Ensure we only use words that belong to this page.
        if (word.page_number && word.page_number !== pageNumber) {
          continue;
        }
        const lineNumber = word.line_number;

        if (!linesMap.has(lineNumber)) {
          linesMap.set(lineNumber, []);
        }

        const charType =
          word.char_type_name === "end"
            ? "end"
            : word.char_type_name === "pause"
            ? "pause"
            : "word";

        linesMap.get(lineNumber)!.push({
          id: word.id,
          position: word.position,
          codeV1: word.code_v1,
          codeV2: word.code_v2,
          lineNumber: word.line_number,
          textUthmani: word.text_uthmani,
          charType,
          audioUrl: word.audio_url,
          verseKey: verse.verse_key,
          globalOrder: globalOrder++,
        });
      }
    }

    // Convert map to sorted array of lines
    // Sort words by globalOrder to maintain correct reading order across verses
    const lines: MushafLine[] = Array.from(linesMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([lineNumber, words]) => ({
        lineNumber,
        words: words.sort((a, b) => a.globalOrder - b.globalOrder),
      }));

    // Font URLs for the page (no padding needed)
    const fontUrl = `https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p${pageNumber}.woff2`;
    const fontUrlV2 = `https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p${pageNumber}.woff2`;

    const pageData: MushafPageData = {
      pageNumber,
      lines,
      verses,
      fontUrl,
      fontUrlV2,
    };

    // Cache the result
    pageCache.set(pageNumber, { data: pageData, timestamp: Date.now() });

    return NextResponse.json(pageData);
  } catch (error) {
    console.error("Error fetching Quran page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page data" },
      { status: 500 }
    );
  }
}
