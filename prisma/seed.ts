import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Complete Quran data: 114 Surahs with verse counts
const SURAHS = [
  { id: 1, nameArabic: "الفاتحة", nameEnglish: "Al-Fatihah", nameTranslit: "Al-Fatihah", totalAyahs: 7, revelationType: "Meccan" },
  { id: 2, nameArabic: "البقرة", nameEnglish: "Al-Baqarah", nameTranslit: "Al-Baqarah", totalAyahs: 286, revelationType: "Medinan" },
  { id: 3, nameArabic: "آل عمران", nameEnglish: "Ali 'Imran", nameTranslit: "Aal-E-Imran", totalAyahs: 200, revelationType: "Medinan" },
  { id: 4, nameArabic: "النساء", nameEnglish: "An-Nisa", nameTranslit: "An-Nisa", totalAyahs: 176, revelationType: "Medinan" },
  { id: 5, nameArabic: "المائدة", nameEnglish: "Al-Ma'idah", nameTranslit: "Al-Maidah", totalAyahs: 120, revelationType: "Medinan" },
  { id: 6, nameArabic: "الأنعام", nameEnglish: "Al-An'am", nameTranslit: "Al-Anam", totalAyahs: 165, revelationType: "Meccan" },
  { id: 7, nameArabic: "الأعراف", nameEnglish: "Al-A'raf", nameTranslit: "Al-Araf", totalAyahs: 206, revelationType: "Meccan" },
  { id: 8, nameArabic: "الأنفال", nameEnglish: "Al-Anfal", nameTranslit: "Al-Anfal", totalAyahs: 75, revelationType: "Medinan" },
  { id: 9, nameArabic: "التوبة", nameEnglish: "At-Tawbah", nameTranslit: "At-Tawbah", totalAyahs: 129, revelationType: "Medinan" },
  { id: 10, nameArabic: "يونس", nameEnglish: "Yunus", nameTranslit: "Yunus", totalAyahs: 109, revelationType: "Meccan" },
  { id: 11, nameArabic: "هود", nameEnglish: "Hud", nameTranslit: "Hud", totalAyahs: 123, revelationType: "Meccan" },
  { id: 12, nameArabic: "يوسف", nameEnglish: "Yusuf", nameTranslit: "Yusuf", totalAyahs: 111, revelationType: "Meccan" },
  { id: 13, nameArabic: "الرعد", nameEnglish: "Ar-Ra'd", nameTranslit: "Ar-Rad", totalAyahs: 43, revelationType: "Medinan" },
  { id: 14, nameArabic: "إبراهيم", nameEnglish: "Ibrahim", nameTranslit: "Ibrahim", totalAyahs: 52, revelationType: "Meccan" },
  { id: 15, nameArabic: "الحجر", nameEnglish: "Al-Hijr", nameTranslit: "Al-Hijr", totalAyahs: 99, revelationType: "Meccan" },
  { id: 16, nameArabic: "النحل", nameEnglish: "An-Nahl", nameTranslit: "An-Nahl", totalAyahs: 128, revelationType: "Meccan" },
  { id: 17, nameArabic: "الإسراء", nameEnglish: "Al-Isra", nameTranslit: "Al-Isra", totalAyahs: 111, revelationType: "Meccan" },
  { id: 18, nameArabic: "الكهف", nameEnglish: "Al-Kahf", nameTranslit: "Al-Kahf", totalAyahs: 110, revelationType: "Meccan" },
  { id: 19, nameArabic: "مريم", nameEnglish: "Maryam", nameTranslit: "Maryam", totalAyahs: 98, revelationType: "Meccan" },
  { id: 20, nameArabic: "طه", nameEnglish: "Taha", nameTranslit: "Taha", totalAyahs: 135, revelationType: "Meccan" },
  { id: 21, nameArabic: "الأنبياء", nameEnglish: "Al-Anbiya", nameTranslit: "Al-Anbiya", totalAyahs: 112, revelationType: "Meccan" },
  { id: 22, nameArabic: "الحج", nameEnglish: "Al-Hajj", nameTranslit: "Al-Hajj", totalAyahs: 78, revelationType: "Medinan" },
  { id: 23, nameArabic: "المؤمنون", nameEnglish: "Al-Mu'minun", nameTranslit: "Al-Muminun", totalAyahs: 118, revelationType: "Meccan" },
  { id: 24, nameArabic: "النور", nameEnglish: "An-Nur", nameTranslit: "An-Nur", totalAyahs: 64, revelationType: "Medinan" },
  { id: 25, nameArabic: "الفرقان", nameEnglish: "Al-Furqan", nameTranslit: "Al-Furqan", totalAyahs: 77, revelationType: "Meccan" },
  { id: 26, nameArabic: "الشعراء", nameEnglish: "Ash-Shu'ara", nameTranslit: "Ash-Shuara", totalAyahs: 227, revelationType: "Meccan" },
  { id: 27, nameArabic: "النمل", nameEnglish: "An-Naml", nameTranslit: "An-Naml", totalAyahs: 93, revelationType: "Meccan" },
  { id: 28, nameArabic: "القصص", nameEnglish: "Al-Qasas", nameTranslit: "Al-Qasas", totalAyahs: 88, revelationType: "Meccan" },
  { id: 29, nameArabic: "العنكبوت", nameEnglish: "Al-Ankabut", nameTranslit: "Al-Ankabut", totalAyahs: 69, revelationType: "Meccan" },
  { id: 30, nameArabic: "الروم", nameEnglish: "Ar-Rum", nameTranslit: "Ar-Rum", totalAyahs: 60, revelationType: "Meccan" },
  { id: 31, nameArabic: "لقمان", nameEnglish: "Luqman", nameTranslit: "Luqman", totalAyahs: 34, revelationType: "Meccan" },
  { id: 32, nameArabic: "السجدة", nameEnglish: "As-Sajdah", nameTranslit: "As-Sajdah", totalAyahs: 30, revelationType: "Meccan" },
  { id: 33, nameArabic: "الأحزاب", nameEnglish: "Al-Ahzab", nameTranslit: "Al-Ahzab", totalAyahs: 73, revelationType: "Medinan" },
  { id: 34, nameArabic: "سبأ", nameEnglish: "Saba", nameTranslit: "Saba", totalAyahs: 54, revelationType: "Meccan" },
  { id: 35, nameArabic: "فاطر", nameEnglish: "Fatir", nameTranslit: "Fatir", totalAyahs: 45, revelationType: "Meccan" },
  { id: 36, nameArabic: "يس", nameEnglish: "Ya-Sin", nameTranslit: "Ya-Sin", totalAyahs: 83, revelationType: "Meccan" },
  { id: 37, nameArabic: "الصافات", nameEnglish: "As-Saffat", nameTranslit: "As-Saffat", totalAyahs: 182, revelationType: "Meccan" },
  { id: 38, nameArabic: "ص", nameEnglish: "Sad", nameTranslit: "Sad", totalAyahs: 88, revelationType: "Meccan" },
  { id: 39, nameArabic: "الزمر", nameEnglish: "Az-Zumar", nameTranslit: "Az-Zumar", totalAyahs: 75, revelationType: "Meccan" },
  { id: 40, nameArabic: "غافر", nameEnglish: "Ghafir", nameTranslit: "Ghafir", totalAyahs: 85, revelationType: "Meccan" },
  { id: 41, nameArabic: "فصلت", nameEnglish: "Fussilat", nameTranslit: "Fussilat", totalAyahs: 54, revelationType: "Meccan" },
  { id: 42, nameArabic: "الشورى", nameEnglish: "Ash-Shura", nameTranslit: "Ash-Shura", totalAyahs: 53, revelationType: "Meccan" },
  { id: 43, nameArabic: "الزخرف", nameEnglish: "Az-Zukhruf", nameTranslit: "Az-Zukhruf", totalAyahs: 89, revelationType: "Meccan" },
  { id: 44, nameArabic: "الدخان", nameEnglish: "Ad-Dukhan", nameTranslit: "Ad-Dukhan", totalAyahs: 59, revelationType: "Meccan" },
  { id: 45, nameArabic: "الجاثية", nameEnglish: "Al-Jathiyah", nameTranslit: "Al-Jathiyah", totalAyahs: 37, revelationType: "Meccan" },
  { id: 46, nameArabic: "الأحقاف", nameEnglish: "Al-Ahqaf", nameTranslit: "Al-Ahqaf", totalAyahs: 35, revelationType: "Meccan" },
  { id: 47, nameArabic: "محمد", nameEnglish: "Muhammad", nameTranslit: "Muhammad", totalAyahs: 38, revelationType: "Medinan" },
  { id: 48, nameArabic: "الفتح", nameEnglish: "Al-Fath", nameTranslit: "Al-Fath", totalAyahs: 29, revelationType: "Medinan" },
  { id: 49, nameArabic: "الحجرات", nameEnglish: "Al-Hujurat", nameTranslit: "Al-Hujurat", totalAyahs: 18, revelationType: "Medinan" },
  { id: 50, nameArabic: "ق", nameEnglish: "Qaf", nameTranslit: "Qaf", totalAyahs: 45, revelationType: "Meccan" },
  { id: 51, nameArabic: "الذاريات", nameEnglish: "Adh-Dhariyat", nameTranslit: "Adh-Dhariyat", totalAyahs: 60, revelationType: "Meccan" },
  { id: 52, nameArabic: "الطور", nameEnglish: "At-Tur", nameTranslit: "At-Tur", totalAyahs: 49, revelationType: "Meccan" },
  { id: 53, nameArabic: "النجم", nameEnglish: "An-Najm", nameTranslit: "An-Najm", totalAyahs: 62, revelationType: "Meccan" },
  { id: 54, nameArabic: "القمر", nameEnglish: "Al-Qamar", nameTranslit: "Al-Qamar", totalAyahs: 55, revelationType: "Meccan" },
  { id: 55, nameArabic: "الرحمن", nameEnglish: "Ar-Rahman", nameTranslit: "Ar-Rahman", totalAyahs: 78, revelationType: "Medinan" },
  { id: 56, nameArabic: "الواقعة", nameEnglish: "Al-Waqi'ah", nameTranslit: "Al-Waqiah", totalAyahs: 96, revelationType: "Meccan" },
  { id: 57, nameArabic: "الحديد", nameEnglish: "Al-Hadid", nameTranslit: "Al-Hadid", totalAyahs: 29, revelationType: "Medinan" },
  { id: 58, nameArabic: "المجادلة", nameEnglish: "Al-Mujadila", nameTranslit: "Al-Mujadila", totalAyahs: 22, revelationType: "Medinan" },
  { id: 59, nameArabic: "الحشر", nameEnglish: "Al-Hashr", nameTranslit: "Al-Hashr", totalAyahs: 24, revelationType: "Medinan" },
  { id: 60, nameArabic: "الممتحنة", nameEnglish: "Al-Mumtahanah", nameTranslit: "Al-Mumtahanah", totalAyahs: 13, revelationType: "Medinan" },
  { id: 61, nameArabic: "الصف", nameEnglish: "As-Saf", nameTranslit: "As-Saf", totalAyahs: 14, revelationType: "Medinan" },
  { id: 62, nameArabic: "الجمعة", nameEnglish: "Al-Jumu'ah", nameTranslit: "Al-Jumuah", totalAyahs: 11, revelationType: "Medinan" },
  { id: 63, nameArabic: "المنافقون", nameEnglish: "Al-Munafiqun", nameTranslit: "Al-Munafiqun", totalAyahs: 11, revelationType: "Medinan" },
  { id: 64, nameArabic: "التغابن", nameEnglish: "At-Taghabun", nameTranslit: "At-Taghabun", totalAyahs: 18, revelationType: "Medinan" },
  { id: 65, nameArabic: "الطلاق", nameEnglish: "At-Talaq", nameTranslit: "At-Talaq", totalAyahs: 12, revelationType: "Medinan" },
  { id: 66, nameArabic: "التحريم", nameEnglish: "At-Tahrim", nameTranslit: "At-Tahrim", totalAyahs: 12, revelationType: "Medinan" },
  { id: 67, nameArabic: "الملك", nameEnglish: "Al-Mulk", nameTranslit: "Al-Mulk", totalAyahs: 30, revelationType: "Meccan" },
  { id: 68, nameArabic: "القلم", nameEnglish: "Al-Qalam", nameTranslit: "Al-Qalam", totalAyahs: 52, revelationType: "Meccan" },
  { id: 69, nameArabic: "الحاقة", nameEnglish: "Al-Haqqah", nameTranslit: "Al-Haqqah", totalAyahs: 52, revelationType: "Meccan" },
  { id: 70, nameArabic: "المعارج", nameEnglish: "Al-Ma'arij", nameTranslit: "Al-Maarij", totalAyahs: 44, revelationType: "Meccan" },
  { id: 71, nameArabic: "نوح", nameEnglish: "Nuh", nameTranslit: "Nuh", totalAyahs: 28, revelationType: "Meccan" },
  { id: 72, nameArabic: "الجن", nameEnglish: "Al-Jinn", nameTranslit: "Al-Jinn", totalAyahs: 28, revelationType: "Meccan" },
  { id: 73, nameArabic: "المزمل", nameEnglish: "Al-Muzzammil", nameTranslit: "Al-Muzzammil", totalAyahs: 20, revelationType: "Meccan" },
  { id: 74, nameArabic: "المدثر", nameEnglish: "Al-Muddaththir", nameTranslit: "Al-Muddaththir", totalAyahs: 56, revelationType: "Meccan" },
  { id: 75, nameArabic: "القيامة", nameEnglish: "Al-Qiyamah", nameTranslit: "Al-Qiyamah", totalAyahs: 40, revelationType: "Meccan" },
  { id: 76, nameArabic: "الإنسان", nameEnglish: "Al-Insan", nameTranslit: "Al-Insan", totalAyahs: 31, revelationType: "Medinan" },
  { id: 77, nameArabic: "المرسلات", nameEnglish: "Al-Mursalat", nameTranslit: "Al-Mursalat", totalAyahs: 50, revelationType: "Meccan" },
  { id: 78, nameArabic: "النبأ", nameEnglish: "An-Naba", nameTranslit: "An-Naba", totalAyahs: 40, revelationType: "Meccan" },
  { id: 79, nameArabic: "النازعات", nameEnglish: "An-Nazi'at", nameTranslit: "An-Naziat", totalAyahs: 46, revelationType: "Meccan" },
  { id: 80, nameArabic: "عبس", nameEnglish: "Abasa", nameTranslit: "Abasa", totalAyahs: 42, revelationType: "Meccan" },
  { id: 81, nameArabic: "التكوير", nameEnglish: "At-Takwir", nameTranslit: "At-Takwir", totalAyahs: 29, revelationType: "Meccan" },
  { id: 82, nameArabic: "الانفطار", nameEnglish: "Al-Infitar", nameTranslit: "Al-Infitar", totalAyahs: 19, revelationType: "Meccan" },
  { id: 83, nameArabic: "المطففين", nameEnglish: "Al-Mutaffifin", nameTranslit: "Al-Mutaffifin", totalAyahs: 36, revelationType: "Meccan" },
  { id: 84, nameArabic: "الانشقاق", nameEnglish: "Al-Inshiqaq", nameTranslit: "Al-Inshiqaq", totalAyahs: 25, revelationType: "Meccan" },
  { id: 85, nameArabic: "البروج", nameEnglish: "Al-Buruj", nameTranslit: "Al-Buruj", totalAyahs: 22, revelationType: "Meccan" },
  { id: 86, nameArabic: "الطارق", nameEnglish: "At-Tariq", nameTranslit: "At-Tariq", totalAyahs: 17, revelationType: "Meccan" },
  { id: 87, nameArabic: "الأعلى", nameEnglish: "Al-A'la", nameTranslit: "Al-Ala", totalAyahs: 19, revelationType: "Meccan" },
  { id: 88, nameArabic: "الغاشية", nameEnglish: "Al-Ghashiyah", nameTranslit: "Al-Ghashiyah", totalAyahs: 26, revelationType: "Meccan" },
  { id: 89, nameArabic: "الفجر", nameEnglish: "Al-Fajr", nameTranslit: "Al-Fajr", totalAyahs: 30, revelationType: "Meccan" },
  { id: 90, nameArabic: "البلد", nameEnglish: "Al-Balad", nameTranslit: "Al-Balad", totalAyahs: 20, revelationType: "Meccan" },
  { id: 91, nameArabic: "الشمس", nameEnglish: "Ash-Shams", nameTranslit: "Ash-Shams", totalAyahs: 15, revelationType: "Meccan" },
  { id: 92, nameArabic: "الليل", nameEnglish: "Al-Layl", nameTranslit: "Al-Layl", totalAyahs: 21, revelationType: "Meccan" },
  { id: 93, nameArabic: "الضحى", nameEnglish: "Ad-Duhaa", nameTranslit: "Ad-Duhaa", totalAyahs: 11, revelationType: "Meccan" },
  { id: 94, nameArabic: "الشرح", nameEnglish: "Ash-Sharh", nameTranslit: "Ash-Sharh", totalAyahs: 8, revelationType: "Meccan" },
  { id: 95, nameArabic: "التين", nameEnglish: "At-Tin", nameTranslit: "At-Tin", totalAyahs: 8, revelationType: "Meccan" },
  { id: 96, nameArabic: "العلق", nameEnglish: "Al-Alaq", nameTranslit: "Al-Alaq", totalAyahs: 19, revelationType: "Meccan" },
  { id: 97, nameArabic: "القدر", nameEnglish: "Al-Qadr", nameTranslit: "Al-Qadr", totalAyahs: 5, revelationType: "Meccan" },
  { id: 98, nameArabic: "البينة", nameEnglish: "Al-Bayyinah", nameTranslit: "Al-Bayyinah", totalAyahs: 8, revelationType: "Medinan" },
  { id: 99, nameArabic: "الزلزلة", nameEnglish: "Az-Zalzalah", nameTranslit: "Az-Zalzalah", totalAyahs: 8, revelationType: "Medinan" },
  { id: 100, nameArabic: "العاديات", nameEnglish: "Al-Adiyat", nameTranslit: "Al-Adiyat", totalAyahs: 11, revelationType: "Meccan" },
  { id: 101, nameArabic: "القارعة", nameEnglish: "Al-Qari'ah", nameTranslit: "Al-Qariah", totalAyahs: 11, revelationType: "Meccan" },
  { id: 102, nameArabic: "التكاثر", nameEnglish: "At-Takathur", nameTranslit: "At-Takathur", totalAyahs: 8, revelationType: "Meccan" },
  { id: 103, nameArabic: "العصر", nameEnglish: "Al-Asr", nameTranslit: "Al-Asr", totalAyahs: 3, revelationType: "Meccan" },
  { id: 104, nameArabic: "الهمزة", nameEnglish: "Al-Humazah", nameTranslit: "Al-Humazah", totalAyahs: 9, revelationType: "Meccan" },
  { id: 105, nameArabic: "الفيل", nameEnglish: "Al-Fil", nameTranslit: "Al-Fil", totalAyahs: 5, revelationType: "Meccan" },
  { id: 106, nameArabic: "قريش", nameEnglish: "Quraysh", nameTranslit: "Quraysh", totalAyahs: 4, revelationType: "Meccan" },
  { id: 107, nameArabic: "الماعون", nameEnglish: "Al-Ma'un", nameTranslit: "Al-Maun", totalAyahs: 7, revelationType: "Meccan" },
  { id: 108, nameArabic: "الكوثر", nameEnglish: "Al-Kawthar", nameTranslit: "Al-Kawthar", totalAyahs: 3, revelationType: "Meccan" },
  { id: 109, nameArabic: "الكافرون", nameEnglish: "Al-Kafirun", nameTranslit: "Al-Kafirun", totalAyahs: 6, revelationType: "Meccan" },
  { id: 110, nameArabic: "النصر", nameEnglish: "An-Nasr", nameTranslit: "An-Nasr", totalAyahs: 3, revelationType: "Medinan" },
  { id: 111, nameArabic: "المسد", nameEnglish: "Al-Masad", nameTranslit: "Al-Masad", totalAyahs: 5, revelationType: "Meccan" },
  { id: 112, nameArabic: "الإخلاص", nameEnglish: "Al-Ikhlas", nameTranslit: "Al-Ikhlas", totalAyahs: 4, revelationType: "Meccan" },
  { id: 113, nameArabic: "الفلق", nameEnglish: "Al-Falaq", nameTranslit: "Al-Falaq", totalAyahs: 5, revelationType: "Meccan" },
  { id: 114, nameArabic: "الناس", nameEnglish: "An-Nas", nameTranslit: "An-Nas", totalAyahs: 6, revelationType: "Meccan" },
];

