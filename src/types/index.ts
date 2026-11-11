/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Guru {
  id: string;
  nip: string; // Nomor induk / referensi guru (bisa leading zero)
  nama: string; // Nama lengkap Latin (e.g. Al-Ustadz Dimas, Wildan Taqiyuddin, S.E.)
  namaArab?: string; // Nama dalam aksara Arab jika tersedia
  unitKerja?: string; // e.g. Perpustakaan UNIDA Kampus Rabithah, KMI Gontor
  isActive: boolean;
  catatan?: string;
  createdAt: string;
}

export interface MataPelajaran {
  id: string;
  kode?: string;
  nama: string; // e.g. Shorof, Ushul Fiqh, Muthala'ah, Nahwu
  namaArab?: string; // e.g. الصرف, أصول الفقه, المطالعة
  tingkatDef?: string; // e.g. "3", "4"
  isActive: boolean;
}

export interface Kelas {
  id: string;
  nama: string; // e.g. 3-C, 3-H, 3-I, 3-K, 4-B, 4-C
  tingkat: string; // e.g. "3", "4", "5", "6"
  isActive: boolean;
}

export interface PeriodeAkademik {
  id: string;
  nama: string; // e.g. "Semester 2 - 1448 / 2026"
  tahunAkademik: string; // e.g. "1448 / 2026"
  semester: string; // e.g. "Semester 2 (Genap)"
  semesterArab: string; // e.g. "الفصل الدراسي الثاني"
  tahunArab: string; // e.g. "١٤٤٨ / ٢٠٢٦"
  isAktif: boolean;
  isDefault: boolean;
}

export interface PenugasanMengajar {
  id: string;
  guruId: string;
  mataPelajaranId: string;
  kelasId: string;
  periodeId: string;
  status: 'aktif' | 'selesai' | 'nonaktif';
  catatan?: string;
  createdAt: string;
}

export type TrenNilai = 'Naik' | 'Turun' | 'Tetap' | 'Belum Lengkap';

export interface NilaiEvaluasi {
  id: string;
  penugasanId: string;
  nilaiSebelumnya: number | null; // e.g. 80.68
  nilaiBerjalan: number | null; // e.g. 73.23
  selisih: number | null; // e.g. -7.45
  persentase: number | null; // e.g. -9.23 (%)
  tren: TrenNilai;
  ranking?: number | null; // Peringkat dalam kelompok rekap
  rankingSumber?: number | null; // Nilai ranking resmi dari sheet (e.g. 279, 181)
  komponenEvaluasi?: string;
  catatan?: string;
  isLengkap: boolean;
  updatedAt: string;
}

export interface InstitutionSettings {
  namaLembagaArab: string; // e.g. "معهد دار السلام كونتور للتربية الإسلامية الحديثة"
  namaKulliyahArab: string; // e.g. "كلية المعلمين الإسلامية"
  namaLembagaLatin: string;
  judulRaporArab: string; // e.g. "قائمة نتائج المراجعة العامة للفصل الدراسي الثاني"
  tahunAkademikArab: string; // e.g. "العام: ١٤٤٨ / ٢٠٢٦"
  unitKerjaDefault: string; // e.g. "Perpustakaan UNIDA Kampus Rabithah"
  kotaSurat: string;
  penandatanganNama: string;
  penandatanganJabatan: string;
  logoUrl?: string;
}

export interface TemplateRaporConfig {
  paperSize: 'A5' | 'A4';
  fontFamilyArabic: string;
  fontSizeTitle: number; // pt
  fontSizeBody: number; // pt
  borderStyle: 'double' | 'single';
  borderWidth: number; // px
  headerBgColor: string; // hex
  useArabicDigits: boolean; // ١, ٢, ٣ instead of 1, 2, 3
  showWatermark: boolean;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  columnLabels: {
    no: string;
    pelajaran: string;
    kelas: string;
    hasil: string;
  };
}

export interface ColumnWidthsRekap {
  no?: number;
  rank?: number;
  nama?: number;
  pelajaran?: number;
  kelas?: number;
  nilaiSebelumnya?: number;
  nilaiBerjalan?: number;
  selisih?: number;
  persentase?: number;
  tren?: number;
}

export interface HeaderRekapConfig {
  showHeader?: boolean;
  showLembaga?: boolean;
  showJudul?: boolean;
  customJudul?: string;
  showPelajaran?: boolean;
  showNamaArabMapel?: boolean;
  showTingkat?: boolean;
  showPeriode?: boolean;
  showTanggal?: boolean;
  showTotalKelas?: boolean;
  showInfoMargin?: boolean;
  customSubheader?: string;
}

export interface TemplateRekapConfig {
  paperSize?: 'A5' | 'A4';
  orientation: 'landscape' | 'portrait';
  fontSize: number; // pt
  rowHeightMm?: number; // mm tinggi/bantalan baris tabel
  marginTopMm?: number;
  marginBottomMm?: number;
  marginLeftMm?: number;
  marginRightMm?: number;
  columnWidths?: ColumnWidthsRekap;
  header?: HeaderRekapConfig;
  showRanking: boolean;
  showRankingSumber: boolean;
  showNilaiSebelumnya: boolean;
  showNilaiBerjalan: boolean;
  showSelisih: boolean;
  showPersentase: boolean;
  showTren: boolean;
  showStatistik: boolean;
  primarySort: 'rank' | 'nama' | 'kelas' | 'nilaiBerjalan' | 'selisih';
  sortOrder: 'asc' | 'desc';
}

export interface DocumentArchive {
  id: string;
  tipe: 'rapor_individual' | 'rekap_mata_pelajaran';
  judul: string;
  periodeId: string;
  guruId?: string;
  mataPelajaranId?: string;
  tingkat?: string;
  tanggalDibuat: string;
  versi: number;
  status: 'diterbitkan' | 'direvisi' | 'draft';
  catatan?: string;
  // Frozen snapshot at the time of publication
  snapshotData: {
    institution: InstitutionSettings;
    periode: PeriodeAkademik;
    guru?: Guru;
    penugasanList: Array<{
      penugasan: PenugasanMengajar;
      mataPelajaran: MataPelajaran;
      kelas: Kelas;
      nilai: NilaiEvaluasi | null;
      guru?: Guru;
    }>;
    metaExtra?: Record<string, unknown>;
  };
}

export interface ImportPreviewRow {
  rowNumber: number;
  raw: Record<string, unknown>;
  namaGuru: string;
  nipGuru?: string;
  namaArabGuru?: string;
  unitKerja?: string;
  mataPelajaran: string;
  kelas: string;
  nilaiSebelumnya: number | null;
  nilaiBerjalan: number | null;
  selisih?: number | null;
  persentase?: number | null;
  rankingSumber?: number | null;
  isValid: boolean;
  errors: string[];
  matchedGuruId?: string;
  matchedMapelId?: string;
  matchedKelasId?: string;
  isExistingAssignment?: boolean;
}
