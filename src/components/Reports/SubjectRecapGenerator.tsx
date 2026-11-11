/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Archive,
  Download,
  Filter,
  Check,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  Settings2,
  CheckSquare,
  Square,
  Search,
  X,
} from 'lucide-react';
import { db, subscribeDb, DEFAULT_COLUMN_WIDTHS, DEFAULT_HEADER_REKAP } from '../../services/db.ts';
import {
  MataPelajaran,
  PeriodeAkademik,
  DocumentArchive,
  TemplateRekapConfig,
  ColumnWidthsRekap,
  HeaderRekapConfig,
  Kelas,
} from '../../types/index.ts';
import { RecapTableView, RecapRowItem } from './RecapTableView.tsx';
import { calculateCompetitionRankings, extractTingkat } from '../../utils/calculations.ts';
import { exportRecapToExcel } from '../../utils/excel.ts';

export const SubjectRecapGenerator: React.FC = () => {
  const [periods, setPeriods] = useState<PeriodeAkademik[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('all');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [showClassPicker, setShowClassPicker] = useState<boolean>(false);
  const [classSearchQuery, setClassSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rank' | 'nama' | 'kelas' | 'nilaiBerjalan' | 'selisih'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showConfig, setShowConfig] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const institution = db.getSettings();
  const [templateConfig, setTemplateConfig] = useState<TemplateRekapConfig>(db.getTemplateRekap());

  const loadData = () => {
    const pList = db.getPeriods();
    setPeriods(pList);
    const active = db.getActivePeriod();
    if (!selectedPeriodId) setSelectedPeriodId(active.id);

    const sList = db.getSubjects().filter((s) => s.isActive);
    setSubjects(sList);
    if (!selectedSubjectId && sList.length > 0) {
      // Prioritize Muthala'ah or Shorof to match the reference images
      const muthalaah = sList.find((s) => s.nama.toLowerCase().includes('muthala'));
      setSelectedSubjectId(muthalaah ? muthalaah.id : sList[0].id);
    }

    const cfg = db.getTemplateRekap();
    if (cfg.orientation !== 'portrait') {
      cfg.orientation = 'portrait';
      db.saveTemplateRekap(cfg);
    }
    setTemplateConfig(cfg);
  };

  useEffect(() => {
    loadData();
    return subscribeDb(loadData);
  }, []);

  const currentPeriod =
    periods.find((p) => p.id === selectedPeriodId) || db.getActivePeriod();

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Available angkatan / jenjang umum (membedakan Reguler vs Intensif, misal: 1 vs 1 Int, 3 vs 3 Int)
  const availableAngkatans = useMemo(() => {
    const classes = db.getClasses();
    const angkatanSet = new Set<string>();
    classes.forEach((c) => {
      const t = extractTingkat(c.nama || c.tingkat);
      if (t) angkatanSet.add(t);
    });
    return Array.from(angkatanSet).sort((a, b) => {
      const parseA = a.match(/^(\d+)(.*)/);
      const parseB = b.match(/^(\d+)(.*)/);
      if (parseA && parseB) {
        const numA = parseInt(parseA[1], 10);
        const numB = parseInt(parseB[1], 10);
        if (numA !== numB) return numA - numB;
        // Same number: Reguler ("") comes before Intensif (" Int")
        return parseA[2].trim().localeCompare(parseB[2].trim());
      }
      return a.localeCompare(b);
    });
  }, [subjects, selectedSubjectId]);

  // List of all active individual classes (urut berdasarkan jenjang angkatan lalu nama)
  const availableClasses = useMemo(() => {
    const classes = db.getClasses().filter((c) => c.isActive);
    return [...classes].sort((a, b) => {
      const angkA = extractTingkat(a.nama || a.tingkat);
      const angkB = extractTingkat(b.nama || b.tingkat);
      if (angkA !== angkB) {
        const parseA = angkA.match(/^(\d+)(.*)/);
        const parseB = angkB.match(/^(\d+)(.*)/);
        if (parseA && parseB) {
          const numA = parseInt(parseA[1], 10);
          const numB = parseInt(parseB[1], 10);
          if (numA !== numB) return numA - numB;
          return parseA[2].trim().localeCompare(parseB[2].trim());
        }
      }
      return a.nama.localeCompare(b.nama, undefined, { numeric: true });
    });
  }, []);

  // Label tingkatan yang rapi untuk ditampilkan pada header dokumen cetak/layar
  const computedTingkatLabel = useMemo(() => {
    if (selectedTingkat === 'all') {
      return 'Semua Tingkat';
    }
    if (selectedTingkat === 'custom') {
      if (selectedClassIds.length === 0) return 'Belum Ada Kelas Dipilih';
      if (selectedClassIds.length === 1) {
        const cls = db.getClass(selectedClassIds[0]);
        return cls ? `Kelas ${cls.nama}` : '1 Kelas Dipilih';
      }
      const selectedClassesObj = selectedClassIds
        .map((id) => db.getClass(id))
        .filter((c): c is Kelas => Boolean(c));
      const angkatansInSelection = Array.from(
        new Set(selectedClassesObj.map((c) => extractTingkat(c.nama || c.tingkat)))
      );
      if (angkatansInSelection.length === 1) {
        const angk = angkatansInSelection[0];
        const isInt = angk.toLowerCase().includes('int');
        return `Kelas ${angk}${isInt ? ' (Intensif)' : ''} (${selectedClassIds.length} Kelas)`;
      }
      return `${selectedClassIds.length} Kelas Terpilih`;
    }
    if (selectedTingkat.startsWith('class:')) {
      const clsId = selectedTingkat.replace('class:', '');
      const cls = db.getClass(clsId);
      return cls ? `Kelas ${cls.nama}` : `Kelas ${clsId}`;
    }
    const isInt = selectedTingkat.toLowerCase().includes('int');
    return isInt ? `Kelas ${selectedTingkat} (Intensif)` : `Kelas ${selectedTingkat}`;
  }, [selectedTingkat, selectedClassIds]);

  // Fetch all matching assignments
  const rawRows: RecapRowItem[] = useMemo(() => {
    if (!selectedSubjectId) return [];
    if (selectedTingkat === 'custom') {
      if (selectedClassIds.length === 0) return [];
      return db.getSubjectRecapWithDetails(selectedSubjectId, selectedClassIds, selectedPeriodId);
    }
    return db.getSubjectRecapWithDetails(selectedSubjectId, selectedTingkat, selectedPeriodId);
  }, [selectedSubjectId, selectedTingkat, selectedClassIds, selectedPeriodId]);

  // Compute rankings & apply sorting
  const processedRows = useMemo(() => {
    // 1. Calculate competition rankings based on nilaiBerjalan
    const withScores = rawRows.map((r) => ({
      ...r,
      score: r.nilai?.nilaiBerjalan ?? null,
    }));

    const ranked = calculateCompetitionRankings(withScores, true);

    const mapped = ranked.map((r) => ({
      ...r,
      calculatedRank: r.rank,
    }));

    // 2. Sort according to user preference
    return [...mapped].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'rank') {
        const rankA = a.nilai?.rankingSumber ?? a.calculatedRank ?? 99999;
        const rankB = b.nilai?.rankingSumber ?? b.calculatedRank ?? 99999;
        comparison = rankA - rankB;
      } else if (sortBy === 'nama') {
        comparison = a.guru.nama.localeCompare(b.guru.nama);
      } else if (sortBy === 'kelas') {
        comparison = a.kelas.nama.localeCompare(b.kelas.nama);
      } else if (sortBy === 'nilaiBerjalan') {
        const valA = a.nilai?.nilaiBerjalan ?? -9999;
        const valB = b.nilai?.nilaiBerjalan ?? -9999;
        comparison = valB - valA;
      } else if (sortBy === 'selisih') {
        const valA = a.nilai?.selisih ?? -9999;
        const valB = b.nilai?.selisih ?? -9999;
        comparison = valB - valA;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [rawRows, sortBy, sortDirection]);

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!currentSubject || processedRows.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const excelData = processedRows.map((r, i) => ({
      'No.': i + 1,
      'Rank': r.nilai?.rankingSumber ?? r.calculatedRank ?? '',
      'Nama Pengajar': r.guru.nama,
      'Pelajaran': r.mataPelajaran.nama,
      'Kelas': r.kelas.nama,
      'Rata - Rata 2025': r.nilai?.nilaiSebelumnya ?? '',
      'Rata - Rata 2026': r.nilai?.nilaiBerjalan ?? '',
      'Selisih': r.nilai?.selisih ?? '',
      'Persentase': r.nilai?.persentase !== null ? `${r.nilai?.persentase}%` : '',
      'Ket': r.nilai?.tren && r.nilai.tren !== 'Belum Lengkap' ? r.nilai.tren : '—',
      'Unit Kerja': r.guru.unitKerja ?? '',
    }));

    const safeMapel = currentSubject.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeTingkat = computedTingkatLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
    exportRecapToExcel(`Rekap_${safeMapel}_${safeTingkat}`, currentSubject.nama, excelData);
    showToast('Tabel Rekapitulasi berhasil diekspor ke file Excel (.xlsx).');
  };

  // Save to Archive (Frozen Snapshot)
  const handleSaveToArchive = () => {
    if (!currentSubject) return;

    const archiveDoc: DocumentArchive = {
      id: `arch-rekap-${currentSubject.id}-${selectedTingkat}-${selectedPeriodId}-${Date.now()}`,
      tipe: 'rekap_mata_pelajaran',
      judul: `Rekap Nilai ${currentSubject.nama} - ${computedTingkatLabel} - ${currentPeriod.tahunAkademik}`,
      periodeId: selectedPeriodId,
      mataPelajaranId: currentSubject.id,
      tingkat: selectedTingkat,
      tanggalDibuat: new Date().toISOString(),
      versi: 1,
      status: 'diterbitkan',
      snapshotData: {
        institution,
        periode: currentPeriod,
        penugasanList: processedRows.map((row) => ({
          penugasan: row.penugasan,
          mataPelajaran: row.mataPelajaran,
          kelas: row.kelas,
          nilai: row.nilai,
          guru: row.guru,
        })),
        metaExtra: {
          totalRows: processedRows.length,
          tingkat: selectedTingkat,
        },
      },
    };

    db.saveArchive(archiveDoc);
    showToast(`Dokumen Rekap ${currentSubject.nama} berhasil disimpan ke Arsip.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeColWidths: ColumnWidthsRekap = {
    ...DEFAULT_COLUMN_WIDTHS,
    ...(templateConfig.columnWidths || {}),
  };

  const handleUpdateColWidth = (key: keyof ColumnWidthsRekap, val: number) => {
    const updatedWidths = {
      ...activeColWidths,
      [key]: Math.max(1, Math.min(60, Number(val.toFixed(1)))),
    };
    const updated = {
      ...templateConfig,
      columnWidths: updatedWidths,
    };
    setTemplateConfig(updated);
    db.saveTemplateRekap(updated);
  };

  const totalWidthPercent = Number(
    Object.values(activeColWidths).reduce((a, b) => a + b, 0).toFixed(1)
  );

  const activeHeaderCfg: HeaderRekapConfig = {
    ...DEFAULT_HEADER_REKAP,
    ...(templateConfig.header || {}),
  };

  const updateHeaderConfig = <K extends keyof HeaderRekapConfig>(
    key: K,
    val: HeaderRekapConfig[K]
  ) => {
    const updated = {
      ...templateConfig,
      header: {
        ...activeHeaderCfg,
        [key]: val,
      },
    };
    setTemplateConfig(updated);
    db.saveTemplateRekap(updated);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Actions (no-print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Generator Rekapitulasi Nilai Per Mata Pelajaran
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Rekap seluruh kelas dan pengajar untuk mata pelajaran tertentu sesuai format tabel resmi.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border rounded-lg transition-colors shadow-xs ${
              showConfig ? 'bg-neutral-900 text-white border-neutral-900' : 'text-neutral-700 bg-white border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Atur Header, Margin & Kolom</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleSaveToArchive}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Archive className="w-4 h-4 text-neutral-600" />
            <span>Simpan ke Arsip</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Filter & Control Bar (no-print) */}
      <div className="no-print bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Periode */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Periode Akademik:
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Mata Pelajaran */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Mata Pelajaran:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} {s.namaArab ? `(${s.namaArab})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Tingkat / Jenjang Kelas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Tingkat / Jenjang:
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextShow = !showClassPicker;
                  setShowClassPicker(nextShow);
                  if (nextShow && selectedTingkat !== 'custom') {
                    if (selectedTingkat === 'all') {
                      setSelectedClassIds(availableClasses.map((c) => c.id));
                    } else if (selectedTingkat.startsWith('class:')) {
                      setSelectedClassIds([selectedTingkat.replace('class:', '')]);
                    } else {
                      const matched = availableClasses
                        .filter((c) => extractTingkat(c.nama || c.tingkat).toLowerCase() === selectedTingkat.toLowerCase())
                        .map((c) => c.id);
                      setSelectedClassIds(matched.length > 0 ? matched : availableClasses.map((c) => c.id));
                    }
                    setSelectedTingkat('custom');
                  }
                }}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer ${
                  selectedTingkat === 'custom' || showClassPicker
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                title="Pilih kelas tertentu secara bebas dengan checklist multi-select"
              >
                <CheckSquare className="w-3 h-3" />
                <span>{selectedTingkat === 'custom' ? `${selectedClassIds.length} Kelas Dipilih` : 'Pilih Bebas (Multi)'}</span>
              </button>
            </div>
            <select
              value={selectedTingkat}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTingkat(val);
                if (val === 'custom') {
                  setShowClassPicker(true);
                  if (selectedClassIds.length === 0) {
                    setSelectedClassIds(availableClasses.map((c) => c.id));
                  }
                } else {
                  setShowClassPicker(false);
                }
              }}
              className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900 font-medium"
            >
              <option value="all">Semua Tingkat (Semua Angkatan)</option>
              <option value="custom">
                ✓ Pilihan Bebas / Multi-Select ({selectedClassIds.length} Kelas Terpilih)...
              </option>

              {availableAngkatans.length > 0 && (
                <optgroup label="── Jenjang / Angkatan Umum ──">
                  {availableAngkatans.map((t) => {
                    const isInt = t.toLowerCase().includes('int');
                    const label = isInt
                      ? `Kelas ${t} (Intensif)`
                      : `Kelas ${t} (Reguler)`;
                    return (
                      <option key={`angkatan-${t}`} value={t}>
                        {label} - Seluruh Angkatan {t}
                      </option>
                    );
                  })}
                </optgroup>
              )}

              {availableClasses.length > 0 && (
                <optgroup label="── Per Satuan Kelas ──">
                  {availableClasses.map((c) => {
                    const angk = extractTingkat(c.nama || c.tingkat);
                    return (
                      <option key={`cls-${c.id}`} value={`class:${c.id}`}>
                        Satuan: Kelas {c.nama} {angk ? `(${angk})` : ''}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>

          {/* 4. Pengurutan Data */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Urutkan Berdasarkan:
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-sm border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                <option value="rank">Peringkat / Rank</option>
                <option value="nilaiBerjalan">Nilai Tertinggi</option>
                <option value="selisih">Kenaikan (Selisih)</option>
                <option value="kelas">Nama Kelas (4-B, 4-C..)</option>
                <option value="nama">Nama Guru</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700"
                title={sortDirection === 'asc' ? 'Urutan Naik (A-Z)' : 'Urutan Turun (Z-A)'}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Panel Interaktif Pemilih Kelas Bebas (Multi-Select) */}
        {showClassPicker && (
          <div className="bg-neutral-50 border-2 border-neutral-800 rounded-xl p-4 shadow-sm space-y-3.5 animate-in fade-in slide-in-from-top-1">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-neutral-900" />
                  <span className="font-bold text-sm text-neutral-900">
                    Pilih Kelas yang Ingin Ditampilkan (Multi-Select Bebas)
                  </span>
                  <span className="bg-neutral-900 text-white text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold">
                    {selectedClassIds.length} dari {availableClasses.length} kelas dipilih
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Centang atau pilih kelas mana saja yang ingin dimunculkan dalam tabel rekapitulasi. Jenjang 1 & 1 Int, serta 3 & 3 Int telah dipisahkan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassIds(availableClasses.map((c) => c.id));
                    setSelectedTingkat('custom');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors shadow-2xs cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassIds([]);
                    setSelectedTingkat('custom');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors shadow-2xs cursor-pointer"
                >
                  Kosongkan
                </button>
                <button
                  type="button"
                  onClick={() => setShowClassPicker(false)}
                  className="p-1 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                  title="Tutup Panel Pemilih"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Angkatan Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider mr-1">
                Pilih Cepat Per Angkatan:
              </span>
              {availableAngkatans.map((angk) => {
                const classesInAngk = availableClasses.filter(
                  (c) => extractTingkat(c.nama || c.tingkat).toLowerCase() === angk.toLowerCase()
                );
                const allSelected =
                  classesInAngk.length > 0 &&
                  classesInAngk.every((c) => selectedClassIds.includes(c.id));
                const someSelected =
                  classesInAngk.some((c) => selectedClassIds.includes(c.id));
                const isInt = angk.toLowerCase().includes('int');

                return (
                  <button
                    key={`quick-${angk}`}
                    type="button"
                    onClick={() => {
                      setSelectedTingkat('custom');
                      if (allSelected) {
                        const removeIds = new Set(classesInAngk.map((c) => c.id));
                        setSelectedClassIds(selectedClassIds.filter((id) => !removeIds.has(id)));
                      } else {
                        const newIds = new Set([
                          ...selectedClassIds,
                          ...classesInAngk.map((c) => c.id),
                        ]);
                        setSelectedClassIds(Array.from(newIds));
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                      allSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : someSelected
                        ? 'bg-neutral-200 text-neutral-900 border-neutral-400 font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{allSelected ? '✓' : '+'}</span>
                    <span>{isInt ? `Kelas ${angk} (Intensif)` : `Kelas ${angk}`}</span>
                    <span className="text-[10px] opacity-75">({classesInAngk.length})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama kelas (misal: 1 Int, 3, B, 4-M)..."
                value={classSearchQuery}
                onChange={(e) => setClassSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-neutral-300 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-400 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Grouped Classes Grid */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {availableAngkatans.map((angk) => {
                let classesInAngk = availableClasses.filter(
                  (c) => extractTingkat(c.nama || c.tingkat).toLowerCase() === angk.toLowerCase()
                );
                if (classSearchQuery.trim()) {
                  classesInAngk = classesInAngk.filter((c) =>
                    c.nama.toLowerCase().includes(classSearchQuery.toLowerCase())
                  );
                }
                if (classesInAngk.length === 0) return null;

                const isInt = angk.toLowerCase().includes('int');
                const allSelected = classesInAngk.every((c) => selectedClassIds.includes(c.id));

                return (
                  <div key={`group-${angk}`} className="bg-white border border-neutral-200 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 border-b border-neutral-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isInt ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {isInt ? `Angkatan ${angk} (Intensif)` : `Angkatan Kelas ${angk} (Reguler)`}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-normal">
                          ({classesInAngk.length} kelas)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTingkat('custom');
                          if (allSelected) {
                            const removeIds = new Set(classesInAngk.map((c) => c.id));
                            setSelectedClassIds(selectedClassIds.filter((id) => !removeIds.has(id)));
                          } else {
                            const newIds = new Set([
                              ...selectedClassIds,
                              ...classesInAngk.map((c) => c.id),
                            ]);
                            setSelectedClassIds(Array.from(newIds));
                          }
                        }}
                        className="text-[11px] text-neutral-600 hover:text-neutral-900 underline font-normal cursor-pointer"
                      >
                        {allSelected ? 'Batal Semua' : 'Pilih Semua Angkatan Ini'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {classesInAngk.map((c) => {
                        const isChecked = selectedClassIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedTingkat('custom');
                              if (isChecked) {
                                setSelectedClassIds(selectedClassIds.filter((id) => id !== c.id));
                              } else {
                                setSelectedClassIds([...selectedClassIds, c.id]);
                              }
                            }}
                            className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                              isChecked
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs font-bold'
                                : 'bg-neutral-50/50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 font-medium'
                            }`}
                          >
                            <span className="truncate">{c.nama}</span>
                            <span className={`text-[10px] font-mono px-1 rounded ${
                              isChecked ? 'bg-white/20 text-white' : 'text-neutral-400'
                            }`}>
                              {isChecked ? '✓' : '+'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsible Column Configuration Drawer */}
        {showConfig && (
          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">Format Kertas:</span>
                <span className="bg-neutral-900 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                  A5 Standar Rapor (148 × 210 mm)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">Orientasi:</span>
                <div className="inline-flex rounded-lg border border-neutral-300 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...templateConfig, orientation: 'portrait' as const };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                      templateConfig.orientation === 'portrait'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    ↕ Potret (148 × 210 mm - Standar Pas)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...templateConfig, orientation: 'landscape' as const };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                      templateConfig.orientation === 'landscape'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    ↔ Lanskap (210 × 148 mm)
                  </button>
                </div>
              </div>
            </div>

            {/* Kontrol Kustomisasi Tulisan Header Dokumen (Kop Rekapitulasi) */}
            <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                <div>
                  <span className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
                    Atur Tulisan Header Dokumen (Kop Rekapitulasi)
                  </span>
                  <div className="text-[11px] text-neutral-500">
                    Pilih mana saja elemen tulisan header yang ingin dimunculkan atau disembunyikan pada cetakan rapor/rekap.
                  </div>
                </div>

                {/* Preset Header */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium text-[11px]">Preset Header:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        header: { ...DEFAULT_HEADER_REKAP },
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                      showToast('Header dikembalikan ke format standar lengkap.');
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Standar Lengkap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        header: {
                          ...DEFAULT_HEADER_REKAP,
                          showLembaga: false,
                          showTanggal: false,
                          showTotalKelas: false,
                          showInfoMargin: false,
                        },
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                      showToast('Preset Header Ringkas diterapkan.');
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Ringkas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        header: {
                          ...activeHeaderCfg,
                          showHeader: !activeHeaderCfg.showHeader,
                        },
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                      showToast(updated.header.showHeader ? 'Header diaktifkan.' : 'Header disembunyikan sepenuhnya.');
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer"
                  >
                    {activeHeaderCfg.showHeader ? 'Sembunyikan Header' : 'Tampilkan Header'}
                  </button>
                </div>
              </div>

              {activeHeaderCfg.showHeader ? (
                <div className="space-y-3">
                  {/* Edit Judul & Catatan Tambahan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                        Judul Utama Dokumen:
                      </label>
                      <input
                        type="text"
                        value={activeHeaderCfg.customJudul || ''}
                        onChange={(e) => updateHeaderConfig('customJudul', e.target.value)}
                        placeholder="REKAPITULASI EVALUASI NILAI PENGAJAR"
                        className="w-full text-xs border border-neutral-300 rounded p-1.5 bg-white text-neutral-900 placeholder:text-neutral-400 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                        Sub-Judul / Catatan Tambahan (Opsional):
                      </label>
                      <input
                        type="text"
                        value={activeHeaderCfg.customSubheader || ''}
                        onChange={(e) => updateHeaderConfig('customSubheader', e.target.value)}
                        placeholder="Contoh: Lampiran Hasil Ujian Akhir Semester"
                        className="w-full text-xs border border-neutral-300 rounded p-1.5 bg-white text-neutral-900 placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  {/* Checklist Bagian-Bagian Tulisan Header */}
                  <div>
                    <span className="block text-[11px] font-bold text-neutral-800 mb-1.5">
                      Pilih Bagian Tulisan yang Ditampilkan:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs bg-white p-2.5 rounded-lg border border-neutral-200">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showLembaga}
                          onChange={(e) => updateHeaderConfig('showLembaga', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Nama Lembaga & Kulliyah</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showJudul}
                          onChange={(e) => updateHeaderConfig('showJudul', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Judul Dokumen</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showPelajaran}
                          onChange={(e) => updateHeaderConfig('showPelajaran', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Nama Pelajaran</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showNamaArabMapel}
                          onChange={(e) => updateHeaderConfig('showNamaArabMapel', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Teks Arab Pelajaran</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showTingkat}
                          onChange={(e) => updateHeaderConfig('showTingkat', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Info Tingkat / Kelas</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showPeriode}
                          onChange={(e) => updateHeaderConfig('showPeriode', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Info Periode Semester</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showTanggal}
                          onChange={(e) => updateHeaderConfig('showTanggal', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Tanggal Cetak (Kanan)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showTotalKelas}
                          onChange={(e) => updateHeaderConfig('showTotalKelas', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Total Kelas (Kanan)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeHeaderCfg.showInfoMargin}
                          onChange={(e) => updateHeaderConfig('showInfoMargin', e.target.checked)}
                          className="rounded text-neutral-900"
                        />
                        <span>Info Teknis Margin</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-neutral-500 bg-white rounded border border-dashed border-neutral-300">
                  Header dokumen saat ini disembunyikan. Tabel rekap akan langsung dimulai dari bagian atas kertas.
                </div>
              )}
            </div>

            {/* Manual Margin & Font Settings */}
            <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                <span className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
                  Margin Cetak Tabel Manual (Milimeter)
                </span>
                {/* Presets */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium text-[11px]">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        marginTopMm: 3,
                        marginBottomMm: 3,
                        marginLeftMm: 4,
                        marginRightMm: 4,
                        fontSize: 7.5,
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors"
                  >
                    Ketat (3-4mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        marginTopMm: 5,
                        marginBottomMm: 5,
                        marginLeftMm: 6,
                        marginRightMm: 6,
                        fontSize: 7.5,
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 transition-colors"
                  >
                    Standar A5 (5-6mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        marginTopMm: 8,
                        marginBottomMm: 8,
                        marginLeftMm: 8,
                        marginRightMm: 8,
                        fontSize: 7,
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors"
                  >
                    Longgar (8mm)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                    Margin Atas (mm):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={templateConfig.marginTopMm ?? 5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const updated = { ...templateConfig, marginTopMm: val };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className="w-full text-xs font-mono border border-neutral-300 rounded p-1.5 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                    Margin Bawah (mm):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={templateConfig.marginBottomMm ?? 5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const updated = { ...templateConfig, marginBottomMm: val };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className="w-full text-xs font-mono border border-neutral-300 rounded p-1.5 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                    Margin Kiri (mm):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={templateConfig.marginLeftMm ?? 6}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const updated = { ...templateConfig, marginLeftMm: val };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className="w-full text-xs font-mono border border-neutral-300 rounded p-1.5 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                    Margin Kanan (mm):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={templateConfig.marginRightMm ?? 6}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const updated = { ...templateConfig, marginRightMm: val };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className="w-full text-xs font-mono border border-neutral-300 rounded p-1.5 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-700 mb-1">
                    Font Tabel (pt):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="6"
                    max="10"
                    value={templateConfig.fontSize || 7.5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 7.5;
                      const updated = { ...templateConfig, fontSize: val };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                    }}
                    className="w-full text-xs font-mono border border-neutral-300 rounded p-1.5 bg-white text-neutral-900"
                  />
                </div>
              </div>
            </div>

            {/* Kontrol Manual Panjang & Lebar Kolom serta Tinggi Baris */}
            <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                <div>
                  <span className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
                    Atur Panjang & Lebar Kolom Manual
                  </span>
                  <div className="text-[11px] text-neutral-500">
                    Sesuaikan proporsi lebar tiap kolom (%) dan tinggi/padding baris (mm) agar nama panjang pas dan rapi.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium text-[11px]">Preset Lebar:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        columnWidths: { ...DEFAULT_COLUMN_WIDTHS },
                        rowHeightMm: 1.2,
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                      showToast('Lebar kolom dikembalikan ke setelan default seimbang.');
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors"
                  >
                    Default Seimbang
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        columnWidths: {
                          no: 3.5,
                          rank: 4.5,
                          nama: 36,
                          pelajaran: 10,
                          kelas: 5.5,
                          nilaiSebelumnya: 10.5,
                          nilaiBerjalan: 10.5,
                          selisih: 7.5,
                          persentase: 6,
                          tren: 6,
                        },
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                      showToast('Preset: Kolom Nama Pengajar Lebih Lebar diterapkan.');
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors"
                  >
                    Nama Lebih Lebar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...templateConfig,
                        columnWidths: {
                          no: 3.5,
                          rank: 4.5,
                          nama: 24,
                          pelajaran: 10,
                          kelas: 5,
                          nilaiSebelumnya: 14,
                          nilaiBerjalan: 14,
                          selisih: 10,
                          persentase: 7.5,
                          tren: 7.5,
                        },
                      };
                      setTemplateConfig(updated);
                      db.saveTemplateRekap(updated);
                      showToast('Preset: Kolom Nilai Lebih Luas diterapkan.');
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors"
                  >
                    Nilai Lebih Luas
                  </button>
                </div>
              </div>

              {/* Kontrol Tinggi Baris Tabel (Row Height / Padding) */}
              <div className="bg-white p-2.5 rounded border border-neutral-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-800">
                      Tinggi / Jarak Baris Tabel (mm):
                    </label>
                    <span className="text-[10px] text-neutral-500">
                      Mengatur panjang/tinggi tiap baris agar nama guru dan tulisan pas tanpa terpotong
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...templateConfig, rowHeightMm: 0.8 };
                          setTemplateConfig(updated);
                          db.saveTemplateRekap(updated);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded border ${
                          (templateConfig.rowHeightMm ?? 1.2) === 0.8
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        Padat (0.8mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...templateConfig, rowHeightMm: 1.2 };
                          setTemplateConfig(updated);
                          db.saveTemplateRekap(updated);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded border ${
                          (templateConfig.rowHeightMm ?? 1.2) === 1.2
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        Standar (1.2mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...templateConfig, rowHeightMm: 1.8 };
                          setTemplateConfig(updated);
                          db.saveTemplateRekap(updated);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded border ${
                          (templateConfig.rowHeightMm ?? 1.2) === 1.8
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        Longgar (1.8mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...templateConfig, rowHeightMm: 2.5 };
                          setTemplateConfig(updated);
                          db.saveTemplateRekap(updated);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded border ${
                          (templateConfig.rowHeightMm ?? 1.2) === 2.5
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        Ekstra Luas (2.5mm)
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0.3"
                        max="6"
                        value={templateConfig.rowHeightMm ?? 1.2}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1.2;
                          const updated = { ...templateConfig, rowHeightMm: val };
                          setTemplateConfig(updated);
                          db.saveTemplateRekap(updated);
                        }}
                        className="w-16 text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                      />
                      <span className="text-[11px] text-neutral-500 font-mono">mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 10 Kolom Widths */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-neutral-800">
                    Lebar Setiap Kolom (% Persentase Lebar Tabel):
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      Math.abs(totalWidthPercent - 100) < 0.5
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Total: {totalWidthPercent.toFixed(1)}% {Math.abs(totalWidthPercent - 100) < 0.5 ? '(Pas 100%)' : '(Rekomendasi 100%)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">No. (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="2"
                      max="20"
                      value={activeColWidths.no}
                      onChange={(e) => handleUpdateColWidth('no', parseFloat(e.target.value) || 4)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Rank (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="2"
                      max="20"
                      value={activeColWidths.rank}
                      onChange={(e) => handleUpdateColWidth('rank', parseFloat(e.target.value) || 5.5)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-neutral-800 mb-0.5">Nama Guru (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="15"
                      max="55"
                      value={activeColWidths.nama}
                      onChange={(e) => handleUpdateColWidth('nama', parseFloat(e.target.value) || 29)}
                      className="w-full text-xs font-mono font-bold border border-neutral-400 rounded p-1 text-center bg-amber-50/50 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Pelajaran (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="5"
                      max="30"
                      value={activeColWidths.pelajaran}
                      onChange={(e) => handleUpdateColWidth('pelajaran', parseFloat(e.target.value) || 11)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Kelas (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="3"
                      max="20"
                      value={activeColWidths.kelas}
                      onChange={(e) => handleUpdateColWidth('kelas', parseFloat(e.target.value) || 6)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Rata 2025 (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="5"
                      max="25"
                      value={activeColWidths.nilaiSebelumnya}
                      onChange={(e) => handleUpdateColWidth('nilaiSebelumnya', parseFloat(e.target.value) || 11.5)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Rata 2026 (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="5"
                      max="25"
                      value={activeColWidths.nilaiBerjalan}
                      onChange={(e) => handleUpdateColWidth('nilaiBerjalan', parseFloat(e.target.value) || 11.5)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Selisih (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="4"
                      max="20"
                      value={activeColWidths.selisih}
                      onChange={(e) => handleUpdateColWidth('selisih', parseFloat(e.target.value) || 8.5)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Persen (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="3"
                      max="15"
                      value={activeColWidths.persentase}
                      onChange={(e) => handleUpdateColWidth('persentase', parseFloat(e.target.value) || 6.5)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-600 mb-0.5">Ket (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="3"
                      max="15"
                      value={activeColWidths.tren}
                      onChange={(e) => handleUpdateColWidth('tren', parseFloat(e.target.value) || 6.5)}
                      className="w-full text-xs font-mono border border-neutral-300 rounded p-1 text-center bg-white text-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateConfig.showRanking}
                onChange={(e) =>
                  setTemplateConfig({ ...templateConfig, showRanking: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Kolom Rank</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateConfig.showNilaiSebelumnya}
                onChange={(e) =>
                  setTemplateConfig({ ...templateConfig, showNilaiSebelumnya: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Rata-Rata 2025</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateConfig.showNilaiBerjalan}
                onChange={(e) =>
                  setTemplateConfig({ ...templateConfig, showNilaiBerjalan: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Rata-Rata 2026</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateConfig.showSelisih}
                onChange={(e) =>
                  setTemplateConfig({ ...templateConfig, showSelisih: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Kolom Selisih</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateConfig.showPersentase}
                onChange={(e) =>
                  setTemplateConfig({ ...templateConfig, showPersentase: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Kolom Persentase</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateConfig.showTren}
                onChange={(e) =>
                  setTemplateConfig({ ...templateConfig, showTren: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Kolom Ket</span>
            </label>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Preview (Screen display) */}
      <div className="no-print overflow-x-auto pb-8 flex flex-col items-center">
        <div className="text-xs text-neutral-600 mb-2.5 font-medium flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-300">
            ✓ Ukuran Cetak: A5 Potret (148 × 210 mm)
          </span>
          <span>Sesuai standar cetak rapot panitia ulangan umum</span>
        </div>
        {currentSubject ? (
          <div className="shadow-lg border border-neutral-300 rounded overflow-hidden bg-neutral-200/50 p-3 sm:p-6 flex justify-center">
            <RecapTableView
              mataPelajaran={currentSubject}
              tingkat={selectedTingkat}
              tingkatLabel={computedTingkatLabel}
              periode={currentPeriod}
              institution={institution}
              template={templateConfig}
              rows={processedRows}
              previewMode={true}
            />
          </div>
        ) : (
          <div className="p-12 text-center text-neutral-500 bg-white border border-neutral-200 rounded-xl w-full">
            Silakan pilih mata pelajaran untuk menghasilkan rekapitulasi.
          </div>
        )}
      </div>

      {/* PRINT CONTAINER (Only visible in Print mode / @media print) */}
      <div className="hidden print:block print-container">
        {currentSubject && (
          <RecapTableView
            mataPelajaran={currentSubject}
            tingkat={selectedTingkat}
            tingkatLabel={computedTingkatLabel}
            periode={currentPeriod}
            institution={institution}
            template={templateConfig}
            rows={processedRows}
            previewMode={false}
          />
        )}
      </div>
    </div>
  );
};
