/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrenNilai } from '../types/index.ts';

/**
 * Parsing angka aman dari berbagai format:
 * - String dengan koma desimal: "80,68" -> 80.68
 * - String dengan titik desimal: "80.68" -> 80.68
 * - Angka murni: 80.68 -> 80.68
 * - Nilai kosong/null/undefined -> null
 */
export function parseSafeNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (typeof val === 'string') {
    const cleaned = val.trim().replace(/\s/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '—' || cleaned === '###') return null;
    // Jika mengandung koma sebagai pemisah desimal
    const normalized = cleaned.replace(/,/g, '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Format angka ke format desimal Indonesia dengan koma.
 * e.g. 80.68 -> "80,68", -7.45 -> "-7,45"
 */
export function formatNumberId(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const fixed = val.toFixed(decimals);
  return fixed.replace('.', ',');
}

/**
 * Format persentase dengan tanda % dan tanda plus opsional.
 * e.g. -9.23 -> "-9%", 4.12 -> "+4%", 0 -> "0%", null -> "—"
 */
export function formatPercentage(val: number | null | undefined, includeSign = false, decimals = 0): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const rounded = decimals > 0 ? val.toFixed(decimals).replace('.', ',') : Math.round(val);
  if (includeSign && val > 0) {
    return `+${rounded}%`;
  }
  return `${rounded}%`;
}

/**
 * Hitung selisih, persentase, dan tren otomatis sesuai formula spesifikasi:
 * - Selisih = Nilai periode berjalan - Nilai periode sebelumnya
 * - Persentase perubahan = Selisih / Nilai periode sebelumnya * 100%
 * - Jika nilai sebelumnya 0 atau kosong, tampilkan null (akan diformat "—")
 * - Tren: Naik / Turun / Tetap / Belum Lengkap
 */
export function calculateEvaluation(
  sebelumnya: number | null,
  berjalan: number | null
): {
  selisih: number | null;
  persentase: number | null;
  tren: TrenNilai;
} {
  if (berjalan === null) {
    return {
      selisih: null,
      persentase: null,
      tren: 'Belum Lengkap',
    };
  }

  if (sebelumnya === null) {
    return {
      selisih: null,
      persentase: null,
      tren: 'Belum Lengkap',
    };
  }

  // Hitung selisih
  const selisih = Number((berjalan - sebelumnya).toFixed(2));

  // Hitung persentase jika nilai sebelumnya valid dan bukan 0
  let persentase: number | null = null;
  if (sebelumnya !== 0) {
    persentase = Number(((selisih / Math.abs(sebelumnya)) * 100).toFixed(2));
  }

  // Tentukan tren
  let tren: TrenNilai = 'Tetap';
  if (selisih > 0) {
    tren = 'Naik';
  } else if (selisih < 0) {
    tren = 'Turun';
  } else {
    tren = 'Tetap';
  }

  return {
    selisih,
    persentase,
    tren,
  };
}

/**
 * Menghitung ranking kompetisi standar (Standard Competition Ranking 1224)
 * Contoh: skor [90, 85, 85, 80] -> ranking [1, 2, 2, 4]
 */
export function calculateCompetitionRankings<T extends { score: number | null }>(
  items: T[],
  higherIsBetter = true
): Array<T & { rank: number | null }> {
  // Pisahkan item yang memiliki skor dan yang null
  const withScore = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter((entry) => entry.item.score !== null);

  const withoutScore = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter((entry) => entry.item.score === null);

  // Urutkan yang memiliki nilai
  withScore.sort((a, b) => {
    const scoreA = a.item.score!;
    const scoreB = b.item.score!;
    return higherIsBetter ? scoreB - scoreA : scoreA - scoreB;
  });

  const rankedItems: Array<T & { rank: number | null; originalIndex: number }> = [];

  let currentRank = 1;
  for (let i = 0; i < withScore.length; i++) {
    if (i > 0) {
      const prevScore = withScore[i - 1].item.score;
      const currScore = withScore[i].item.score;
      if (currScore !== prevScore) {
        currentRank = i + 1;
      }
    }
    rankedItems.push({
      ...withScore[i].item,
      rank: currentRank,
      originalIndex: withScore[i].originalIndex,
    });
  }

  // Tambahkan item tanpa skor (rank null)
  for (const entry of withoutScore) {
    rankedItems.push({
      ...entry.item,
      rank: null,
      originalIndex: entry.originalIndex,
    });
  }

  // Kembalikan ke urutan semula
  rankedItems.sort((a, b) => a.originalIndex - b.originalIndex);

  return rankedItems.map(({ originalIndex, ...rest }) => rest as T & { rank: number | null });
}

/**
 * Ekstraksi tingkat / jenjang / angkatan umum dari nama kelas.
 * Menangani berbagai variasi format penamaan kelas:
 * - "1b", "1B", "1-B", "1 B", "1.B", "1/B" -> "1"
 * - "2b", "2-C", "2 C" -> "2"
 * - "3-C", "3C", "3 C" -> "3"
 * - "4-B", "4B", "4 B", "4-M" -> "4"
 * - "5-A", "5B" -> "5"
 * - "6-A", "6B" -> "6"
 * - "Kelas 1B", "Kls 1-C", "Kelas 4" -> "1", "4"
 * - Angka Romawi: "I B", "IV-B", "VI" -> "1", "4", "6"
 * - Angka Arab: "١", "٤" -> "1", "4"
 */
export function extractTingkat(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';

  // Buang prefix seperti "Kelas", "Kls", "Class", "Tingkat", "Thabaqah"
  const clean = trimmed
    .replace(/^(kelas|kls|class|tingkat|thabaqah)\s*[:-]?\s*/i, '')
    .trim();

  // 1. Cek pola Intensif / Int (e.g. "1 Int B", "1-Int-B", "1Int", "1 Intensif B", "3 Int C", "3-Int-B", "I Int")
  const intMatch = clean.match(/^(\d+|XII|XI|X|IX|VIII|VII|VI|IV|V|III|II|I)[\s\-_.]*(int|intensif|intensive|maktsaf|مكثف)\b/i);
  if (intMatch) {
    let baseNum = intMatch[1];
    const rMap: Record<string, string> = {
      i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6',
      vii: '7', viii: '8', ix: '9', x: '10', xi: '11', xii: '12',
    };
    if (rMap[baseNum.toLowerCase()]) {
      baseNum = rMap[baseNum.toLowerCase()];
    }
    return `${baseNum} Int`;
  }

  // Cek jika kata int/intensif ada di dalam nama kelas setelah nomor (misal "1-B Int", "1 B (Intensif)")
  const postIntMatch = clean.match(/^(\d+)[\s\-_a-zA-Z0-9()]*\b(int|intensif|intensive)\b/i);
  if (postIntMatch) {
    return `${postIntMatch[1]} Int`;
  }

  // 2. Cek angka Arab Timur (١, ٢, ٣, ٤, ٥, ٦, dst)
  const arabicDigits: Record<string, string> = {
    '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6',
    '٧': '7', '٨': '8', '٩': '9',
  };
  if (arabicDigits[clean[0]]) {
    const isInt = /int|intensif|مكثف/i.test(clean);
    return isInt ? `${arabicDigits[clean[0]]} Int` : arabicDigits[clean[0]];
  }

  // 3. Cek angka romawi (I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII)
  const romanMatch = clean.match(/^(XII|XI|X|IX|VIII|VII|VI|IV|V|III|II|I)(?=[^a-zA-Z]|$)/i);
  if (romanMatch) {
    const rMap: Record<string, string> = {
      i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6',
      vii: '7', viii: '8', ix: '9', x: '10', xi: '11', xii: '12',
    };
    const val = rMap[romanMatch[1].toLowerCase()];
    if (val) return val;
  }

  // 4. Tangkap angka depan (misal "1b", "1-B", "1 B", "4-M", "10-A", "3")
  const digitMatch = clean.match(/^(\d+)/);
  if (digitMatch) {
    return digitMatch[1];
  }

  // Fallback: jika ada pemisah -, _, spasi, atau titik
  const token = clean.split(/[-_\s.]+/)[0];
  return token || clean;
}