// Sample Ayah text for commonly memorized surahs (Juz Amma + Al-Fatihah)
// This is Uthmani script text for MVP demonstration
const SAMPLE_AYAHS: Record<number, string[]> = {
  1: [ // Al-Fatihah
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
    "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
    "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ"
  ],
  112: [ // Al-Ikhlas
    "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
    "ٱللَّهُ ٱلصَّمَدُ",
    "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ"
  ],
  113: [ // Al-Falaq
    "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ",
    "مِن شَرِّ مَا خَلَقَ",
    "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
    "وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ",
    "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ"
  ],
  114: [ // An-Nas
    "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
    "مَلِكِ ٱلنَّاسِ",
    "إِلَـٰهِ ٱلنَّاسِ",
    "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
    "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ",
    "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ"
  ],
  103: [ // Al-Asr
    "وَٱلْعَصْرِ",
    "إِنَّ ٱلْإِنسَـٰنَ لَفِى خُسْرٍ",
    "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ"
  ],
  108: [ // Al-Kawthar
    "إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ",
    "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
    "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ"
  ],
  110: [ // An-Nasr
    "إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ",
    "وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا",
    "فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ ۚ إِنَّهُۥ كَانَ تَوَّابًۢا"
  ],
  109: [ // Al-Kafirun
    "قُلْ يَـٰٓأَيُّهَا ٱلْكَـٰفِرُونَ",
    "لَآ أَعْبُدُ مَا تَعْبُدُونَ",
    "وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ",
    "وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ",
    "وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ",
    "لَكُمْ دِينُكُمْ وَلِىَ دِينِ"
  ],
};

