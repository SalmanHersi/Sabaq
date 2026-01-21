import { NextRequest, NextResponse } from "next/server";

// Cache for page data
const cache = new Map<number, { data: MushafPageData; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface ApiWord {
  id: number;
  position: number;
  audio_url?: string;
  char_type_name: string;
  code_v1: string;
  code_v2: string;
  v1_page: number;
  line_number: number;
  text_uthmani: string;
  page_number: number;
  verse_key: string;
}

interface ApiVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  page_number: number;
  words?: ApiWord[];
}

interface ApiResponse {
  verses: ApiVerse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

// Output types
export interface MushafWord {
  id: number;
  position: number;
  codeV1: string;
  codeV2: string;
  lineNumber: number;
  textUthmani: string;
  charType: "word" | "end" | "pause";
  audioUrl?: string;
}

export interface MushafVerse {
  verseKey: string;
  verseNumber: number;
  chapterId: number;
  words: MushafWord[];
}

export interface MushafLine {
  lineNumber: number;
  words: (MushafWord & { verseKey: string })[];
}

export interface MushafPageData {
  pageNumber: number;
  verses: MushafVerse[];
  lines: MushafLine[];
  fontUrl: string;
  fontUrlV2: string;
}

async function fetchPageData(pageNumber: number): Promise<ApiVerse[]> {
  const allVerses: ApiVerse[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?` +
        `page=${currentPage}&per_page=50&words=true&` +
        `word_fields=code_v1,code_v2,v1_page,line_number,text_uthmani,audio_url,char_type_name`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch page ${pageNumber}`);
    }

    const data: ApiResponse = await response.json();
    allVerses.push(...data.verses);

    hasMore = data.pagination.next_page !== null;
    currentPage++;

    // Safety limit
    if (currentPage > 10) break;
  }

  return allVerses;
}

function processPageData(pageNumber: number, verses: ApiVerse[]): MushafPageData {
  // Process verses
  const processedVerses: MushafVerse[] = verses.map((verse) => {
    const [chapterId] = verse.verse_key.split(":").map(Number);

    const words: MushafWord[] = (verse.words || []).map((word) => ({
      id: word.id,
      position: word.position,
      codeV1: word.code_v1,
      codeV2: word.code_v2,
      lineNumber: word.line_number,
      textUthmani: word.text_uthmani,
      charType: word.char_type_name as "word" | "end" | "pause",
      audioUrl: word.audio_url,
    }));

    return {
      verseKey: verse.verse_key,
      verseNumber: verse.verse_number,
      chapterId,
      words,
    };
  });

  // Group words by line for rendering
  const lineMap = new Map<number, (MushafWord & { verseKey: string })[]>();

  for (const verse of processedVerses) {
    for (const word of verse.words) {
      const lineNum = word.lineNumber;
      if (!lineMap.has(lineNum)) {
        lineMap.set(lineNum, []);
      }
      lineMap.get(lineNum)!.push({
        ...word,
        verseKey: verse.verseKey,
      });
    }
  }

  // Sort lines and words within lines
  const lines: MushafLine[] = Array.from(lineMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([lineNumber, words]) => ({
      lineNumber,
      words: words.sort((a, b) => {
        // Sort by verse key first, then by position
        if (a.verseKey !== b.verseKey) {
          const [aChapter, aVerse] = a.verseKey.split(":").map(Number);
          const [bChapter, bVerse] = b.verseKey.split(":").map(Number);
          if (aChapter !== bChapter) return aChapter - bChapter;
          return aVerse - bVerse;
        }
        return a.position - b.position;
      }),
    }));

  return {
    pageNumber,
    verses: processedVerses,
    lines,
    fontUrl: `https://static.qurancdn.com/fonts/quran/hafs/v1/woff2/p${pageNumber}.woff2`,
    fontUrlV2: `https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p${pageNumber}.woff2`,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageNumber: string }> }
) {
  try {
    const { pageNumber: pageStr } = await params;
    const pageNumber = parseInt(pageStr);

    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 604) {
      return NextResponse.json(
        { error: "Invalid page number. Must be between 1 and 604." },
        { status: 400 }
      );
    }

    // Check cache
    const cached = cache.get(pageNumber);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    // Fetch and process
    const verses = await fetchPageData(pageNumber);
    const data = processPageData(pageNumber, verses);

    // Update cache
    cache.set(pageNumber, { data, timestamp: Date.now() });

    return NextResponse.json({ ...data, cached: false });
  } catch (error) {
    console.error("Error fetching Mushaf page:", error);
    return NextResponse.json(
      { error: "Failed to fetch Mushaf page. Please try again." },
      { status: 500 }
    );
  }
}
