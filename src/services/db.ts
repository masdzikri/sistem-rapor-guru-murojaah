/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Guru,
  MataPelajaran,
  Kelas,
  PeriodeAkademik,
  PenugasanMengajar,
  NilaiEvaluasi,
  InstitutionSettings,
  TemplateRaporConfig,
  TemplateRekapConfig,
  ColumnWidthsRekap,
  HeaderRekapConfig,
  DocumentArchive,
} from '../types/index.ts';
import { calculateEvaluation, extractTingkat } from '../utils/calculations.ts';
import { getSubjectArabicName } from '../utils/arabic.ts';

const STORAGE_KEYS = {
  TEACHERS: 'rapor_guru_teachers',
  SUBJECTS: 'rapor_guru_subjects',
  CLASSES: 'rapor_guru_classes',
  PERIODS: 'rapor_guru_periods',
  ASSIGNMENTS: 'rapor_guru_assignments',
  EVALUATIONS: 'rapor_guru_evaluations',
  SETTINGS: 'rapor_guru_settings',
  TEMPLATE_RAPOR: 'rapor_guru_template_rapor',
  TEMPLATE_REKAP: 'rapor_guru_template_rekap',
  ARCHIVES: 'rapor_guru_archives',
};

// Default Institution Settings matching Reference 1
export const DEFAULT_SETTINGS: InstitutionSettings = {
  namaLembagaArab: 'معهد دار السلام كونتور للتربية الإسلامية الحديثة',
  namaKulliyahArab: 'كلية المعلمين الإسلامية',
  namaLembagaLatin: 'Pondok Modern Darussalam Gontor',
  judulRaporArab: 'قائمة نتائج المراجعة العامة للفصل الدراسي الثاني',
  tahunAkademikArab: 'عام: ١٤٤٨ / ٢٠٢٦',
  unitKerjaDefault: 'Perpustakaan UNIDA Kampus Rabithah',
  kotaSurat: 'Ponorogo',
  penandatanganNama: 'Al-Ustadz K.H. Hasan Abdullah Sahal',
  penandatanganJabatan: 'Pimpinan Pondok Modern Darussalam Gontor',
};

export const DEFAULT_TEMPLATE_RAPOR: TemplateRaporConfig = {
  paperSize: 'A5',
  fontFamilyArabic: "'Amiri', 'Noto Naskh Arabic', 'Traditional Arabic', serif",
  fontSizeTitle: 18,
  fontSizeBody: 11,
  borderStyle: 'single',
  borderWidth: 1.5,
  headerBgColor: '#a8a8a8',
  useArabicDigits: true,
  showWatermark: false,
  marginTopMm: 6,
  marginBottomMm: 6,
  marginLeftMm: 7,
  marginRightMm: 7,
  columnLabels: {
    no: 'الرقم',
    pelajaran: 'الدرس',
    kelas: 'الفصل',
    hasil: 'النتيجة',
  },
};

export const DEFAULT_COLUMN_WIDTHS: ColumnWidthsRekap = {
  no: 4,
  rank: 5.5,
  nama: 29,
  pelajaran: 11,
  kelas: 6,
  nilaiSebelumnya: 11.5,
  nilaiBerjalan: 11.5,
  selisih: 8.5,
  persentase: 6.5,
  tren: 6.5,
};

export const DEFAULT_HEADER_REKAP: HeaderRekapConfig = {
  showHeader: true,
  showLembaga: true,
  showJudul: true,
  customJudul: 'REKAPITULASI EVALUASI NILAI PENGAJAR',
  showPelajaran: true,
  showNamaArabMapel: true,
  showTingkat: true,
  showPeriode: true,
  showTanggal: true,
  showTotalKelas: true,
  showInfoMargin: false,
  customSubheader: '',
};

export const DEFAULT_TEMPLATE_REKAP: TemplateRekapConfig = {
  paperSize: 'A5',
  orientation: 'portrait',
  fontSize: 7.5,
  rowHeightMm: 1.2,
  marginTopMm: 5,
  marginBottomMm: 5,
  marginLeftMm: 6,
  marginRightMm: 6,
  columnWidths: DEFAULT_COLUMN_WIDTHS,
  header: DEFAULT_HEADER_REKAP,
  showRanking: true,
  showRankingSumber: true,
  showNilaiSebelumnya: true,
  showNilaiBerjalan: true,
  showSelisih: true,
  showPersentase: true,
  showTren: true,
  showStatistik: true,
  primarySort: 'rank',
  sortOrder: 'asc',
};

