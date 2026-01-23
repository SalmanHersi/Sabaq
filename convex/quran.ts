import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// List all surahs
export const listSurahs = query({
  args: {},
  handler: async (ctx) => {
    const surahs = await ctx.db.query("surahs").collect();
    return surahs.sort((a, b) => a.surahNumber - b.surahNumber);
  },
});

// Get surah by number
export const getSurah = query({
  args: { surahNumber: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("surahs")
      .withIndex("by_surah_number", (q) => q.eq("surahNumber", args.surahNumber))
      .unique();
  },
});

// Get ayahs for a surah
export const getAyahs = query({
  args: { surahNumber: v.number() },
  handler: async (ctx, args) => {
    const ayahs = await ctx.db
      .query("ayahs")
      .withIndex("by_surah_ayah", (q) => q.eq("surahNumber", args.surahNumber))
      .collect();

    return ayahs.sort((a, b) => a.ayahNumber - b.ayahNumber);
  },
});

// Get specific ayah
export const getAyah = query({
  args: {
    surahNumber: v.number(),
    ayahNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ayahs")
      .withIndex("by_surah_ayah", (q) =>
        q.eq("surahNumber", args.surahNumber).eq("ayahNumber", args.ayahNumber)
      )
      .unique();
  },
});

// Seed surah data (internal mutation for data migration)
export const seedSurahs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const SURAHS = [
      { surahNumber: 1, nameArabic: "الفاتحة", nameEnglish: "Al-Fatihah", nameTranslit: "Al-Fatihah", totalAyahs: 7, revelationType: "Meccan" },
      { surahNumber: 2, nameArabic: "البقرة", nameEnglish: "Al-Baqarah", nameTranslit: "Al-Baqarah", totalAyahs: 286, revelationType: "Medinan" },
      { surahNumber: 3, nameArabic: "آل عمران", nameEnglish: "Ali 'Imran", nameTranslit: "Aal-E-Imran", totalAyahs: 200, revelationType: "Medinan" },
      { surahNumber: 4, nameArabic: "النساء", nameEnglish: "An-Nisa", nameTranslit: "An-Nisa", totalAyahs: 176, revelationType: "Medinan" },
      { surahNumber: 5, nameArabic: "المائدة", nameEnglish: "Al-Ma'idah", nameTranslit: "Al-Maidah", totalAyahs: 120, revelationType: "Medinan" },
      { surahNumber: 6, nameArabic: "الأنعام", nameEnglish: "Al-An'am", nameTranslit: "Al-Anam", totalAyahs: 165, revelationType: "Meccan" },
      { surahNumber: 7, nameArabic: "الأعراف", nameEnglish: "Al-A'raf", nameTranslit: "Al-Araf", totalAyahs: 206, revelationType: "Meccan" },
      { surahNumber: 8, nameArabic: "الأنفال", nameEnglish: "Al-Anfal", nameTranslit: "Al-Anfal", totalAyahs: 75, revelationType: "Medinan" },
      { surahNumber: 9, nameArabic: "التوبة", nameEnglish: "At-Tawbah", nameTranslit: "At-Tawbah", totalAyahs: 129, revelationType: "Medinan" },
      { surahNumber: 10, nameArabic: "يونس", nameEnglish: "Yunus", nameTranslit: "Yunus", totalAyahs: 109, revelationType: "Meccan" },
      { surahNumber: 11, nameArabic: "هود", nameEnglish: "Hud", nameTranslit: "Hud", totalAyahs: 123, revelationType: "Meccan" },
      { surahNumber: 12, nameArabic: "يوسف", nameEnglish: "Yusuf", nameTranslit: "Yusuf", totalAyahs: 111, revelationType: "Meccan" },
      { surahNumber: 13, nameArabic: "الرعد", nameEnglish: "Ar-Ra'd", nameTranslit: "Ar-Rad", totalAyahs: 43, revelationType: "Medinan" },
      { surahNumber: 14, nameArabic: "إبراهيم", nameEnglish: "Ibrahim", nameTranslit: "Ibrahim", totalAyahs: 52, revelationType: "Meccan" },
      { surahNumber: 15, nameArabic: "الحجر", nameEnglish: "Al-Hijr", nameTranslit: "Al-Hijr", totalAyahs: 99, revelationType: "Meccan" },
      { surahNumber: 16, nameArabic: "النحل", nameEnglish: "An-Nahl", nameTranslit: "An-Nahl", totalAyahs: 128, revelationType: "Meccan" },
      { surahNumber: 17, nameArabic: "الإسراء", nameEnglish: "Al-Isra", nameTranslit: "Al-Isra", totalAyahs: 111, revelationType: "Meccan" },
      { surahNumber: 18, nameArabic: "الكهف", nameEnglish: "Al-Kahf", nameTranslit: "Al-Kahf", totalAyahs: 110, revelationType: "Meccan" },
      { surahNumber: 19, nameArabic: "مريم", nameEnglish: "Maryam", nameTranslit: "Maryam", totalAyahs: 98, revelationType: "Meccan" },
      { surahNumber: 20, nameArabic: "طه", nameEnglish: "Taha", nameTranslit: "Taha", totalAyahs: 135, revelationType: "Meccan" },
      { surahNumber: 21, nameArabic: "الأنبياء", nameEnglish: "Al-Anbiya", nameTranslit: "Al-Anbiya", totalAyahs: 112, revelationType: "Meccan" },
      { surahNumber: 22, nameArabic: "الحج", nameEnglish: "Al-Hajj", nameTranslit: "Al-Hajj", totalAyahs: 78, revelationType: "Medinan" },
      { surahNumber: 23, nameArabic: "المؤمنون", nameEnglish: "Al-Mu'minun", nameTranslit: "Al-Muminun", totalAyahs: 118, revelationType: "Meccan" },
      { surahNumber: 24, nameArabic: "النور", nameEnglish: "An-Nur", nameTranslit: "An-Nur", totalAyahs: 64, revelationType: "Medinan" },
      { surahNumber: 25, nameArabic: "الفرقان", nameEnglish: "Al-Furqan", nameTranslit: "Al-Furqan", totalAyahs: 77, revelationType: "Meccan" },
      { surahNumber: 26, nameArabic: "الشعراء", nameEnglish: "Ash-Shu'ara", nameTranslit: "Ash-Shuara", totalAyahs: 227, revelationType: "Meccan" },
      { surahNumber: 27, nameArabic: "النمل", nameEnglish: "An-Naml", nameTranslit: "An-Naml", totalAyahs: 93, revelationType: "Meccan" },
      { surahNumber: 28, nameArabic: "القصص", nameEnglish: "Al-Qasas", nameTranslit: "Al-Qasas", totalAyahs: 88, revelationType: "Meccan" },
      { surahNumber: 29, nameArabic: "العنكبوت", nameEnglish: "Al-Ankabut", nameTranslit: "Al-Ankabut", totalAyahs: 69, revelationType: "Meccan" },
      { surahNumber: 30, nameArabic: "الروم", nameEnglish: "Ar-Rum", nameTranslit: "Ar-Rum", totalAyahs: 60, revelationType: "Meccan" },
      { surahNumber: 31, nameArabic: "لقمان", nameEnglish: "Luqman", nameTranslit: "Luqman", totalAyahs: 34, revelationType: "Meccan" },
      { surahNumber: 32, nameArabic: "السجدة", nameEnglish: "As-Sajdah", nameTranslit: "As-Sajdah", totalAyahs: 30, revelationType: "Meccan" },
      { surahNumber: 33, nameArabic: "الأحزاب", nameEnglish: "Al-Ahzab", nameTranslit: "Al-Ahzab", totalAyahs: 73, revelationType: "Medinan" },
      { surahNumber: 34, nameArabic: "سبأ", nameEnglish: "Saba", nameTranslit: "Saba", totalAyahs: 54, revelationType: "Meccan" },
      { surahNumber: 35, nameArabic: "فاطر", nameEnglish: "Fatir", nameTranslit: "Fatir", totalAyahs: 45, revelationType: "Meccan" },
      { surahNumber: 36, nameArabic: "يس", nameEnglish: "Ya-Sin", nameTranslit: "Ya-Sin", totalAyahs: 83, revelationType: "Meccan" },
      { surahNumber: 37, nameArabic: "الصافات", nameEnglish: "As-Saffat", nameTranslit: "As-Saffat", totalAyahs: 182, revelationType: "Meccan" },
      { surahNumber: 38, nameArabic: "ص", nameEnglish: "Sad", nameTranslit: "Sad", totalAyahs: 88, revelationType: "Meccan" },
      { surahNumber: 39, nameArabic: "الزمر", nameEnglish: "Az-Zumar", nameTranslit: "Az-Zumar", totalAyahs: 75, revelationType: "Meccan" },
      { surahNumber: 40, nameArabic: "غافر", nameEnglish: "Ghafir", nameTranslit: "Ghafir", totalAyahs: 85, revelationType: "Meccan" },
      { surahNumber: 41, nameArabic: "فصلت", nameEnglish: "Fussilat", nameTranslit: "Fussilat", totalAyahs: 54, revelationType: "Meccan" },
      { surahNumber: 42, nameArabic: "الشورى", nameEnglish: "Ash-Shura", nameTranslit: "Ash-Shura", totalAyahs: 53, revelationType: "Meccan" },
      { surahNumber: 43, nameArabic: "الزخرف", nameEnglish: "Az-Zukhruf", nameTranslit: "Az-Zukhruf", totalAyahs: 89, revelationType: "Meccan" },
      { surahNumber: 44, nameArabic: "الدخان", nameEnglish: "Ad-Dukhan", nameTranslit: "Ad-Dukhan", totalAyahs: 59, revelationType: "Meccan" },
      { surahNumber: 45, nameArabic: "الجاثية", nameEnglish: "Al-Jathiyah", nameTranslit: "Al-Jathiyah", totalAyahs: 37, revelationType: "Meccan" },
      { surahNumber: 46, nameArabic: "الأحقاف", nameEnglish: "Al-Ahqaf", nameTranslit: "Al-Ahqaf", totalAyahs: 35, revelationType: "Meccan" },
      { surahNumber: 47, nameArabic: "محمد", nameEnglish: "Muhammad", nameTranslit: "Muhammad", totalAyahs: 38, revelationType: "Medinan" },
      { surahNumber: 48, nameArabic: "الفتح", nameEnglish: "Al-Fath", nameTranslit: "Al-Fath", totalAyahs: 29, revelationType: "Medinan" },
      { surahNumber: 49, nameArabic: "الحجرات", nameEnglish: "Al-Hujurat", nameTranslit: "Al-Hujurat", totalAyahs: 18, revelationType: "Medinan" },
      { surahNumber: 50, nameArabic: "ق", nameEnglish: "Qaf", nameTranslit: "Qaf", totalAyahs: 45, revelationType: "Meccan" },
      { surahNumber: 51, nameArabic: "الذاريات", nameEnglish: "Adh-Dhariyat", nameTranslit: "Adh-Dhariyat", totalAyahs: 60, revelationType: "Meccan" },
      { surahNumber: 52, nameArabic: "الطور", nameEnglish: "At-Tur", nameTranslit: "At-Tur", totalAyahs: 49, revelationType: "Meccan" },
      { surahNumber: 53, nameArabic: "النجم", nameEnglish: "An-Najm", nameTranslit: "An-Najm", totalAyahs: 62, revelationType: "Meccan" },
      { surahNumber: 54, nameArabic: "القمر", nameEnglish: "Al-Qamar", nameTranslit: "Al-Qamar", totalAyahs: 55, revelationType: "Meccan" },
      { surahNumber: 55, nameArabic: "الرحمن", nameEnglish: "Ar-Rahman", nameTranslit: "Ar-Rahman", totalAyahs: 78, revelationType: "Medinan" },
      { surahNumber: 56, nameArabic: "الواقعة", nameEnglish: "Al-Waqi'ah", nameTranslit: "Al-Waqiah", totalAyahs: 96, revelationType: "Meccan" },
      { surahNumber: 57, nameArabic: "الحديد", nameEnglish: "Al-Hadid", nameTranslit: "Al-Hadid", totalAyahs: 29, revelationType: "Medinan" },
      { surahNumber: 58, nameArabic: "المجادلة", nameEnglish: "Al-Mujadila", nameTranslit: "Al-Mujadila", totalAyahs: 22, revelationType: "Medinan" },
      { surahNumber: 59, nameArabic: "الحشر", nameEnglish: "Al-Hashr", nameTranslit: "Al-Hashr", totalAyahs: 24, revelationType: "Medinan" },
      { surahNumber: 60, nameArabic: "الممتحنة", nameEnglish: "Al-Mumtahanah", nameTranslit: "Al-Mumtahanah", totalAyahs: 13, revelationType: "Medinan" },
      { surahNumber: 61, nameArabic: "الصف", nameEnglish: "As-Saf", nameTranslit: "As-Saf", totalAyahs: 14, revelationType: "Medinan" },
      { surahNumber: 62, nameArabic: "الجمعة", nameEnglish: "Al-Jumu'ah", nameTranslit: "Al-Jumuah", totalAyahs: 11, revelationType: "Medinan" },
      { surahNumber: 63, nameArabic: "المنافقون", nameEnglish: "Al-Munafiqun", nameTranslit: "Al-Munafiqun", totalAyahs: 11, revelationType: "Medinan" },
      { surahNumber: 64, nameArabic: "التغابن", nameEnglish: "At-Taghabun", nameTranslit: "At-Taghabun", totalAyahs: 18, revelationType: "Medinan" },
      { surahNumber: 65, nameArabic: "الطلاق", nameEnglish: "At-Talaq", nameTranslit: "At-Talaq", totalAyahs: 12, revelationType: "Medinan" },
      { surahNumber: 66, nameArabic: "التحريم", nameEnglish: "At-Tahrim", nameTranslit: "At-Tahrim", totalAyahs: 12, revelationType: "Medinan" },
      { surahNumber: 67, nameArabic: "الملك", nameEnglish: "Al-Mulk", nameTranslit: "Al-Mulk", totalAyahs: 30, revelationType: "Meccan" },
      { surahNumber: 68, nameArabic: "القلم", nameEnglish: "Al-Qalam", nameTranslit: "Al-Qalam", totalAyahs: 52, revelationType: "Meccan" },
      { surahNumber: 69, nameArabic: "الحاقة", nameEnglish: "Al-Haqqah", nameTranslit: "Al-Haqqah", totalAyahs: 52, revelationType: "Meccan" },
      { surahNumber: 70, nameArabic: "المعارج", nameEnglish: "Al-Ma'arij", nameTranslit: "Al-Maarij", totalAyahs: 44, revelationType: "Meccan" },
      { surahNumber: 71, nameArabic: "نوح", nameEnglish: "Nuh", nameTranslit: "Nuh", totalAyahs: 28, revelationType: "Meccan" },
      { surahNumber: 72, nameArabic: "الجن", nameEnglish: "Al-Jinn", nameTranslit: "Al-Jinn", totalAyahs: 28, revelationType: "Meccan" },
      { surahNumber: 73, nameArabic: "المزمل", nameEnglish: "Al-Muzzammil", nameTranslit: "Al-Muzzammil", totalAyahs: 20, revelationType: "Meccan" },
      { surahNumber: 74, nameArabic: "المدثر", nameEnglish: "Al-Muddaththir", nameTranslit: "Al-Muddaththir", totalAyahs: 56, revelationType: "Meccan" },
      { surahNumber: 75, nameArabic: "القيامة", nameEnglish: "Al-Qiyamah", nameTranslit: "Al-Qiyamah", totalAyahs: 40, revelationType: "Meccan" },
      { surahNumber: 76, nameArabic: "الإنسان", nameEnglish: "Al-Insan", nameTranslit: "Al-Insan", totalAyahs: 31, revelationType: "Medinan" },
      { surahNumber: 77, nameArabic: "المرسلات", nameEnglish: "Al-Mursalat", nameTranslit: "Al-Mursalat", totalAyahs: 50, revelationType: "Meccan" },
      { surahNumber: 78, nameArabic: "النبأ", nameEnglish: "An-Naba", nameTranslit: "An-Naba", totalAyahs: 40, revelationType: "Meccan" },
      { surahNumber: 79, nameArabic: "النازعات", nameEnglish: "An-Nazi'at", nameTranslit: "An-Naziat", totalAyahs: 46, revelationType: "Meccan" },
      { surahNumber: 80, nameArabic: "عبس", nameEnglish: "Abasa", nameTranslit: "Abasa", totalAyahs: 42, revelationType: "Meccan" },
      { surahNumber: 81, nameArabic: "التكوير", nameEnglish: "At-Takwir", nameTranslit: "At-Takwir", totalAyahs: 29, revelationType: "Meccan" },
      { surahNumber: 82, nameArabic: "الانفطار", nameEnglish: "Al-Infitar", nameTranslit: "Al-Infitar", totalAyahs: 19, revelationType: "Meccan" },
      { surahNumber: 83, nameArabic: "المطففين", nameEnglish: "Al-Mutaffifin", nameTranslit: "Al-Mutaffifin", totalAyahs: 36, revelationType: "Meccan" },
      { surahNumber: 84, nameArabic: "الانشقاق", nameEnglish: "Al-Inshiqaq", nameTranslit: "Al-Inshiqaq", totalAyahs: 25, revelationType: "Meccan" },
      { surahNumber: 85, nameArabic: "البروج", nameEnglish: "Al-Buruj", nameTranslit: "Al-Buruj", totalAyahs: 22, revelationType: "Meccan" },
      { surahNumber: 86, nameArabic: "الطارق", nameEnglish: "At-Tariq", nameTranslit: "At-Tariq", totalAyahs: 17, revelationType: "Meccan" },
      { surahNumber: 87, nameArabic: "الأعلى", nameEnglish: "Al-A'la", nameTranslit: "Al-Ala", totalAyahs: 19, revelationType: "Meccan" },
      { surahNumber: 88, nameArabic: "الغاشية", nameEnglish: "Al-Ghashiyah", nameTranslit: "Al-Ghashiyah", totalAyahs: 26, revelationType: "Meccan" },
      { surahNumber: 89, nameArabic: "الفجر", nameEnglish: "Al-Fajr", nameTranslit: "Al-Fajr", totalAyahs: 30, revelationType: "Meccan" },
      { surahNumber: 90, nameArabic: "البلد", nameEnglish: "Al-Balad", nameTranslit: "Al-Balad", totalAyahs: 20, revelationType: "Meccan" },
      { surahNumber: 91, nameArabic: "الشمس", nameEnglish: "Ash-Shams", nameTranslit: "Ash-Shams", totalAyahs: 15, revelationType: "Meccan" },
      { surahNumber: 92, nameArabic: "الليل", nameEnglish: "Al-Layl", nameTranslit: "Al-Layl", totalAyahs: 21, revelationType: "Meccan" },
      { surahNumber: 93, nameArabic: "الضحى", nameEnglish: "Ad-Duhaa", nameTranslit: "Ad-Duhaa", totalAyahs: 11, revelationType: "Meccan" },
      { surahNumber: 94, nameArabic: "الشرح", nameEnglish: "Ash-Sharh", nameTranslit: "Ash-Sharh", totalAyahs: 8, revelationType: "Meccan" },
      { surahNumber: 95, nameArabic: "التين", nameEnglish: "At-Tin", nameTranslit: "At-Tin", totalAyahs: 8, revelationType: "Meccan" },
      { surahNumber: 96, nameArabic: "العلق", nameEnglish: "Al-Alaq", nameTranslit: "Al-Alaq", totalAyahs: 19, revelationType: "Meccan" },
      { surahNumber: 97, nameArabic: "القدر", nameEnglish: "Al-Qadr", nameTranslit: "Al-Qadr", totalAyahs: 5, revelationType: "Meccan" },
      { surahNumber: 98, nameArabic: "البينة", nameEnglish: "Al-Bayyinah", nameTranslit: "Al-Bayyinah", totalAyahs: 8, revelationType: "Medinan" },
      { surahNumber: 99, nameArabic: "الزلزلة", nameEnglish: "Az-Zalzalah", nameTranslit: "Az-Zalzalah", totalAyahs: 8, revelationType: "Medinan" },
      { surahNumber: 100, nameArabic: "العاديات", nameEnglish: "Al-Adiyat", nameTranslit: "Al-Adiyat", totalAyahs: 11, revelationType: "Meccan" },
      { surahNumber: 101, nameArabic: "القارعة", nameEnglish: "Al-Qari'ah", nameTranslit: "Al-Qariah", totalAyahs: 11, revelationType: "Meccan" },
      { surahNumber: 102, nameArabic: "التكاثر", nameEnglish: "At-Takathur", nameTranslit: "At-Takathur", totalAyahs: 8, revelationType: "Meccan" },
      { surahNumber: 103, nameArabic: "العصر", nameEnglish: "Al-Asr", nameTranslit: "Al-Asr", totalAyahs: 3, revelationType: "Meccan" },
      { surahNumber: 104, nameArabic: "الهمزة", nameEnglish: "Al-Humazah", nameTranslit: "Al-Humazah", totalAyahs: 9, revelationType: "Meccan" },
      { surahNumber: 105, nameArabic: "الفيل", nameEnglish: "Al-Fil", nameTranslit: "Al-Fil", totalAyahs: 5, revelationType: "Meccan" },
      { surahNumber: 106, nameArabic: "قريش", nameEnglish: "Quraysh", nameTranslit: "Quraysh", totalAyahs: 4, revelationType: "Meccan" },
      { surahNumber: 107, nameArabic: "الماعون", nameEnglish: "Al-Ma'un", nameTranslit: "Al-Maun", totalAyahs: 7, revelationType: "Meccan" },
      { surahNumber: 108, nameArabic: "الكوثر", nameEnglish: "Al-Kawthar", nameTranslit: "Al-Kawthar", totalAyahs: 3, revelationType: "Meccan" },
      { surahNumber: 109, nameArabic: "الكافرون", nameEnglish: "Al-Kafirun", nameTranslit: "Al-Kafirun", totalAyahs: 6, revelationType: "Meccan" },
      { surahNumber: 110, nameArabic: "النصر", nameEnglish: "An-Nasr", nameTranslit: "An-Nasr", totalAyahs: 3, revelationType: "Medinan" },
      { surahNumber: 111, nameArabic: "المسد", nameEnglish: "Al-Masad", nameTranslit: "Al-Masad", totalAyahs: 5, revelationType: "Meccan" },
      { surahNumber: 112, nameArabic: "الإخلاص", nameEnglish: "Al-Ikhlas", nameTranslit: "Al-Ikhlas", totalAyahs: 4, revelationType: "Meccan" },
      { surahNumber: 113, nameArabic: "الفلق", nameEnglish: "Al-Falaq", nameTranslit: "Al-Falaq", totalAyahs: 5, revelationType: "Meccan" },
      { surahNumber: 114, nameArabic: "الناس", nameEnglish: "An-Nas", nameTranslit: "An-Nas", totalAyahs: 6, revelationType: "Meccan" },
    ];

    // Check if already seeded
    const existingSurahs = await ctx.db.query("surahs").first();
    if (existingSurahs) {
      console.log("Surahs already seeded");
      return { seeded: false, count: 0 };
    }

    for (const surah of SURAHS) {
      await ctx.db.insert("surahs", {
        ...surah,
        orderInQuran: surah.surahNumber,
      });
    }

    return { seeded: true, count: SURAHS.length };
  },
});

