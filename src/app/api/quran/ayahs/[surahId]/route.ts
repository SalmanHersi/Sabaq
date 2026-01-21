import { NextRequest, NextResponse } from "next/server";

// In-memory cache for Quran verses
const cache = new Map<number, { data: SurahData; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour (pages don't change)

interface QuranComWord {
  id: number;
  position: number;
  text_uthmani: string;
  char_type_name: string; // "word" or "end" (for ayah markers)
}

interface QuranComVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  page_number: number;
  words?: QuranComWord[];
}

interface QuranComVersesResponse {
  verses: QuranComVerse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

interface QuranComChapter {
  chapter: {
    id: number;
    name_arabic: string;
    name_simple: string;
    bismillah_pre: boolean;
    verses_count: number;
    pages: [number, number];
  };
}

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

async function fetchAllVerses(surahId: number): Promise<QuranComVerse[]> {
  const allVerses: QuranComVerse[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    // Fetch verses with word-by-word data
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?page=${currentPage}&per_page=50&fields=text_uthmani,page_number&words=true&word_fields=text_uthmani,position,char_type_name`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch verses page ${currentPage}`);
    }

    const data: QuranComVersesResponse = await response.json();
    allVerses.push(...data.verses);

    hasMore = data.pagination.next_page !== null;
    currentPage++;

    // Safety limit to prevent infinite loops
    if (currentPage > 20) break;
  }

  return allVerses;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ surahId: string }> }
) {
  try {
    const { surahId: surahIdStr } = await params;
    const surahId = parseInt(surahIdStr);

    if (isNaN(surahId) || surahId < 1 || surahId > 114) {
      return NextResponse.json(
        { error: "Invalid surah ID. Must be between 1 and 114." },
        { status: 400 }
      );
    }

    // Check cache
    const cached = cache.get(surahId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    // Fetch chapter info and all verses from Quran.com API
    const [chapterRes, verses] = await Promise.all([
      fetch(`https://api.quran.com/api/v4/chapters/${surahId}`, {
        next: { revalidate: 86400 },
      }),
      fetchAllVerses(surahId),
    ]);

    if (!chapterRes.ok) {
      throw new Error("Failed to fetch chapter info");
    }

    const chapterData: QuranComChapter = await chapterRes.json();

    // Group verses by page number
    const pageMap = new Map<number, Verse[]>();

    for (const verse of verses) {
      const pageNum = verse.page_number;
      if (!pageMap.has(pageNum)) {
        pageMap.set(pageNum, []);
      }

      // Extract words (filter out "end" markers which are ayah number decorations)
      const words: Word[] = (verse.words || [])
        .filter(w => w.char_type_name === "word")
        .map(w => ({
          position: w.position,
          text: w.text_uthmani,
        }));

      pageMap.get(pageNum)!.push({
        number: verse.verse_number,
        text: verse.text_uthmani,
        words,
        pageNumber: pageNum,
      });
    }

    // Convert to sorted array of pages
    const pages: PageData[] = Array.from(pageMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNumber, verses]) => ({
        pageNumber,
        verses: verses.sort((a, b) => a.number - b.number),
      }));

    const data: SurahData = {
      surahId,
      nameArabic: chapterData.chapter.name_arabic,
      nameEnglish: chapterData.chapter.name_simple,
      bismillahPre: chapterData.chapter.bismillah_pre,
      versesCount: chapterData.chapter.verses_count,
      startPage: chapterData.chapter.pages[0],
      endPage: chapterData.chapter.pages[1],
      pages,
    };

    // Update cache
    cache.set(surahId, { data, timestamp: Date.now() });

    return NextResponse.json({ ...data, cached: false });
  } catch (error) {
    console.error("Error fetching Quran verses:", error);
    return NextResponse.json(
      { error: "Failed to fetch Quran verses. Please try again." },
      { status: 500 }
    );
  }
}