async function main() {
  console.log("Starting database seed...");

  // 1. Create default center
  console.log("Creating default center...");
  const center = await prisma.center.upsert({
    where: { id: "default-center" },
    update: {},
    create: {
      id: "default-center",
      name: "Al-Hikmah Quran Learning Center",
      settings: {
        create: {
          allowRetesting: true,
        },
      },
    },
  });
  console.log(`Created center: ${center.name}`);

  // 2. Create super admin user (for magic link, we still keep passwordHash for backward compatibility)
  console.log("Creating super admin user...");
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@alhikmah.com" },
    update: {},
    create: {
      email: "admin@alhikmah.com",
      passwordHash: adminPassword,
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN,
      centerId: center.id,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // 3. Seed all 114 Surahs
  console.log("Seeding 114 Surahs...");
  for (const surah of SURAHS) {
    await prisma.surah.upsert({
      where: { id: surah.id },
      update: surah,
      create: {
        ...surah,
        orderInQuran: surah.id,
      },
    });
  }
  console.log("Seeded all 114 Surahs");

  // 4. Seed Ayah text for sample surahs
  console.log("Seeding sample Ayah text...");
  for (const [surahId, ayahs] of Object.entries(SAMPLE_AYAHS)) {
    const sid = parseInt(surahId);
    for (let i = 0; i < ayahs.length; i++) {
      await prisma.ayah.upsert({
        where: {
          surahId_ayahNumber: {
            surahId: sid,
            ayahNumber: i + 1,
          },
        },
        update: {
          textArabic: ayahs[i],
          textUthmani: ayahs[i],
        },
        create: {
          surahId: sid,
          ayahNumber: i + 1,
          textArabic: ayahs[i],
          textUthmani: ayahs[i],
        },
      });
    }
    console.log(`  Seeded ${ayahs.length} ayahs for Surah ${sid}`);
  }
  console.log("Seeded sample Ayah text");

  // 5. Create a sample teacher
  console.log("Creating sample teacher...");
  const teacherPassword = await bcrypt.hash("teacher123", 12);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@alhikmah.com" },
    update: {},
    create: {
      email: "teacher@alhikmah.com",
      passwordHash: teacherPassword,
      name: "Ustadh Ahmad",
      role: UserRole.TEACHER,
      centerId: center.id,
      teacherProfile: {
        create: {
          specialization: "Hifz & Tajweed",
        },
      },
    },
  });
  console.log(`Created teacher: ${teacher.email}`);

  // 6. Create a sample student
  console.log("Creating sample student...");
  const studentPassword = await bcrypt.hash("student123", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@alhikmah.com" },
    update: {},
    create: {
      email: "student@alhikmah.com",
      passwordHash: studentPassword,
      name: "Yusuf Ibrahim",
      role: UserRole.STUDENT,
      centerId: center.id,
      studentProfile: {
        create: {
          enrollmentDate: new Date(),
          currentStreak: 0,
          longestStreak: 0,
        },
      },
    },
  });
  console.log(`Created student: ${student.email}`);

  // 7. Create a sample parent
  console.log("Creating sample parent...");
  const parentPassword = await bcrypt.hash("parent123", 12);
  const parent = await prisma.user.upsert({
    where: { email: "parent@alhikmah.com" },
    update: {},
    create: {
      email: "parent@alhikmah.com",
      passwordHash: parentPassword,
      name: "Ibrahim Hassan",
      role: UserRole.PARENT,
      centerId: center.id,
      parentProfile: {
        create: {
          phone: "+1234567890",
        },
      },
    },
  });
  console.log(`Created parent: ${parent.email}`);

  // 8. Link teacher and student
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: teacher.id },
  });
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: student.id },
  });

  if (teacherProfile && studentProfile) {
    await prisma.studentTeacher.upsert({
      where: {
        studentId_teacherId: {
          studentId: studentProfile.id,
          teacherId: teacherProfile.id,
        },
      },
      update: {},
      create: {
        studentId: studentProfile.id,
        teacherId: teacherProfile.id,
        isPrimary: true,
      },
    });
    console.log("Linked teacher and student");

    // 9. Link parent and student
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parent.id },
    });

    if (parentProfile) {
      await prisma.parentStudent.upsert({
        where: {
          parentId_studentId: {
            parentId: parentProfile.id,
            studentId: studentProfile.id,
          },
        },
        update: {},
        create: {
          parentId: parentProfile.id,
          studentId: studentProfile.id,
          relationship: "parent",
        },
      });
      console.log("Linked parent and student");
    }
  }

  console.log("\nDatabase seed completed!");
  console.log("\nTest accounts (use magic link email login):");
  console.log("  Admin:   admin@alhikmah.com");
  console.log("  Teacher: teacher@alhikmah.com");
  console.log("  Student: student@alhikmah.com");
  console.log("  Parent:  parent@alhikmah.com");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
