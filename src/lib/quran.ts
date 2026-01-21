/**
 * Quran.com API Service
 *
 * Uses the public Quran.com API (api.quran.com/api/v4)
 * Note: Authenticated API credentials are configured but awaiting scope permissions
 */

const API_BASE = "https://api.quran.com/api/v4";

// Helper for Next.js fetch with caching
async function fetchWithCache(url: string, revalidateSeconds: number = 3600): Promise<Response> {
  // Using cache option for standard fetch, Next.js will enhance this
  return fetch(url, {
    cache: revalidateSeconds > 0 ? "default" : "no-store",
  });
}

// Translation IDs
export const TRANSLATIONS = {
  SAHEEH_INTERNATIONAL: 131,
  CLEAR_QURAN: 85,
  MUHSIN_KHAN: 20,
} as const;

// Popular reciters
export const RECITERS = {
  MISHARY_RASHID_ALAFASY: 7,
  ABDUL_BASIT_MURATTAL: 1,
  ABU_BAKR_AL_SHATRI: 2,
  MAHER_AL_MUAIQLY: 9,
} as const;

// Types
export interface Chapter {
  id: number;
  revelationPlace: string;
  revelationOrder: number;
  bismillahPre: boolean;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  pages: [number, number];
  translatedName: {
    languageName: string;
    name: string;
  };
}

export interface Word {
  id: number;
  position: number;
  textUthmani: string;
  textImlaei?: string;
  charTypeName: string;
  translation?: {
    text: string;
    languageName: string;
  };
}

export interface Translation {
  resourceId: number;
  text: string;
}

export interface Verse {
  id: number;
  verseKey: string;
  verseNumber: number;
  hizbNumber: number;
  rubElHizbNumber: number;
  rukuNumber: number;
  manzilNumber: number;
  sajdahNumber: number | null;
  pageNumber: number;
  juzNumber: number;
  textUthmani: string;
  textImlaei?: string;
  words?: Word[];
  translations?: Translation[];
}

export interface Pagination {
  perPage: number;
  currentPage: number;
  nextPage: number | null;
  totalPages: number;
  totalRecords: number;
}

export interface ChapterRecitation {
  id: number;
  chapterId: number;
  fileSize: number;
  format: string;
  audioUrl: string;
}

export interface Juz {
  id: number;
  juzNumber: number;
  verseMapping: Record<string, string>;
  firstVerseId: number;
  lastVerseId: number;
  versesCount: number;
}

// Helper to convert snake_case API response to camelCase
function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === "object" && item !== null
          ? toCamelCase(item as Record<string, unknown>)
          : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

/**
 * Fetch all 114 chapters (surahs) of the Quran
 */
export async function getChapters(): Promise<Chapter[]> {
  const res = await fetchWithCache(`${API_BASE}/chapters`);

  if (!res.ok) {
    throw new Error(`Failed to fetch chapters: ${res.status}`);
  }

  const data = await res.json();
  return data.chapters.map((ch: Record<string, unknown>) => toCamelCase<Chapter>(ch));
}

/**
 * Fetch a single chapter by its number (1-114)
 */
export async function getChapter(chapterNumber: number): Promise<Chapter> {
  const res = await fetchWithCache(`${API_BASE}/chapters/${chapterNumber}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch chapter ${chapterNumber}: ${res.status}`);
  }

  const data = await res.json();
  return toCamelCase<Chapter>(data.chapter);
}

/**
 * Fetch chapter info (description, revelation context, etc.)
 */
export async function getChapterInfo(chapterNumber: number): Promise<{
  chapterId: number;
  text: string;
  shortText: string;
  languageName: string;
  source: string;
}> {
  const res = await fetchWithCache(`${API_BASE}/chapters/${chapterNumber}/info`);

  if (!res.ok) {
    throw new Error(`Failed to fetch chapter info: ${res.status}`);
  }

  const data = await res.json();
  return toCamelCase(data.chapter_info);
}

export interface GetVersesOptions {
  page?: number;
  perPage?: number;
  translations?: number[];
  words?: boolean;
}

/**
 * Fetch verses for a specific chapter with Arabic text, translations, and optional word-by-word breakdown
 */
export async function getVersesByChapter(
  chapterNumber: number,
  options: GetVersesOptions = {}
): Promise<{ verses: Verse[]; pagination: Pagination }> {
  const {
    page = 1,
    perPage = 50,
    translations = [],
    words = false,
  } = options;

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    fields: "text_uthmani,text_imlaei",
    words: String(words),
  });

  if (words) {
    params.set("word_fields", "text_uthmani,text_imlaei,translation");
  }

  if (translations.length > 0) {
    params.set("translations", translations.join(","));
  }

  const res = await fetchWithCache(
    `${API_BASE}/verses/by_chapter/${chapterNumber}?${params}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch verses: ${res.status}`);
  }

  const data = await res.json();
  return {
    verses: data.verses.map((v: Record<string, unknown>) => toCamelCase<Verse>(v)),
    pagination: toCamelCase<Pagination>(data.pagination),
  };
}

