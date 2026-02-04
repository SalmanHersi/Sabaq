/**
 * QCF (Quran Complex Font) loading utilities
 * These fonts are page-specific and render glyphs that match the printed Madina Mushaf
 */

const FONT_BASE_URL = "https://static.qurancdn.com/fonts/quran/hafs";

// Track loaded fonts to avoid re-loading
const loadedFonts = new Set<string>();

// Font loading promises to prevent duplicate loads
const loadingPromises = new Map<string, Promise<void>>();

export type FontVersion = "v1" | "v2";
export const DEFAULT_QCF_FONT_SCALE = 3;

const getQcfFontKey = (version: FontVersion): string => `code_${version}`;

export const getFontSizeClassName = (
  version: FontVersion,
  fontScale: number = DEFAULT_QCF_FONT_SCALE
): string => `${getQcfFontKey(version)}-font-size-${fontScale}`;

export const getLineWidthClassName = (
  version: FontVersion,
  fontScale: number = DEFAULT_QCF_FONT_SCALE
): string => `${getQcfFontKey(version)}-line-width-${fontScale}`;

/**
 * Get the font URL for a specific page
 */
export function getFontUrl(pageNumber: number, version: FontVersion = "v1"): string {
  return `${FONT_BASE_URL}/${version}/woff2/p${pageNumber}.woff2`;
}

/**
 * Get the font family name for a specific page
 */
export function getFontFamily(pageNumber: number, version: FontVersion = "v1"): string {
  return `QCF_${version.toUpperCase()}_${String(pageNumber).padStart(3, "0")}`;
}

/**
 * Load a QCF font for a specific page
 * Returns a promise that resolves when the font is loaded
 */
export async function loadPageFont(
  pageNumber: number,
  version: FontVersion = "v1"
): Promise<void> {
  const fontFamily = getFontFamily(pageNumber, version);

  // Already loaded
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  // Currently loading
  if (loadingPromises.has(fontFamily)) {
    return loadingPromises.get(fontFamily);
  }

  const loadPromise = (async () => {
    try {
      const fontUrl = getFontUrl(pageNumber, version);

      // Create and load the font
      const font = new FontFace(fontFamily, `url(${fontUrl})`, {
        style: "normal",
        weight: "400",
        display: "block", // Prevent FOIT (Flash of Invisible Text)
      });

      await font.load();

      // Add to document fonts
      document.fonts.add(font);
      loadedFonts.add(fontFamily);
    } catch (error) {
      console.error(`Failed to load font for page ${pageNumber}:`, error);
      throw error;
    } finally {
      loadingPromises.delete(fontFamily);
    }
  })();

  loadingPromises.set(fontFamily, loadPromise);
  return loadPromise;
}

/**
 * Preload fonts for multiple pages (e.g., adjacent pages for smoother navigation)
 */
export async function preloadPageFonts(
  pageNumbers: number[],
  version: FontVersion = "v1"
): Promise<void> {
  await Promise.all(pageNumbers.map((page) => loadPageFont(page, version)));
}

/**
 * Check if a font for a specific page is loaded
 */
export function isFontLoaded(pageNumber: number, version: FontVersion = "v1"): boolean {
  return loadedFonts.has(getFontFamily(pageNumber, version));
}

/**
 * Get CSS font-family string for a page
 */
export function getPageFontStyle(pageNumber: number, version: FontVersion = "v1"): string {
  return `"${getFontFamily(pageNumber, version)}", "KFGQPC Uthmanic Script HAFS", "Scheherazade New", serif`;
}