// Seed sample ayahs for commonly memorized surahs
export const seedAyahs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const SAMPLE_AYAHS: Record<number, string[]> = {
      1: [
        "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
        "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
        "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
        "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
        "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
        "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ"
      ],
      112: [
        "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
        "ٱللَّهُ ٱلصَّمَدُ",
        "لَمْ يَلِدْ وَلَمْ يُولَدْ",
        "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ"
      ],
      113: [
        "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ",
        "مِن شَرِّ مَا خَلَقَ",
        "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
        "وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ",
        "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ"
      ],
      114: [
        "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
        "مَلِكِ ٱلنَّاسِ",
        "إِلَـٰهِ ٱلنَّاسِ",
        "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
        "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ",
        "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ"
      ],
    };

    let count = 0;
    for (const [surahNumStr, ayahs] of Object.entries(SAMPLE_AYAHS)) {
      const surahNumber = parseInt(surahNumStr);

      // Get the surah
      const surah = await ctx.db
        .query("surahs")
        .withIndex("by_surah_number", (q) => q.eq("surahNumber", surahNumber))
        .unique();

      if (!surah) continue;

      for (let i = 0; i < ayahs.length; i++) {
        const ayahNumber = i + 1;

        // Check if already exists
        const existing = await ctx.db
          .query("ayahs")
          .withIndex("by_surah_ayah", (q) =>
            q.eq("surahNumber", surahNumber).eq("ayahNumber", ayahNumber)
          )
          .unique();

        if (!existing) {
          await ctx.db.insert("ayahs", {
            surahId: surah._id,
            surahNumber,
            ayahNumber,
            textArabic: ayahs[i],
            textUthmani: ayahs[i],
          });
          count++;
        }
      }
    }

    return { seeded: true, count };
  },
});