/**
 * Fetch a specific verse by its key (e.g., "2:255" for Ayatul Kursi)
 */
export async function getVerseByKey(
  verseKey: string,
  options: Omit<GetVersesOptions, "page" | "perPage"> = {}
): Promise<Verse> {
  const { translations = [], words = false } = options;

  const params = new URLSearchParams({
    fields: "text_uthmani,text_imlaei",
    words: String(words),
  });

  if (words) {
    params.set("word_fields", "text_uthmani,text_imlaei,translation");
  }

  if (translations.length > 0) {
    params.set("translations", translations.join(","));
  }

  const res = await fetchWithCache(`${API_BASE}/verses/by_key/${verseKey}?${params}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch verse ${verseKey}: ${res.status}`);
  }

  const data = await res.json();
  return toCamelCase<Verse>(data.verse);
}

/**
 * Fetch verses by Juz (Para) number
 */
export async function getVersesByJuz(
  juzNumber: number,
  options: GetVersesOptions = {}
): Promise<{ verses: Verse[]; pagination: Pagination }> {
  const {
    page = 1,
    perPage = 50,
    translations = [],
    words = false,
  } = options;

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    fields: "text_uthmani,text_imlaei",
    words: String(words),
  });

  if (translations.length > 0) {
    params.set("translations", translations.join(","));
  }

  const res = await fetchWithCache(`${API_BASE}/verses/by_juz/${juzNumber}?${params}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch verses by juz: ${res.status}`);
  }

  const data = await res.json();
  return {
    verses: data.verses.map((v: Record<string, unknown>) => toCamelCase<Verse>(v)),
    pagination: toCamelCase<Pagination>(data.pagination),
  };
}

/**
 * Fetch audio recitation for a chapter
 */
export async function getChapterRecitation(
  chapterNumber: number,
  reciterId: number = RECITERS.MISHARY_RASHID_ALAFASY
): Promise<ChapterRecitation> {
  const res = await fetchWithCache(
    `${API_BASE}/chapter_recitations/${reciterId}/${chapterNumber}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch recitation: ${res.status}`);
  }

  const data = await res.json();
  return toCamelCase<ChapterRecitation>(data.audio_file);
}

/**
 * Fetch all available reciters
 */
export async function getReciters(): Promise<
  { id: number; name: string; style: string; reciterNameArabic: string }[]
> {
  const res = await fetchWithCache(`${API_BASE}/resources/recitations`);

  if (!res.ok) {
    throw new Error(`Failed to fetch reciters: ${res.status}`);
  }

  const data = await res.json();
  return data.recitations.map((r: Record<string, unknown>) =>
    toCamelCase<{ id: number; name: string; style: string; reciterNameArabic: string }>(r)
  );
}

/**
 * Fetch all available translations
 */
export async function getTranslationsList(): Promise<
  { id: number; name: string; authorName: string; languageName: string }[]
> {
  const res = await fetchWithCache(`${API_BASE}/resources/translations`);

  if (!res.ok) {
    throw new Error(`Failed to fetch translations: ${res.status}`);
  }

  const data = await res.json();
  return data.translations.map((t: Record<string, unknown>) =>
    toCamelCase<{ id: number; name: string; authorName: string; languageName: string }>(t)
  );
}

/**
 * Search the Quran for a query
 */
export async function searchQuran(
  query: string,
  options: { page?: number; perPage?: number; language?: string } = {}
): Promise<{
  search: { query: string; totalResults: number };
  results: { verseKey: string; text: string; translations: Translation[] }[];
  pagination: Pagination;
}> {
  const { page = 1, perPage = 20, language = "en" } = options;

  const params = new URLSearchParams({
    q: query,
    page: String(page),
    size: String(perPage),
    language,
  });

  const res = await fetchWithCache(`${API_BASE}/search?${params}`);

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const data = await res.json();
  return toCamelCase(data);
}

/**
 * Fetch all Juz (Para) information
 */
export async function getAllJuz(): Promise<Juz[]> {
  const res = await fetchWithCache(`${API_BASE}/juzs`);

  if (!res.ok) {
    throw new Error(`Failed to fetch juzs: ${res.status}`);
  }

  const data = await res.json();
  return data.juzs.map((j: Record<string, unknown>) => toCamelCase<Juz>(j));
}