// Default Academic Period
export const DEFAULT_PERIOD: PeriodeAkademik = {
  id: 'period-1448-genap',
  nama: 'Semester 2 - 1448 / 2026',
  tahunAkademik: '1448 / 2026',
  semester: 'Semester 2 (Genap)',
  semesterArab: 'الفصل الدراسي الثاني',
  tahunArab: '١٤٤٨ / ٢٠٢٦',
  isAktif: true,
  isDefault: true,
};

// Event emitter for database reactivity
type ChangeListener = () => void;
const listeners = new Set<ChangeListener>();

export function subscribeDb(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in db subscriber', e);
    }
  });
}

// Storage helpers
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

// Initial Demo Data Generator
export function generateInitialData() {
  const periods: PeriodeAkademik[] = [DEFAULT_PERIOD];

  // Tingkat Classes (including distinct Reguler vs Intensif cohorts)
  const classes: Kelas[] = [
    // Tingkat 1 (Reguler)
    { id: 'c-1b', nama: '1-B', tingkat: '1', isActive: true },
    { id: 'c-1c', nama: '1-C', tingkat: '1', isActive: true },
    // Tingkat 1 Intensif (1 Int)
    { id: 'c-1int-b', nama: '1-Int-B', tingkat: '1 Int', isActive: true },
    { id: 'c-1int-c', nama: '1-Int-C', tingkat: '1 Int', isActive: true },
    // Tingkat 3 (Reguler)
    { id: 'c-3c', nama: '3-C', tingkat: '3', isActive: true },
    { id: 'c-3h', nama: '3-H', tingkat: '3', isActive: true },
    { id: 'c-3i', nama: '3-I', tingkat: '3', isActive: true },
    { id: 'c-3k', nama: '3-K', tingkat: '3', isActive: true },
    { id: 'c-3l', nama: '3-L', tingkat: '3', isActive: true },
    // Tingkat 3 Intensif (3 Int)
    { id: 'c-3int-b', nama: '3-Int-B', tingkat: '3 Int', isActive: true },
    { id: 'c-3int-c', nama: '3-Int-C', tingkat: '3 Int', isActive: true },
    // Tingkat 4 (from Reference Image 2)
    { id: 'c-4b', nama: '4-B', tingkat: '4', isActive: true },
    { id: 'c-4c', nama: '4-C', tingkat: '4', isActive: true },
    { id: 'c-4d', nama: '4-D', tingkat: '4', isActive: true },
    { id: 'c-4e', nama: '4-E', tingkat: '4', isActive: true },
    { id: 'c-4f', nama: '4-F', tingkat: '4', isActive: true },
    { id: 'c-4g', nama: '4-G', tingkat: '4', isActive: true },
    { id: 'c-4h', nama: '4-H', tingkat: '4', isActive: true },
    { id: 'c-4i', nama: '4-I', tingkat: '4', isActive: true },
    { id: 'c-4j', nama: '4-J', tingkat: '4', isActive: true },
    { id: 'c-4k', nama: '4-K', tingkat: '4', isActive: true },
    { id: 'c-4l', nama: '4-L', tingkat: '4', isActive: true },
    { id: 'c-4m', nama: '4-M', tingkat: '4', isActive: true },
  ];

  // Subjects
  const subjects: MataPelajaran[] = [
    { id: 's-shorof', kode: 'SRF', nama: 'Shorof', namaArab: 'الصرف', tingkatDef: '3', isActive: true },
    { id: 's-ushulfiqh', kode: 'UFQ', nama: 'Ushul Fiqh', namaArab: 'أصول الفقه', tingkatDef: '3', isActive: true },
    { id: 's-muthalaah', kode: 'MTL', nama: 'Muthala\'ah', namaArab: 'المطالعة', tingkatDef: '4', isActive: true },
    { id: 's-nahwu', kode: 'NHW', nama: 'Nahwu', namaArab: 'النحو', tingkatDef: '3', isActive: true },
    { id: 's-mahfuzhat', kode: 'MFZ', nama: 'Mahfuzhat', namaArab: 'المحفوظات', tingkatDef: '3', isActive: true },
  ];

  // Teachers
  const teachers: Guru[] = [
    // Multi-subject Teacher: Dimas
    {
      id: 'g-dimas',
      nip: '2001',
      nama: 'Dimas',
      namaArab: 'أ. ديماس',
      unitKerja: 'Perpustakaan UNIDA Kampus Rabithah',
      isActive: true,
      catatan: 'Pengajar multi-pelajaran: Shorof 3-H dan Ushul Fiqh 3-I',
      createdAt: '2026-01-10T08:00:00Z',
    },
    // Multi-subject Teacher: Ahmad
    {
      id: 'g-ahmad',
      nip: '2002',
      nama: 'Ahmad',
      namaArab: 'أ. أحمد',
      unitKerja: 'KMI Gontor',
      isActive: true,
      catatan: 'Pengajar multi-pelajaran: Shorof 3-C dan Ushul Fiqh 3-L',
      createdAt: '2026-01-10T08:00:00Z',
    },
    // Single-subject Teacher: Budi
    {
      id: 'g-budi',
      nip: '2003',
      nama: 'Budi',
      namaArab: 'أ. بودي',
      unitKerja: 'KMI Gontor',
      isActive: true,
      catatan: 'Pengajar Shorof 3-K',
      createdAt: '2026-01-10T08:00:00Z',
    },
    // Teachers from Image 2 (Muthala'ah Kelas 4)
    {
      id: 'g-ayus',
      nip: '1001',
      nama: 'Muhammad Ayus Sofi',
      namaArab: 'أ. محمد أيوس صوفي',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-wildan',
      nip: '1002',
      nama: 'Wildan Taqiyuddin, S.E.',
      namaArab: 'أ. ويلدان تقي الدين',
      unitKerja: 'Pengasuhan Santri',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-rifqi',
      nip: '1003',
      nama: 'Muhammad Rifqi Fachriyan',
      namaArab: 'أ. محمد رفقي فخريان',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-agung',
      nip: '1004',
      nama: 'Agung Wicaksono, S.I.kom.',
      namaArab: 'أ. أغونغ ويكاكسونو',
      unitKerja: 'Sekretariat Pimpinan',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-yusuf',
      nip: '1005',
      nama: 'Yusuf Zidane',
      namaArab: 'أ. يوسف زيدان',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-naufal',
      nip: '1006',
      nama: 'Naufal Fikri Setyawan',
      namaArab: 'أ. نوفل فكري سيتياوان',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-luthfi',
      nip: '1007',
      nama: 'Luthfi Nabhani Abdul Jalil',
      namaArab: 'أ. لطفي نبهاني عبد الجليل',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-bimo',
      nip: '1008',
      nama: 'Ahmad Bimo Wiranata Yahya',
      namaArab: 'أ. أحمد بيمو ويراناطا',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-abdurrahman',
      nip: '1009',
      nama: 'Abdurrahman Muhammad',
      namaArab: 'أ. عبد الرحمن محمد',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-tsabitul',
      nip: '1010',
      nama: 'Muhammad Naufal Tsabitul Azmi',
      namaArab: 'أ. محمد نوفل ثابت العزمي',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-azhar',
      nip: '1011',
      nama: 'Azhar Rizki Anggoro Sahputro',
      namaArab: 'أ. أزهر رزقي أنغورو',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'g-faiz',
      nip: '1012',
      nama: 'Mochammad Faiz Al Bahrain',
      namaArab: 'أ. محمد فائز البحرين',
      unitKerja: 'KMI Gontor',
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
  ];

  // Assignments & Evaluations
  const assignments: PenugasanMengajar[] = [];
  const evaluations: NilaiEvaluasi[] = [];

  const addAssignmentWithEval = (
    guruId: string,
    mapelId: string,
    kelasId: string,
    sebelumnya: number | null,
    berjalan: number | null,
    rankingSumber?: number
  ) => {
    const pId = `asg-${guruId}-${mapelId}-${kelasId}`;
    const asg: PenugasanMengajar = {
      id: pId,
      guruId,
      mataPelajaranId: mapelId,
      kelasId,
      periodeId: DEFAULT_PERIOD.id,
      status: 'aktif',
      createdAt: '2026-01-15T08:00:00Z',
    };
    assignments.push(asg);

    const calc = calculateEvaluation(sebelumnya, berjalan);
    const ev: NilaiEvaluasi = {
      id: `ev-${pId}`,
      penugasanId: pId,
      nilaiSebelumnya: sebelumnya,
      nilaiBerjalan: berjalan,
      selisih: calc.selisih,
      persentase: calc.persentase,
      tren: calc.tren,
      rankingSumber: rankingSumber ?? null,
      isLengkap: berjalan !== null,
      updatedAt: '2026-01-20T08:00:00Z',
    };
    evaluations.push(ev);
  };

  // 1. DIMAS: Must have 2 assignments
  // - Shorof 3-H
  // - Ushul Fiqh 3-I
  addAssignmentWithEval('g-dimas', 's-shorof', 'c-3h', 75.50, 82.30, 101);
  addAssignmentWithEval('g-dimas', 's-ushulfiqh', 'c-3i', 78.40, 74.10, 142);

  // 2. AHMAD: Shorof 3-C & Ushul Fiqh 3-L
  addAssignmentWithEval('g-ahmad', 's-shorof', 'c-3c', 70.20, 76.50, 88);
  addAssignmentWithEval('g-ahmad', 's-ushulfiqh', 'c-3l', 71.00, 73.50, 110);

  // 3. BUDI: Shorof 3-K
  addAssignmentWithEval('g-budi', 's-shorof', 'c-3k', 68.40, 69.10, 95);

  // 4. Muthala'ah Kelas 4 (From Reference Image 2 Table)
  // Row 1: Muhammad Ayus Sofi | 4-B | 80,68 | 73,23 | -7,45 | -9% | Turun | Rank 279
  addAssignmentWithEval('g-ayus', 's-muthalaah', 'c-4b', 80.68, 73.23, 279);
  // Row 2: Wildan Taqiyuddin, S.E. | 4-C | 77,82 | 66,67 | -11,15 | Turun | Rank 181
  addAssignmentWithEval('g-wildan', 's-muthalaah', 'c-4c', 77.82, 66.67, 181);
  // Row 3: Muhammad Rifqi Fachriyan | 4-D | 65,56 | 65,61 | 0,05 | 0% | Naik | Rank 292
  addAssignmentWithEval('g-rifqi', 's-muthalaah', 'c-4d', 65.56, 65.61, 292);
  // Row 4: Agung Wicaksono, S.I.kom. | 4-G | 60,13 | 62,34 | 2,22 | 4% | Naik | Rank 125
  addAssignmentWithEval('g-agung', 's-muthalaah', 'c-4g', 60.13, 62.34, 125);
  // Row 5: Yusuf Zidane | 4-H | 65,54 | 61,56 | -3,98 | -6% | Turun | Rank 356
  addAssignmentWithEval('g-yusuf', 's-muthalaah', 'c-4h', 65.54, 61.56, 356);
  // Row 6: Naufal Fikri Setyawan | 4-K | 72,70 | 60,78 | -11,92 | Turun | Rank 330
  addAssignmentWithEval('g-naufal', 's-muthalaah', 'c-4k', 72.70, 60.78, 330);
  // Row 7: Luthfi Nabhani Abdul Jalil | 4-L | 69,86 | 60,31 | -9,55 | Turun | Rank 364
  addAssignmentWithEval('g-luthfi', 's-muthalaah', 'c-4l', 69.86, 60.31, 364);
  // Row 8: Ahmad Bimo Wiranata Yahya | 4-E | 64,87 | 58,59 | -6,28 | Turun | Rank 349
  addAssignmentWithEval('g-bimo', 's-muthalaah', 'c-4e', 64.87, 58.59, 349);
  // Row 9: Abdurrahman Muhammad | 4-J | 61,84 | 51,76 | -10,08 | Turun | Rank 233
  addAssignmentWithEval('g-abdurrahman', 's-muthalaah', 'c-4j', 61.84, 51.76, 233);
  // Row 10: Muhammad Naufal Tsabitul Azmi | 4-F | 75,41 | 51,41 | -24,00 | Turun | Rank 307
  addAssignmentWithEval('g-tsabitul', 's-muthalaah', 'c-4f', 75.41, 51.41, 307);
  // Row 11: Azhar Rizki Anggoro Sahputro | 4-M | 62,30 | 50,13 | -12,17 | Turun | Rank 323
  addAssignmentWithEval('g-azhar', 's-muthalaah', 'c-4m', 62.30, 50.13, 323);
  // Row 12: Mochammad Faiz Al Bahrain | 4-I | 58,68 | 40,63 | -18,06 | Turun | Rank 340
  addAssignmentWithEval('g-faiz', 's-muthalaah', 'c-4i', 58.68, 40.63, 340);

  return {
    teachers,
    subjects,
    classes,
    periods,
    assignments,
    evaluations,
    settings: DEFAULT_SETTINGS,
    templateRapor: DEFAULT_TEMPLATE_RAPOR,
    templateRekap: DEFAULT_TEMPLATE_REKAP,
    archives: [] as DocumentArchive[],
  };
}

// Database Service Implementation
export const db = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
      const initial = generateInitialData();
      setStorage(STORAGE_KEYS.TEACHERS, initial.teachers);
      setStorage(STORAGE_KEYS.SUBJECTS, initial.subjects);
      setStorage(STORAGE_KEYS.CLASSES, initial.classes);
      setStorage(STORAGE_KEYS.PERIODS, initial.periods);
      setStorage(STORAGE_KEYS.ASSIGNMENTS, initial.assignments);
      setStorage(STORAGE_KEYS.EVALUATIONS, initial.evaluations);
      setStorage(STORAGE_KEYS.SETTINGS, initial.settings);
      setStorage(STORAGE_KEYS.TEMPLATE_RAPOR, initial.templateRapor);
      setStorage(STORAGE_KEYS.TEMPLATE_REKAP, initial.templateRekap);
      setStorage(STORAGE_KEYS.ARCHIVES, initial.archives);
    }
  },

  resetDemo() {
    const initial = generateInitialData();
    setStorage(STORAGE_KEYS.TEACHERS, initial.teachers);
    setStorage(STORAGE_KEYS.SUBJECTS, initial.subjects);
    setStorage(STORAGE_KEYS.CLASSES, initial.classes);
    setStorage(STORAGE_KEYS.PERIODS, initial.periods);
    setStorage(STORAGE_KEYS.ASSIGNMENTS, initial.assignments);
    setStorage(STORAGE_KEYS.EVALUATIONS, initial.evaluations);
    setStorage(STORAGE_KEYS.SETTINGS, initial.settings);
    setStorage(STORAGE_KEYS.TEMPLATE_RAPOR, initial.templateRapor);
    setStorage(STORAGE_KEYS.TEMPLATE_REKAP, initial.templateRekap);
    notifyChange();
  },

  clearAll() {
    setStorage(STORAGE_KEYS.TEACHERS, []);
    setStorage(STORAGE_KEYS.SUBJECTS, []);
    setStorage(STORAGE_KEYS.CLASSES, []);
    setStorage(STORAGE_KEYS.ASSIGNMENTS, []);
    setStorage(STORAGE_KEYS.EVALUATIONS, []);
    setStorage(STORAGE_KEYS.ARCHIVES, []);
    notifyChange();
  },

  // 1. Teachers (Guru)
  getTeachers(): Guru[] {
    return getStorage<Guru[]>(STORAGE_KEYS.TEACHERS, []);
  },
  getTeacher(id: string): Guru | undefined {
    return this.getTeachers().find((g) => g.id === id);
  },
  saveTeacher(teacher: Guru): void {
    const list = this.getTeachers();
    const idx = list.findIndex((g) => g.id === teacher.id);
    if (idx >= 0) {
      list[idx] = teacher;
    } else {
      list.push(teacher);
    }
    setStorage(STORAGE_KEYS.TEACHERS, list);
    notifyChange();
  },
  deleteTeacher(id: string): void {
    const list = this.getTeachers().filter((g) => g.id !== id);
    setStorage(STORAGE_KEYS.TEACHERS, list);
    // Also remove associated assignments
    const assignments = this.getAssignments().filter((a) => a.guruId !== id);
    setStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
    notifyChange();
  },

  // 2. Subjects (Mata Pelajaran)
  getSubjects(): MataPelajaran[] {
    const list = getStorage<MataPelajaran[]>(STORAGE_KEYS.SUBJECTS, []);
    let modified = false;
    const enriched = list.map((s) => {
      if (!s.namaArab || s.namaArab.trim() === '') {
        const arab = getSubjectArabicName(s.nama);
        if (arab && arab !== s.nama) {
          modified = true;
          return { ...s, namaArab: arab };
        }
      }
      return s;
    });
    if (modified) {
      setStorage(STORAGE_KEYS.SUBJECTS, enriched);
    }
    return enriched;
  },
  getSubject(id: string): MataPelajaran | undefined {
    return this.getSubjects().find((s) => s.id === id);
  },
  saveSubject(subject: MataPelajaran): void {
    const list = this.getSubjects();
    const idx = list.findIndex((s) => s.id === subject.id);
    if (idx >= 0) {
      list[idx] = subject;
    } else {
      list.push(subject);
    }
    setStorage(STORAGE_KEYS.SUBJECTS, list);
    notifyChange();
  },
  deleteSubject(id: string): void {
    const list = this.getSubjects().filter((s) => s.id !== id);
    setStorage(STORAGE_KEYS.SUBJECTS, list);
    notifyChange();
  },

  // 3. Classes (Kelas)
  getClasses(): Kelas[] {
    const raw = getStorage<Kelas[]>(STORAGE_KEYS.CLASSES, []);
    let changed = false;
    const normalized = raw.map((c) => {
      const properTingkat = extractTingkat(c.nama || c.tingkat);
      if (properTingkat && c.tingkat !== properTingkat) {
        changed = true;
        return { ...c, tingkat: properTingkat };
      }
      return c;
    });
    if (changed) {
      setStorage(STORAGE_KEYS.CLASSES, normalized);
    }
    return normalized;
  },
  getClass(id: string): Kelas | undefined {
    return this.getClasses().find((c) => c.id === id);
  },
  saveClass(kelas: Kelas): void {
    const list = this.getClasses();
    const properKelas = {
      ...kelas,
      tingkat: extractTingkat(kelas.tingkat || kelas.nama) || kelas.tingkat || '1',
    };
    const idx = list.findIndex((c) => c.id === properKelas.id);
    if (idx >= 0) {
      list[idx] = properKelas;
    } else {
      list.push(properKelas);
    }
    setStorage(STORAGE_KEYS.CLASSES, list);
    notifyChange();
  },
  deleteClass(id: string): void {
    const list = this.getClasses().filter((c) => c.id !== id);
    setStorage(STORAGE_KEYS.CLASSES, list);
    notifyChange();
  },

  // 4. Periods (Periode Akademik)
  getPeriods(): PeriodeAkademik[] {
    return getStorage<PeriodeAkademik[]>(STORAGE_KEYS.PERIODS, [DEFAULT_PERIOD]);
  },
  getActivePeriod(): PeriodeAkademik {
    const list = this.getPeriods();
    return list.find((p) => p.isAktif) || list[0] || DEFAULT_PERIOD;
  },
  savePeriod(period: PeriodeAkademik): void {
    const list = this.getPeriods();
    const idx = list.findIndex((p) => p.id === period.id);
    if (idx >= 0) {
      list[idx] = period;
    } else {
      list.push(period);
    }
    setStorage(STORAGE_KEYS.PERIODS, list);
    notifyChange();
  },

  // 5. Assignments (Penugasan Mengajar)
  getAssignments(): PenugasanMengajar[] {
    return getStorage<PenugasanMengajar[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  },
  getAssignment(id: string): PenugasanMengajar | undefined {
    return this.getAssignments().find((a) => a.id === id);
  },
  saveAssignment(asg: PenugasanMengajar): { success: boolean; message?: string } {
    const list = this.getAssignments();
    // Unique check: guru + mapel + kelas + periode
    const duplicate = list.find(
      (a) =>
        a.id !== asg.id &&
        a.guruId === asg.guruId &&
        a.mataPelajaranId === asg.mataPelajaranId &&
        a.kelasId === asg.kelasId &&
        a.periodeId === asg.periodeId
    );
    if (duplicate) {
      return {
        success: false,
        message: 'Penugasan untuk kombinasi Guru, Mata Pelajaran, Kelas, dan Periode ini sudah ada.',
      };
    }

    const idx = list.findIndex((a) => a.id === asg.id);
    if (idx >= 0) {
      list[idx] = asg;
    } else {
      list.push(asg);
    }
    setStorage(STORAGE_KEYS.ASSIGNMENTS, list);
    notifyChange();
    return { success: true };
  },
  deleteAssignment(id: string): void {
    const list = this.getAssignments().filter((a) => a.id !== id);
    setStorage(STORAGE_KEYS.ASSIGNMENTS, list);
    // Remove related evaluation
    const evaluations = this.getEvaluations().filter((e) => e.penugasanId !== id);
    setStorage(STORAGE_KEYS.EVALUATIONS, evaluations);
    notifyChange();
  },

  // 6. Evaluations (Nilai Evaluasi)
  getEvaluations(): NilaiEvaluasi[] {
    return getStorage<NilaiEvaluasi[]>(STORAGE_KEYS.EVALUATIONS, []);
  },
  getEvaluationByAssignment(penugasanId: string): NilaiEvaluasi | undefined {
    return this.getEvaluations().find((e) => e.penugasanId === penugasanId);
  },
  saveEvaluation(ev: NilaiEvaluasi): void {
    const list = this.getEvaluations();
    const idx = list.findIndex((e) => e.id === ev.id || e.penugasanId === ev.penugasanId);
    if (idx >= 0) {
      list[idx] = { ...ev, updatedAt: new Date().toISOString() };
    } else {
      list.push({ ...ev, updatedAt: new Date().toISOString() });
    }
    setStorage(STORAGE_KEYS.EVALUATIONS, list);
    notifyChange();
  },

  // Query: Get all assignments for a specific teacher in a period (Crucial for Individual Report)
  getTeacherAssignmentsWithDetails(guruId: string, periodeId: string) {
    const assignments = this.getAssignments().filter(
      (a) => a.guruId === guruId && a.periodeId === periodeId
    );
    const subjects = this.getSubjects();
    const classes = this.getClasses();
    const evaluations = this.getEvaluations();
    const teacher = this.getTeacher(guruId);

    return assignments.map((asg) => ({
      penugasan: asg,
      guru: teacher,
      mataPelajaran: subjects.find((s) => s.id === asg.mataPelajaranId) || {
        id: asg.mataPelajaranId,
        nama: 'Mata Pelajaran Tidak Ditemukan',
        isActive: false,
      },
      kelas: classes.find((c) => c.id === asg.kelasId) || {
        id: asg.kelasId,
        nama: 'Kelas Tidak Ditemukan',
        tingkat: '',
        isActive: false,
      },
      nilai: evaluations.find((e) => e.penugasanId === asg.id) || null,
    }));
  },

  // Query: Get all assignments for a subject & tingkat in a period (Crucial for Subject Recap)
  getSubjectRecapWithDetails(mapelId: string, tingkat: string | string[], periodeId: string) {
    const allAssignments = this.getAssignments().filter(
      (a) => a.mataPelajaranId === mapelId && a.periodeId === periodeId
    );
    const teachers = this.getTeachers();
    const subjects = this.getSubjects();
    const classes = this.getClasses();
    const evaluations = this.getEvaluations();

    const subject = subjects.find((s) => s.id === mapelId);

    // Filter by class tingkat / angkatan / custom multi-select if specified
    const matchingAssignments = allAssignments.filter((asg) => {
      const cls = classes.find((c) => c.id === asg.kelasId);
      if (!cls) return false;
      if (!tingkat || tingkat === 'all') return true;

      // Multi-class filter: array of class IDs
      if (Array.isArray(tingkat)) {
        return tingkat.includes(cls.id) || tingkat.includes(cls.nama);
      }

      // Multi-class filter: "custom:id1,id2,..."
      if (tingkat.startsWith('custom:')) {
        const targetIds = tingkat.replace('custom:', '').split(',').map((s) => s.trim()).filter(Boolean);
        return targetIds.includes(cls.id) || targetIds.includes(cls.nama);
      }

      // Specific single class filter e.g. "class:c-1b"
      if (tingkat.startsWith('class:')) {
        const targetId = tingkat.replace('class:', '');
        return cls.id === targetId || cls.nama.toLowerCase() === targetId.toLowerCase();
      }

      // Cohort / Angkatan filter (e.g. "1", "1 Int", "2", "3", "3 Int", "4", "5", "6")
      const clsAngkatan = extractTingkat(cls.nama || cls.tingkat);
      if (clsAngkatan && clsAngkatan.toLowerCase() === tingkat.toLowerCase()) {
        return true;
      }

      return (
        cls.tingkat.toLowerCase() === tingkat.toLowerCase() ||
        cls.nama.toLowerCase() === tingkat.toLowerCase()
      );
    });

    return matchingAssignments.map((asg) => ({
      penugasan: asg,
      mataPelajaran: subject || {
        id: mapelId,
        nama: 'Mata Pelajaran Tidak Ditemukan',
        isActive: false,
      },
      guru: teachers.find((g) => g.id === asg.guruId) || {
        id: asg.guruId,
        nip: '',
        nama: 'Pengajar Tidak Ditemukan',
        isActive: false,
        createdAt: '',
      },
      kelas: classes.find((c) => c.id === asg.kelasId) || {
        id: asg.kelasId,
        nama: 'Kelas',
        tingkat: '',
        isActive: false,
      },
      nilai: evaluations.find((e) => e.penugasanId === asg.id) || null,
    }));
  },

  // 7. Settings & Templates
  getSettings(): InstitutionSettings {
    const s = getStorage<InstitutionSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (s.tahunAkademikArab && s.tahunAkademikArab.includes('العام:')) {
      s.tahunAkademikArab = s.tahunAkademikArab.replace('العام:', 'عام:');
      setStorage(STORAGE_KEYS.SETTINGS, s);
    }
    return s;
  },
  saveSettings(settings: InstitutionSettings): void {
    setStorage(STORAGE_KEYS.SETTINGS, settings);
    notifyChange();
  },
  getTemplateRapor(): TemplateRaporConfig {
    const stored = getStorage<TemplateRaporConfig>(STORAGE_KEYS.TEMPLATE_RAPOR, DEFAULT_TEMPLATE_RAPOR);
    if (!stored.paperSize || stored.fontSizeTitle < 16) {
      const upgraded: TemplateRaporConfig = {
        ...DEFAULT_TEMPLATE_RAPOR,
        ...stored,
        paperSize: 'A5',
        fontSizeTitle: 18,
        fontSizeBody: 11,
        headerBgColor: '#a8a8a8',
        borderWidth: 1.5,
        marginTopMm: 6,
        marginBottomMm: 6,
        marginLeftMm: 7,
        marginRightMm: 7,
      };
      setStorage(STORAGE_KEYS.TEMPLATE_RAPOR, upgraded);
      return upgraded;
    }
    return stored;
  },
  saveTemplateRapor(template: TemplateRaporConfig): void {
    setStorage(STORAGE_KEYS.TEMPLATE_RAPOR, template);
    notifyChange();
  },
  getTemplateRekap(): TemplateRekapConfig {
    const stored = getStorage<TemplateRekapConfig>(STORAGE_KEYS.TEMPLATE_REKAP, DEFAULT_TEMPLATE_REKAP);
    const upgraded: TemplateRekapConfig = {
      ...DEFAULT_TEMPLATE_REKAP,
      ...stored,
      paperSize: 'A5',
      orientation: stored.orientation || 'portrait',
      fontSize: stored.fontSize && stored.fontSize <= 10 ? stored.fontSize : 7.5,
      rowHeightMm: stored.rowHeightMm ?? 1.2,
      marginTopMm: stored.marginTopMm ?? 5,
      marginBottomMm: stored.marginBottomMm ?? 5,
      marginLeftMm: stored.marginLeftMm ?? 6,
      marginRightMm: stored.marginRightMm ?? 6,
      columnWidths: {
        ...DEFAULT_COLUMN_WIDTHS,
        ...(stored.columnWidths || {}),
      },
      header: {
        ...DEFAULT_HEADER_REKAP,
        ...(stored.header || {}),
      },
    };
    return upgraded;
  },
  saveTemplateRekap(template: TemplateRekapConfig): void {
    setStorage(STORAGE_KEYS.TEMPLATE_REKAP, template);
    notifyChange();
  },

  // 8. Document Archives
  getArchives(): DocumentArchive[] {
    return getStorage<DocumentArchive[]>(STORAGE_KEYS.ARCHIVES, []);
  },
  getArchive(id: string): DocumentArchive | undefined {
    return this.getArchives().find((a) => a.id === id);
  },
  saveArchive(doc: DocumentArchive): void {
    const list = this.getArchives();
    const idx = list.findIndex((a) => a.id === doc.id);
    if (idx >= 0) {
      list[idx] = doc;
    } else {
      list.unshift(doc);
    }
    setStorage(STORAGE_KEYS.ARCHIVES, list);
    notifyChange();
  },
  deleteArchive(id: string): void {
    const list = this.getArchives().filter((a) => a.id !== id);
    setStorage(STORAGE_KEYS.ARCHIVES, list);
    notifyChange();
  },

  // 9. Full Backup & Restore
  exportBackup(): string {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      teachers: this.getTeachers(),
      subjects: this.getSubjects(),
      classes: this.getClasses(),
      periods: this.getPeriods(),
      assignments: this.getAssignments(),
      evaluations: this.getEvaluations(),
      settings: this.getSettings(),
      templateRapor: this.getTemplateRapor(),
      templateRekap: this.getTemplateRekap(),
      archives: this.getArchives(),
    };
    return JSON.stringify(data, null, 2);
  },

  restoreBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.teachers || !data.assignments || !data.subjects) {
        return { success: false, message: 'Format file backup tidak valid.' };
      }
      setStorage(STORAGE_KEYS.TEACHERS, data.teachers || []);
      setStorage(STORAGE_KEYS.SUBJECTS, data.subjects || []);
      setStorage(STORAGE_KEYS.CLASSES, data.classes || []);
      setStorage(STORAGE_KEYS.PERIODS, data.periods || [DEFAULT_PERIOD]);
      setStorage(STORAGE_KEYS.ASSIGNMENTS, data.assignments || []);
      setStorage(STORAGE_KEYS.EVALUATIONS, data.evaluations || []);
      if (data.settings) setStorage(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.templateRapor) setStorage(STORAGE_KEYS.TEMPLATE_RAPOR, data.templateRapor);
      if (data.templateRekap) setStorage(STORAGE_KEYS.TEMPLATE_REKAP, data.templateRekap);
      if (data.archives) setStorage(STORAGE_KEYS.ARCHIVES, data.archives);

      notifyChange();
      return { success: true, message: 'Data cadangan berhasil dipulihkan.' };
    } catch (e: unknown) {
      return {
        success: false,
        message: 'Gagal membaca file backup: ' + (e instanceof Error ? e.message : String(e)),
      };
    }
  },
};

// Initialize DB on import
db.init();
