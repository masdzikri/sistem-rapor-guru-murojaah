/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../../services/db.ts';
import { generateSampleExcelTemplate } from '../../utils/excel.ts';

export const BackupRestoreView: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    const jsonStr = db.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Sistem_Rapor_Guru_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setStatusMessage({
      type: 'success',
      text: 'File cadangan data (JSON) berhasil diunduh.',
    });
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      if (confirm('Pulihkan data dari cadangan ini? Data saat ini akan digantikan.')) {
        const res = db.restoreBackup(content);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDemo = () => {
    if (
      confirm(
        'Muat ulang Data Demo resmi? (Termasuk Ustadz Dimas dengan 2 penugasan Shorof & Ushul Fiqh, serta rekap Muthala\'ah Kelas 4)'
      )
    ) {
      db.resetDemo();
      setStatusMessage({
        type: 'success',
        text: 'Data demo resmi berhasil dimuat kembali ke dalam sistem.',
      });
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        'PERINGATAN: Anda akan mengosongkan seluruh data guru, penugasan, nilai, dan arsip! Tindakan ini tidak dapat dibatalkan.'
      )
    ) {
      db.clearAll();
      setStatusMessage({
        type: 'success',
        text: 'Seluruh data operasional telah dikosongkan.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Cadangan & Pemulihan Data (Backup & Restore)
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Simpan seluruh basis data ke file lokal komputer dan pulihkan kapan saja tanpa memerlukan server eksternal.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Backup JSON */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Ekspor Cadangan (Backup)</h2>
              <p className="text-xs text-neutral-500">Unduh seluruh database dalam format JSON.</p>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Menyimpan semua guru, mata pelajaran, kelas, penugasan, buku nilai, pengaturan lembaga, dan snapshot arsip dokumen ke satu file cadangan yang aman.
          </p>
          <button
            onClick={handleExportBackup}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan Lengkap (.json)</span>
          </button>
        </div>

        {/* Card 2: Restore JSON */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Pulihkan Cadangan (Restore)</h2>
              <p className="text-xs text-neutral-500">Muat data dari file cadangan .json sebelumnya.</p>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Memulihkan seluruh konfigurasi dan data akademik. Pastikan file cadangan berasal dari sistem ini.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-300 text-neutral-800 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4 text-neutral-600" />
            <span>Pilih File Cadangan (.json)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleRestoreFile}
            className="hidden"
          />
        </div>

        {/* Card 3: Reset Demo Data */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Muat Data Demo Resmi</h2>
              <p className="text-xs text-neutral-500">Uji skenario Dimas & Muthala'ah Kelas 4.</p>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Memuat data fiktif terstruktur yang mencakup Ustadz Dimas dengan 2 mata pelajaran (Shorof 3-H dan Ushul Fiqh 3-I), Ustadz Ahmad, Budi, serta 12 pengajar Muthala'ah kelas 4 sesuai gambar referensi kedua.
          </p>
          <button
            onClick={handleResetDemo}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Muat Ulang Data Demo</span>
          </button>
        </div>

        {/* Card 4: Template Excel & Reset */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Template File Excel (.xlsx)</h2>
              <p className="text-xs text-neutral-500">Format standar untuk pengisian nilai guru.</p>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Unduh file spreadsheet yang sudah diformat dengan kolom standar (Pengajar, NIP, Pelajaran, Kelas, Nilai 2024, Nilai 2025, Selisih, Persentase, dan Tren).
          </p>
          <button
            onClick={generateSampleExcelTemplate}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-300 text-neutral-800 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-neutral-600" />
            <span>Unduh Template Excel Resmi</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>Zona Bahaya: Bersihkan Data</span>
        </h3>
        <p className="text-xs text-rose-600 max-w-xl">
          Tindakan ini akan mengosongkan seluruh entitas guru, penugasan mengajar, nilai, dan arsip dokumen dari penyimpanan browser ini.
        </p>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
        >
          Kosongkan Seluruh Basis Data
        </button>
      </div>
    </div>
  );
};
