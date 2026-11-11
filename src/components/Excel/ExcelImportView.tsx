/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  RefreshCw,
  Info,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db.ts';
import {
  readExcelFile,
  SheetData,
  generateSampleExcelTemplate,
} from '../../utils/excel.ts';
import { parseSafeNumber, calculateEvaluation, extractTingkat } from '../../utils/calculations.ts';
import { Guru, Kelas, MataPelajaran, PenugasanMengajar, NilaiEvaluasi } from '../../types/index.ts';
import { ImportGuide } from './ImportGuide.tsx';

interface ColumnMapping {
  namaGuru: string;
  nip: string;
  pelajaran: string;
  kelas: string;
  nilaiSebelumnya: string;
  nilaiBerjalan: string;
  selisih: string;
  persentase: string;
  rank: string;
  unitKerja: string;
}

export const ExcelImportView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'completed'>('upload');
  const [showGuideModal, setShowGuideModal] = useState(false);

  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    namaGuru: '',
    nip: '',
    pelajaran: '',
    kelas: '',
    nilaiSebelumnya: '',
    nilaiBerjalan: '',
    selisih: '',
    persentase: '',
    rank: '',
    unitKerja: '',
  });

  const [importMode, setImportMode] = useState<'append' | 'update' | 'replace'>('append');
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    validRows: number;
    newTeachers: number;
    matchedTeachers: number;
    newAssignments: number;
    updatedAssignments: number;
    errors: string[];
  }>({
    totalRows: 0,
    validRows: 0,
    newTeachers: 0,
    matchedTeachers: 0,
    newAssignments: 0,
    updatedAssignments: 0,
    errors: [],
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePeriod = db.getActivePeriod();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploadedFile = files[0];
    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const readSheets = await readExcelFile(uploadedFile);
      setSheets(readSheets);
      if (readSheets.length > 0) {
        setSelectedSheetIndex(0);
        autoDetectMapping(readSheets[0].headers);
        setStep('mapping');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file Excel. Pastikan file berformat .xlsx atau .xls yang valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const autoDetectMapping = (headers: string[]) => {
    const mapping: ColumnMapping = {
      namaGuru: '',
      nip: '',
      pelajaran: '',
      kelas: '',
      nilaiSebelumnya: '',
      nilaiBerjalan: '',
      selisih: '',
      persentase: '',
      rank: '',
      unitKerja: '',
    };

    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    headers.forEach((h) => {
      const c = clean(h);
      if (c.includes('guru') || c.includes('pengajar') || c.includes('nama')) {
        if (!mapping.namaGuru) mapping.namaGuru = h;
      }
      if (c.includes('nip') || c.includes('nomorinduk') || c.includes('nik') || c.includes('id')) {
        if (!mapping.nip) mapping.nip = h;
      }
      if (c.includes('pelajaran') || c.includes('mapel') || c.includes('matapelajaran')) {
        if (!mapping.pelajaran) mapping.pelajaran = h;
      }
      if (c.includes('kelas') || c.includes('kelompok') || c.includes('ruang')) {
        if (!mapping.kelas) mapping.kelas = h;
      }
      if (
        (c.includes('rata') && (c.includes('sebelum') || c.includes('lalu') || c.includes('2025') || c.includes('2024') || c.includes('1'))) ||
        c.includes('nilailalu')
      ) {
        if (!c.includes('2026')) {
          if (!mapping.nilaiSebelumnya) mapping.nilaiSebelumnya = h;
        }
      }
      if (
        (c.includes('rata') && (c.includes('berjalan') || c.includes('sekarang') || c.includes('2026') || c.includes('2'))) ||
        c.includes('nilaiberjalan')
      ) {
        if (!mapping.nilaiBerjalan) mapping.nilaiBerjalan = h;
      }
      if (c.includes('selisih') || c.includes('beda') || c.includes('diff')) {
        if (!mapping.selisih) mapping.selisih = h;
      }
      if (c.includes('persen') || c.includes('%')) {
        if (!mapping.persentase) mapping.persentase = h;
      }
      if (c.includes('rank') || c.includes('peringkat') || c.includes('urutan')) {
        if (!mapping.rank) mapping.rank = h;
      }
      if (c.includes('unit') || c.includes('bagian') || c.includes('tugas') || c.includes('kantor')) {
        if (!mapping.unitKerja) mapping.unitKerja = h;
      }
    });

    setColumnMapping(mapping);
  };

  const handleSheetChange = (idx: number) => {
    setSelectedSheetIndex(idx);
    if (sheets[idx]) {
      autoDetectMapping(sheets[idx].headers);
    }
  };

  const currentSheet = sheets[selectedSheetIndex];

  // Process rows for preview & validation
  const validateAndPrepareRows = () => {
    if (!currentSheet || !columnMapping.namaGuru || !columnMapping.pelajaran || !columnMapping.kelas) {
      alert('Kolom Nama Guru, Pelajaran, dan Kelas wajib dipetakan!');
      return;
    }

    const existingTeachers = db.getTeachers();
    const existingAssignments = db.getAssignments().filter((a) => a.periodeId === activePeriod.id);

    let newTeachersCount = 0;
    let matchedTeachersCount = 0;
    let newAssignmentsCount = 0;
    let updatedAssignmentsCount = 0;
    let validCount = 0;
    const errors: string[] = [];

    const teacherNamesSeenInFile = new Set<string>();

    currentSheet.data.forEach((row, index) => {
      const nama = String(row[columnMapping.namaGuru] || '').trim();
      const mapel = String(row[columnMapping.pelajaran] || '').trim();
      const kelas = String(row[columnMapping.kelas] || '').trim();

      if (!nama || !mapel || !kelas) {
        errors.push(`Baris ${index + 2}: Nama guru, mata pelajaran, atau kelas kosong.`);
        return;
      }

      validCount++;

      // Check teacher
      const matchedTeacher = existingTeachers.find(
        (t) => t.nama.toLowerCase() === nama.toLowerCase()
      );

      if (matchedTeacher) {
        matchedTeachersCount++;
      } else if (!teacherNamesSeenInFile.has(nama.toLowerCase())) {
        newTeachersCount++;
        teacherNamesSeenInFile.add(nama.toLowerCase());
      }

      // Check assignment
      const isExistingAsg = existingAssignments.some((a) => {
        const t = existingTeachers.find((x) => x.id === a.guruId);
        const m = db.getSubject(a.mataPelajaranId);
        const c = db.getClass(a.kelasId);
        return (
          t?.nama.toLowerCase() === nama.toLowerCase() &&
          m?.nama.toLowerCase() === mapel.toLowerCase() &&
          c?.nama.toLowerCase() === kelas.toLowerCase()
        );
      });

      if (isExistingAsg) {
        updatedAssignmentsCount++;
      } else {
        newAssignmentsCount++;
      }
    });

    setImportSummary({
      totalRows: currentSheet.data.length,
      validRows: validCount,
      newTeachers: newTeachersCount,
      matchedTeachers: matchedTeachersCount,
      newAssignments: newAssignmentsCount,
      updatedAssignments: updatedAssignmentsCount,
      errors,
    });

    setStep('preview');
  };

  const handleExecuteImport = () => {
    if (!currentSheet) return;
    setIsProcessing(true);

    try {
      const existingTeachers = db.getTeachers();
      const existingSubjects = db.getSubjects();
      const existingClasses = db.getClasses();
      const existingAssignments = db.getAssignments();

      if (importMode === 'replace') {
        const remainingAssignments = existingAssignments.filter((a) => a.periodeId !== activePeriod.id);
        const remainingEvaluations = db.getEvaluations().filter((e) => {
          const asg = existingAssignments.find((a) => a.id === e.penugasanId);
          return asg && asg.periodeId !== activePeriod.id;
        });
        localStorage.setItem('rapor_guru_assignments', JSON.stringify(remainingAssignments));
        localStorage.setItem('rapor_guru_evaluations', JSON.stringify(remainingEvaluations));
      }

      // Simpan data baris per baris
      currentSheet.data.forEach((row, index) => {
        const rawNama = String(row[columnMapping.namaGuru] || '').trim();
        const rawNip = columnMapping.nip ? String(row[columnMapping.nip] || '').trim() : '';
        const rawMapel = String(row[columnMapping.pelajaran] || '').trim();
        const rawKelas = String(row[columnMapping.kelas] || '').trim();
        const rawUnitKerja = columnMapping.unitKerja ? String(row[columnMapping.unitKerja] || '').trim() : '';

        if (!rawNama || !rawMapel || !rawKelas) return;

        // 1. Identifikasi atau Buat Guru
        let teacher = existingTeachers.find(
          (t) =>
            (rawNip && t.nip === rawNip) ||
            t.nama.toLowerCase() === rawNama.toLowerCase()
        );

        if (!teacher) {
          teacher = {
            id: `g-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            nip: rawNip || String(1000 + existingTeachers.length + index),
            nama: rawNama,
            unitKerja: rawUnitKerja || 'KMI Gontor',
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          existingTeachers.push(teacher);
          db.saveTeacher(teacher);
        } else if (rawUnitKerja && !teacher.unitKerja) {
          teacher.unitKerja = rawUnitKerja;
          db.saveTeacher(teacher);
        }

        // 2. Identifikasi atau Buat Mata Pelajaran
        let subject = existingSubjects.find(
          (s) => s.nama.toLowerCase() === rawMapel.toLowerCase()
        );
        if (!subject) {
          subject = {
            id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            nama: rawMapel,
            tingkatDef: extractTingkat(rawKelas) || '1',
            isActive: true,
          };
          existingSubjects.push(subject);
          db.saveSubject(subject);
        }

        // 3. Identifikasi atau Buat Kelas dengan Jenjang Angkatan yang Tepat
        let cls = existingClasses.find(
          (c) => c.nama.toLowerCase() === rawKelas.toLowerCase()
        );
        if (!cls) {
          const tingkat = extractTingkat(rawKelas) || '1';
          cls = {
            id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            nama: rawKelas,
            tingkat,
            isActive: true,
          };
          existingClasses.push(cls);
          db.saveClass(cls);
        } else {
          const properTingkat = extractTingkat(cls.nama || cls.tingkat);
          if (properTingkat && cls.tingkat !== properTingkat) {
            cls.tingkat = properTingkat;
            db.saveClass(cls);
          }
        }

        // 4. Identifikasi atau Buat Penugasan (Unique key: teacher + mapel + class + period)
        const assignmentsNow = db.getAssignments();
        let asg = assignmentsNow.find(
          (a) =>
            a.guruId === teacher.id &&
            a.mataPelajaranId === subject.id &&
            a.kelasId === cls.id &&
            a.periodeId === activePeriod.id
        );

        if (!asg) {
          asg = {
            id: `asg-${teacher.id}-${subject.id}-${cls.id}-${Date.now().toString(36)}`,
            guruId: teacher.id,
            mataPelajaranId: subject.id,
            kelasId: cls.id,
            periodeId: activePeriod.id,
            status: 'aktif',
            createdAt: new Date().toISOString(),
          };
          db.saveAssignment(asg);
        }

        // 5. Simpan Nilai Evaluasi
        const valSebelumnya = columnMapping.nilaiSebelumnya
          ? parseSafeNumber(row[columnMapping.nilaiSebelumnya])
          : null;
        const valBerjalan = columnMapping.nilaiBerjalan
          ? parseSafeNumber(row[columnMapping.nilaiBerjalan])
          : null;
        const rankVal = columnMapping.rank
          ? parseSafeNumber(row[columnMapping.rank])
          : null;

        const calc = calculateEvaluation(valSebelumnya, valBerjalan);

        const ev: NilaiEvaluasi = {
          id: `ev-${asg.id}`,
          penugasanId: asg.id,
          nilaiSebelumnya: valSebelumnya,
          nilaiBerjalan: valBerjalan,
          selisih: calc.selisih,
          persentase: calc.persentase,
          tren: calc.tren,
          rankingSumber: rankVal,
          isLengkap: valBerjalan !== null,
          updatedAt: new Date().toISOString(),
        };

        db.saveEvaluation(ev);
      });

      setStep('completed');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses impor data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSheets([]);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Impor Data Evaluasi & Penugasan Excel
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Unggah file .xlsx atau .xls dari evaluasi akademik untuk memproses penugasan guru dan nilai secara otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-neutral-800 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-neutral-700" />
            <span>Panduan Impor</span>
          </button>

          <button
            type="button"
            onClick={generateSampleExcelTemplate}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-neutral-600" />
            <span>Unduh Template Excel</span>
          </button>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-4 gap-2 text-xs font-medium border-b border-neutral-200 pb-3">
        <div
          className={`flex items-center gap-2 py-1 ${
            step === 'upload' ? 'text-neutral-950 font-bold border-b-2 border-neutral-900 -mb-3 pb-3' : 'text-neutral-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center bg-neutral-100 font-mono text-neutral-700">1</span>
          <span>Unggah File</span>
        </div>
        <div
          className={`flex items-center gap-2 py-1 ${
            step === 'mapping' ? 'text-neutral-950 font-bold border-b-2 border-neutral-900 -mb-3 pb-3' : 'text-neutral-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center bg-neutral-100 font-mono text-neutral-700">2</span>
          <span>Pemetaan Kolom</span>
        </div>
        <div
          className={`flex items-center gap-2 py-1 ${
            step === 'preview' ? 'text-neutral-950 font-bold border-b-2 border-neutral-900 -mb-3 pb-3' : 'text-neutral-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center bg-neutral-100 font-mono text-neutral-700">3</span>
          <span>Validasi & Konfirmasi</span>
        </div>
        <div
          className={`flex items-center gap-2 py-1 ${
            step === 'completed' ? 'text-emerald-700 font-bold border-b-2 border-emerald-600 -mb-3 pb-3' : 'text-neutral-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 font-mono text-emerald-800">4</span>
          <span>Selesai</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 rounded-xl p-12 text-center hover:border-neutral-400 hover:bg-neutral-50/50 transition-colors cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-800">
                Pilih atau seret file Excel (.xlsx / .xls) ke sini
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                Mendukung angka berkoma (contoh: 80,68), formula Excel, dan multi-baris pengajar.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Telusuri File Komputer</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="bg-neutral-100/70 border border-neutral-200 rounded-lg p-4 text-xs text-neutral-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-neutral-800">
              <Info className="w-4 h-4 text-neutral-700" />
              <span>Petunjuk Integritas Penugasan Guru:</span>
            </div>
            <p>
              • Satu guru yang muncul berkali-kali pada sheet (seperti Ustadz Dimas yang mengajar Shorof 3-H dan Ushul Fiqh 3-I) akan otomatis disatukan ke dalam satu identitas profil guru dengan dua penugasan berbeda.
            </p>
            <p>
              • Desimal dengan koma (80,68) dikonversi secara presisi tanpa pembulatan liar.
            </p>
            <p>
              • Nilai kosong tidak akan dipaksa menjadi 0, melainkan ditandai sebagai data evaluasi belum lengkap.
            </p>
            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-neutral-500">Baru pertama kali memetakan file?</span>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="font-bold text-neutral-900 underline hover:text-black flex items-center gap-1"
              >
                <span>Buka Panduan & Skema Kolom Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && currentSheet && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  Pemetaan Kolom Excel ({file?.name})
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Pilih sheet dan cocokkan kolom Excel dengan atribut data penugasan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Lihat Contoh Pemetaan</span>
                </button>

                {/* Sheet Selector */}
                {sheets.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-neutral-700 whitespace-nowrap">
                      Pilih Sheet:
                    </label>
                    <select
                      value={selectedSheetIndex}
                      onChange={(e) => handleSheetChange(Number(e.target.value))}
                      className="text-xs border border-neutral-300 rounded-md px-3 py-1.5 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    >
                      {sheets.map((s, idx) => (
                        <option key={s.sheetName} value={idx}>
                          {s.sheetName} ({s.data.length} baris)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Field Selectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Nama Guru (Wajib) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Nama Pengajar / Guru <span className="text-rose-600">*</span>
                </label>
                <select
                  value={columnMapping.namaGuru}
                  onChange={(e) => setColumnMapping({ ...columnMapping, namaGuru: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">-- Pilih Kolom --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">Contoh: Muhammad Ayus Sofi, Dimas</p>
              </div>

              {/* Mata Pelajaran (Wajib) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Mata Pelajaran <span className="text-rose-600">*</span>
                </label>
                <select
                  value={columnMapping.pelajaran}
                  onChange={(e) => setColumnMapping({ ...columnMapping, pelajaran: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">-- Pilih Kolom --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">Contoh: Muthala'ah, Shorof, Ushul Fiqh</p>
              </div>

              {/* Kelas (Wajib) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Kelas <span className="text-rose-600">*</span>
                </label>
                <select
                  value={columnMapping.kelas}
                  onChange={(e) => setColumnMapping({ ...columnMapping, kelas: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">-- Pilih Kolom --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">Contoh: 3-H, 4-B, 4-C</p>
              </div>

              {/* Nilai Sekarang / Periode Berjalan 2026 */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Rata - Rata 2026 (Periode Berjalan)
                </label>
                <select
                  value={columnMapping.nilaiBerjalan}
                  onChange={(e) => setColumnMapping({ ...columnMapping, nilaiBerjalan: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">-- Tidak Ada / Kosong --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">Contoh: 73,23 (menjadi hasil di rapor individual)</p>
              </div>

              {/* Nilai Sebelumnya 2025 */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Rata - Rata 2025 (Periode Pembanding / Lalu)
                </label>
                <select
                  value={columnMapping.nilaiSebelumnya}
                  onChange={(e) => setColumnMapping({ ...columnMapping, nilaiSebelumnya: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">-- Tidak Ada / Kosong --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">Contoh: 80,68 (digunakan untuk selisih, % & ket)</p>
              </div>

              {/* Rank / Peringkat */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Peringkat / Rank Resmi
                </label>
                <select
                  value={columnMapping.rank}
                  onChange={(e) => setColumnMapping({ ...columnMapping, rank: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">-- Hitung Otomatis --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">Contoh: 279, 181 (sesuai sheet excel)</p>
              </div>

              {/* NIP */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  NIP / No. Induk Guru (Opsional)
                </label>
                <select
                  value={columnMapping.nip}
                  onChange={(e) => setColumnMapping({ ...columnMapping, nip: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">-- Dibuatkan Otomatis --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Kerja */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Unit Kerja / Bagian (Opsional)
                </label>
                <select
                  value={columnMapping.unitKerja}
                  onChange={(e) => setColumnMapping({ ...columnMapping, unitKerja: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">-- Gunakan Default Lembaga --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sample Rows Preview */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Pratinjau 3 Baris Pertama dari Sheet:
              </h3>
              <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      {currentSheet.headers.slice(0, 7).map((h) => (
                        <th key={h} className="px-3 py-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {currentSheet.data.slice(0, 3).map((r, i) => (
                      <tr key={i} className="hover:bg-neutral-50 font-mono">
                        <td className="px-3 py-2 text-neutral-400">{i + 1}</td>
                        {currentSheet.headers.slice(0, 7).map((h) => (
                          <td key={h} className="px-3 py-2 whitespace-nowrap">
                            {String(r[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 font-medium"
              >
                Ganti File Lain
              </button>
              <button
                type="button"
                onClick={validateAndPrepareRows}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>Lanjut ke Validasi Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Validation & Confirmation */}
      {step === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-neutral-900">
              Ringkasan Validasi Impor Data ({activePeriod.nama})
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3.5">
                <div className="text-xs text-neutral-500 font-medium">Total Baris Terbaca</div>
                <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
                  {importSummary.totalRows}
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3.5">
                <div className="text-xs text-neutral-500 font-medium">Baris Data Valid</div>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                  {importSummary.validRows}
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3.5">
                <div className="text-xs text-neutral-500 font-medium">Guru Baru Dibuat</div>
                <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
                  {importSummary.newTeachers}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  ({importSummary.matchedTeachers} guru cocok dengan data lama)
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3.5">
                <div className="text-xs text-neutral-500 font-medium">Penugasan Baru</div>
                <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
                  {importSummary.newAssignments}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  ({importSummary.updatedAssignments} penugasan diperbarui)
                </div>
              </div>
            </div>

            {/* Mode Impor */}
            <div className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-neutral-50/50">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Pilih Strategi Penyimpanan Data:
              </h3>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-semibold text-neutral-900">
                      Tambah Data Baru & Pertahankan Data Lain (Disarankan)
                    </span>
                    <p className="text-xs text-neutral-500">
                      Penugasan yang sudah ada akan tetap ada. Penugasan baru akan ditambahkan tanpa menghapus riwayat sebelumnya.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-semibold text-rose-700">
                      Ganti Seluruh Penugasan Periode Ini
                    </span>
                    <p className="text-xs text-neutral-500">
                      Hanya menghapus penugasan pada periode aktif ({activePeriod.nama}), lalu mengisi ulang dari file Excel ini.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Error alerts if any */}
            {importSummary.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Ditemukan {importSummary.errors.length} baris tidak lengkap:</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-0.5 font-mono text-[11px]">
                  {importSummary.errors.slice(0, 5).map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                  {importSummary.errors.length > 5 && (
                    <div className="text-amber-600">
                      ... dan {importSummary.errors.length - 5} baris lainnya dilewati.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation actions */}
            <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 font-medium"
              >
                Kembali ke Pemetaan
              </button>

              <button
                type="button"
                disabled={isProcessing || importSummary.validRows === 0}
                onClick={handleExecuteImport}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Konfirmasi & Simpan ke Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Completed */}
      {step === 'completed' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Impor Data Berhasil Diselesaikan!
            </h2>
            <p className="text-sm text-neutral-600 mt-1 max-w-md mx-auto">
              Seluruh penugasan mengajar dan nilai evaluasi berhasil disimpan ke database. Anda dapat langsung menghasilkan Rapor Individual atau Rekap Mata Pelajaran.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                window.location.hash = '#individual-reports';
              }}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Buka Generator Rapor Guru
            </button>
            <button
              onClick={() => {
                window.location.hash = '#subject-recap';
              }}
              className="px-4 py-2 bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              Buka Rekap Mata Pelajaran
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 text-sm font-medium"
            >
              Impor File Lain
            </button>
          </div>
        </div>
      )}

      {/* Interactive Import Guide Modal */}
      {showGuideModal && (
        <ImportGuide isModal={true} onClose={() => setShowGuideModal(false)} />
      )}
    </div>
  );
};
