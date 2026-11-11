/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Archive,
  Check,
  Search,
  Users,
  Eye,
  Download,
  FileCheck,
} from 'lucide-react';
import JSZip from 'jszip';
import { getSubjectArabicName } from '../../utils/arabic.ts';
import { db, subscribeDb } from '../../services/db.ts';
import { Guru, PeriodeAkademik, DocumentArchive } from '../../types/index.ts';
import { ArabicReportCard, ReportCardItem } from './ArabicReportCard.tsx';

export const IndividualReportGenerator: React.FC = () => {
  const [periods, setPeriods] = useState<PeriodeAkademik[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchSelectedTeacherIds, setBatchSelectedTeacherIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const institution = db.getSettings();
  const templateRapor = db.getTemplateRapor();

  const loadData = () => {
    const pList = db.getPeriods();
    setPeriods(pList);
    const active = db.getActivePeriod();
    if (!selectedPeriodId) {
      setSelectedPeriodId(active.id);
    }
    const tList = db.getTeachers().filter((t) => t.isActive);
    setTeachers(tList);
    if (!selectedTeacherId && tList.length > 0) {
      // Prioritize "Dimas" as default selected teacher to easily verify user test case!
      const dimas = tList.find((t) => t.nama.toLowerCase().includes('dimas'));
      setSelectedTeacherId(dimas ? dimas.id : tList[0].id);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeDb(loadData);
  }, []);

  const currentPeriod =
    periods.find((p) => p.id === selectedPeriodId) || db.getActivePeriod();

  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId);

  // Get current teacher's assignments with details
  const currentItems: ReportCardItem[] = selectedTeacherId
    ? db.getTeacherAssignmentsWithDetails(selectedTeacherId, selectedPeriodId)
    : [];

  const filteredTeachers = teachers.filter((t) =>
    t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.nip.includes(searchQuery) ||
    (t.unitKerja && t.unitKerja.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Trigger Print using native high-fidelity browser engine
  const handlePrint = () => {
    window.print();
  };

  // Save to Archive (Frozen Snapshot)
  const handleSaveToArchive = () => {
    if (!currentTeacher) return;

    const archiveDoc: DocumentArchive = {
      id: `arch-ind-${currentTeacher.id}-${selectedPeriodId}-${Date.now()}`,
      tipe: 'rapor_individual',
      judul: `Rapor Individual - ${currentTeacher.nama} - ${currentPeriod.tahunAkademik}`,
      periodeId: selectedPeriodId,
      guruId: currentTeacher.id,
      tanggalDibuat: new Date().toISOString(),
      versi: 1,
      status: 'diterbitkan',
      snapshotData: {
        institution,
        periode: currentPeriod,
        guru: currentTeacher,
        penugasanList: currentItems.map((item) => ({
          penugasan: item.penugasan,
          mataPelajaran: item.mataPelajaran,
          kelas: item.kelas,
          nilai: item.nilai,
          guru: currentTeacher,
        })),
      },
    };

    db.saveArchive(archiveDoc);
    showToast(`Rapor ${currentTeacher.nama} berhasil disimpan ke Arsip Dokumen.`);
  };

  // Batch Export as ZIP
  const handleBatchExportZip = async () => {
    const targetTeachers = isBatchMode
      ? teachers.filter((t) => batchSelectedTeacherIds.includes(t.id))
      : teachers;

    if (targetTeachers.length === 0) {
      alert('Pilih setidaknya satu guru untuk diekspor!');
      return;
    }

    const zip = new JSZip();

    targetTeachers.forEach((teacher) => {
      const items = db.getTeacherAssignmentsWithDetails(teacher.id, selectedPeriodId);
      const safeName = teacher.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safePeriod = currentPeriod.tahunAkademik.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Generate pristine standalone HTML print document
      const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Rapor_${safeName}_${safePeriod}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page { size: A5 portrait; margin: 0; }
    body { font-family: 'Amiri', serif; margin: 0; padding: 6mm 7mm; background: #fff; color: #000; box-sizing: border-box; }
    .box { border: 1.5px solid #000; padding: 4.5mm 5.5mm; height: 198mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
    .title { text-align: center; font-size: 17pt; font-weight: bold; margin-bottom: 3px; }
    .sub { text-align: center; font-size: 14.5pt; font-weight: bold; margin-bottom: 3px; }
    .kulliyah { text-align: center; font-size: 13.5pt; font-weight: bold; margin-bottom: 2px; }
    .lembaga { text-align: center; font-size: 11.5pt; margin-bottom: 8px; }
    .teacher { text-align: center; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: bold; font-size: 13pt; text-decoration: underline; text-underline-offset: 4px; margin-top: 6px; margin-bottom: 2px; }
    .unit { text-align: center; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10pt; color: #111; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; border: 1.5px solid #525252; }
    th { background-color: #a8a8a8; border: 1px solid #737373; padding: 6px; font-weight: bold; text-align: center; font-size: 12.5pt; }
    td { border: 1px solid #666; height: 12.5mm; text-align: center; font-size: 11pt; }
  </style>
</head>
<body onload="window.print()">
  <div class="box">
    <div>
      <div class="title">${institution.judulRaporArab}</div>
      <div class="sub">${(institution.tahunAkademikArab || 'عام: ١٤٤٨ / ٢٠٢٦').replace(/^العام:/, 'عام:')}</div>
      <div class="kulliyah">${institution.namaKulliyahArab}</div>
      <div class="lembaga">${institution.namaLembagaArab}</div>
      <div class="teacher">${teacher.nama.startsWith('Al-Ustadz') ? teacher.nama : `Al-Ustadz ${teacher.nama}`}</div>
      <div class="unit">${teacher.unitKerja || institution.unitKerjaDefault}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 13.5%;">الرقم</th>
          <th style="width: 43.5%;">الدرس</th>
          <th style="width: 21.5%;">الفصل</th>
          <th style="width: 21.5%;">النتيجة</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: Math.max(9, items.length) })
          .map((_, idx) => {
            const it = items[idx];
            const arabicNums = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١', '١٢'];
            const numStr = arabicNums[idx] || String(idx + 1);
            if (it) {
              const val = it.nilai?.nilaiBerjalan !== null && it.nilai?.nilaiBerjalan !== undefined ? it.nilai.nilaiBerjalan.toFixed(2).replace('.', ',') : '—';
              return `<tr style="height: 12.5mm;">
                <td style="font-weight: bold; font-size: 12.5pt;">${numStr}</td>
                <td style="font-weight: 600;">${it.mataPelajaran.namaArab || getSubjectArabicName(it.mataPelajaran.nama)}</td>
                <td dir="ltr" style="font-weight: 600;">${it.kelas.nama}</td>
                <td dir="ltr" style="font-weight: bold; font-family: monospace;">${val}</td>
              </tr>`;
            }
            return `<tr style="height: 12.5mm;">
              <td style="font-weight: bold; font-size: 12.5pt;">${numStr}</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

      zip.file(`Rapor_${safeName}_${safePeriod}.html`, htmlContent);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `Kumpulan_Rapor_Guru_${currentPeriod.tahunAkademik.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
    link.click();
    showToast(`Koleksi ${targetTeachers.length} rapor berhasil diunduh dalam file ZIP.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectAllTeachers = () => {
    if (batchSelectedTeacherIds.length === filteredTeachers.length) {
      setBatchSelectedTeacherIds([]);
    } else {
      setBatchSelectedTeacherIds(filteredTeachers.map((t) => t.id));
    }
  };

  const toggleTeacherBatch = (id: string) => {
    if (batchSelectedTeacherIds.includes(id)) {
      setBatchSelectedTeacherIds(batchSelectedTeacherIds.filter((tId) => tId !== id));
    } else {
      setBatchSelectedTeacherIds([...batchSelectedTeacherIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar (no-print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Generator Rapor Individual Guru
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Format resmi satu lembar per guru memuat seluruh penugasan mata pelajaran dan kelas dalam periode terpilih.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
              isBatchMode
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isBatchMode ? 'Mode Tunggal' : 'Mode Cetak Massal'}</span>
          </button>

          <button
            onClick={handleSaveToArchive}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Archive className="w-4 h-4 text-neutral-600" />
            <span>Simpan ke Arsip</span>
          </button>

          <button
            onClick={handleBatchExportZip}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-neutral-600" />
            <span>Unduh Arsip ZIP</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{isBatchMode ? 'Cetak Semua Rapor' : 'Cetak / Simpan PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (no-print) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Teacher Selection Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-4">
            {/* Periode Selector */}
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

            {/* Teacher Search */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Daftar Pengajar ({filteredTeachers.length}):
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari nama guru..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-lg pl-9 pr-3 py-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* Batch Select Controls */}
            {isBatchMode && (
              <div className="flex items-center justify-between text-xs border-b border-neutral-200 pb-2">
                <button
                  type="button"
                  onClick={handleSelectAllTeachers}
                  className="font-medium text-neutral-700 hover:text-neutral-950 underline"
                >
                  {batchSelectedTeacherIds.length === filteredTeachers.length
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua'}
                </button>
                <span className="text-neutral-500 font-mono">
                  {batchSelectedTeacherIds.length} dari {filteredTeachers.length} dipilih
                </span>
              </div>
            )}

            {/* Teacher List */}
            <div className="max-h-[460px] overflow-y-auto divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
              {filteredTeachers.map((teacher) => {
                const asgCount = db.getTeacherAssignmentsWithDetails(
                  teacher.id,
                  selectedPeriodId
                ).length;
                const isSelected = selectedTeacherId === teacher.id;
                const isBatchChecked = batchSelectedTeacherIds.includes(teacher.id);

                return (
                  <div
                    key={teacher.id}
                    onClick={() => {
                      if (isBatchMode) {
                        toggleTeacherBatch(teacher.id);
                      } else {
                        setSelectedTeacherId(teacher.id);
                      }
                    }}
                    className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected && !isBatchMode
                        ? 'bg-neutral-900 text-white'
                        : isBatchChecked && isBatchMode
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isBatchMode ? (
                        <input
                          type="checkbox"
                          checked={isBatchChecked}
                          onChange={() => toggleTeacherBatch(teacher.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded text-neutral-900"
                        />
                      ) : (
                        <div
                          className={`w-2 h-2 rounded-full ${
                            asgCount > 1
                              ? 'bg-emerald-500'
                              : asgCount === 1
                              ? 'bg-neutral-400'
                              : 'bg-rose-400'
                          }`}
                        />
                      )}
                      <div>
                        <div className="font-semibold text-sm leading-tight">
                          {teacher.nama}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            isSelected && !isBatchMode ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          {teacher.unitKerja || 'KMI Gontor'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded font-medium ${
                          isSelected && !isBatchMode
                            ? 'bg-neutral-800 text-neutral-200'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {asgCount} Mapel/Kelas
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Inspection Box */}
            {currentTeacher && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs space-y-1.5 text-neutral-700">
                <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Penugasan: {currentTeacher.nama}</span>
                </div>
                {currentItems.length === 0 ? (
                  <p className="text-neutral-500 italic">Belum ada penugasan di periode ini.</p>
                ) : (
                  <ul className="space-y-1 pl-4 list-disc text-neutral-700">
                    {currentItems.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-medium text-neutral-900">{item.mataPelajaran.nama}</span> (Kelas {item.kelas.nama}) — Nilai:{' '}
                        <span className="font-mono font-semibold">
                          {item.nilai?.nilaiBerjalan !== null && item.nilai?.nilaiBerjalan !== undefined
                            ? item.nilai.nilaiBerjalan.toFixed(2).replace('.', ',')
                            : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Report Card Sheet Preview */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-neutral-500 mb-2 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-neutral-600" />
              <span>Pratinjau Lembar Rapor A5 Standar Panitia (148 × 210 mm)</span>
            </span>
            <span>Skala 100% · A5 Cetak Panitia Ulangan Umum</span>
          </div>

          {currentTeacher ? (
            <div className="overflow-x-auto max-w-full pb-8 flex justify-center w-full">
              <div className="bg-neutral-200/60 p-4 sm:p-6 rounded-2xl flex justify-center shadow-inner">
                <ArabicReportCard
                  guru={currentTeacher}
                  items={currentItems}
                  institution={institution}
                  periode={currentPeriod}
                  template={templateRapor}
                  previewMode={true}
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500 bg-white border border-neutral-200 rounded-xl w-full">
              Pilih pengajar pada panel sebelah kiri untuk menampilkan rapor.
            </div>
          )}
        </div>
      </div>

      {/* PRINT CONTAINER (Only visible in Print mode / @media print) */}
      <div className="hidden print:block print-container">
        {isBatchMode ? (
          // Render all selected teachers continuously with A4 page breaks
          teachers
            .filter((t) => batchSelectedTeacherIds.length === 0 || batchSelectedTeacherIds.includes(t.id))
            .map((t) => {
              const tItems = db.getTeacherAssignmentsWithDetails(t.id, selectedPeriodId);
              return (
                <ArabicReportCard
                  key={t.id}
                  guru={t}
                  items={tItems}
                  institution={institution}
                  periode={currentPeriod}
                  template={templateRapor}
                  previewMode={false}
                />
              );
            })
        ) : (
          // Single teacher print
          currentTeacher && (
            <ArabicReportCard
              guru={currentTeacher}
              items={currentItems}
              institution={institution}
              periode={currentPeriod}
              template={templateRapor}
              previewMode={false}
            />
          )
        )}
      </div>
    </div>
  );
};
