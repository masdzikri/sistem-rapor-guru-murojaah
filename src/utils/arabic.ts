/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Eastern Arabic / Hindu-Arabic numeral conversion
const ARABIC_DIGITS: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
  ',': '٫',
  '.': '٫',
};

/**
 * Mengubah angka Latin (1, 2, 3...) menjadi angka Arab Timur (١, ٢, ٣...).
 */
export function toArabicDigits(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—';
  const str = String(val);
  return str.replace(/[0-9.,]/g, (ch) => ARABIC_DIGITS[ch] || ch);
}

/**
 * Kamus padanan nama mata pelajaran Arab untuk pesantren KMI/madrasah.
 */
export const ARABIC_SUBJECT_MAP: Record<string, string> = {
  shorof: 'الصرف',
  sarf: 'الصرف',
  sorof: 'الصرف',
  'ushul fiqh': 'أصول الفقه',
  'ushul fiqih': 'أصول الفقه',
  'usul fiqh': 'أصول الفقه',
  'muthala\'ah': 'المطالعة',
  'muthola\'ah': 'المطالعة',
  muthalaah: 'المطالعة',
  mutholaah: 'المطالعة',
  nahwu: 'النحو',
  nahu: 'النحو',
  mahfuzhat: 'المحفوظات',
  mahfudzot: 'المحفوظات',
  mahfuzot: 'المحفوظات',
  mahfudhat: 'المحفوظات',
  fiqh: 'الفقه',
  fiqih: 'الفقه',
  tauhid: 'التوحid',
  tawhid: 'التوحيد',
  'tarikh islam': 'التاريخ الإسلامي',
  'tarikh islami': 'التاريخ الإسلامي',
  tarikh: 'التاريخ',
  sejarah: 'التاريخ',
  balaghah: 'البلاغة',
  balaghoh: 'البلاغة',
  tajwid: 'التجويد',
  tajweed: 'التجويد',
  "insya'": 'الإنشاء',
  insya: 'الإنشاء',
  "imla'": 'الإملاء',
  imla: 'الإملاء',
  khot: 'الخط',
  khat: 'الخط',
  hadits: 'الحديث',
  hadist: 'الحديث',
  hadith: 'الحديث',
  'musthalah hadits': 'مصطلح الحديث',
  'mustholah hadits': 'مصطلح الحديث',
  tafsir: 'التفسير',
  mantiq: 'المنطق',
  manthiq: 'المنطق',
  faraid: 'الفرائض',
  faraidh: 'الفرائض',
  tarbiyah: 'التربية والتعليم',
  'ilmu tarbiyah': 'التربية والتعليم',
  'ushul tarbiyah': 'أصول التربية',
  'ilmu jiwa': 'علم النفس',
  psikologi: 'علم النفس',
  berhitung: 'الحساب',
  hisab: 'الحساب',
  matematika: 'الحساب',
  'al-qur\'an': 'القرآن الكريم',
  'al quran': 'القرآن الكريم',
  alquran: 'القرآن الكريم',
  quran: 'القرآن الكريم',
  'bahasa arab': 'اللغة العربية',
  'b. arab': 'اللغة العربية',
  'b.arab': 'اللغة العربية',
  arabic: 'اللغة العربية',
  'bahasa inggris': 'اللغة الإنجليزية',
  'b. inggris': 'اللغة الإنجليزية',
  'b.inggris': 'اللغة الإنجليزية',
  english: 'اللغة الإنجليزية',
  'bahasa indonesia': 'اللغة الإندونيسية',
  'b. indonesia': 'اللغة الإندونيسية',
  'tamrin lughah': 'تمرينات اللغة',
  tamrinat: 'تمرينات اللغة',
  adyan: 'مقارنة الأديان',
  'al-adyan': 'مقارنة الأديان',
  'perbandingan agama': 'مقارنة الأديان',
  'dinul islam': 'الدين الإسلامي',
  'ad-dinul islami': 'الدين الإسلامي',
  falak: 'علم الفلك',
  kimia: 'الكيمياء',
  fisika: 'الفيزياء',
  biologi: 'الأحياء',
  geografi: 'الجغرافيا',
  'kewarganegaraan': 'التربية الوطنية',
  pkn: 'التربية الوطنية',
  'tibbun nabawi': 'الطب النبوي',
};

/**
 * Mendeteksi apakah string mengandung huruf Arab
 */
export function hasArabicLetters(str: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(str);
}

/**
 * Dapatkan padanan nama Arab mata pelajaran yang pasti berbahasa Arab.
 */
export function getSubjectArabicName(namaLatin: string): string {
  if (!namaLatin) return '';

  // Jika sudah bertulisan Arab, langsung kembalikan
  if (hasArabicLetters(namaLatin)) {
    return namaLatin.trim();
  }

  const normalized = namaLatin.toLowerCase().trim();

  // 1. Cocok persis
  if (ARABIC_SUBJECT_MAP[normalized]) {
    return ARABIC_SUBJECT_MAP[normalized];
  }

  // 2. Cocok kata kunci
  for (const [key, arab] of Object.entries(ARABIC_SUBJECT_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return arab;
    }
  }

  // 3. Fallback jika tidak ditemukan: kembalikan nama Latin atau coba terjemahkan standar
  return namaLatin;
}
