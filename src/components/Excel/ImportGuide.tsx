/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from 'lucide-react';
import { generateSampleExcelTemplate } from '../../utils/excel.ts';

interface ImportGuideProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const ImportGuide: React.FC<ImportGuideProps> = ({ onClose, isModal = false }) => {
  const [activeTab, setActiveTab] = useState<'mapping' | 'steps' | 'examples'>('mapping');

  const mappingColumns = [
    {
      sourceNames: ['Nama Pengajar', 'Nama Guru', 'Nama', 'Pengajar'],
      targetField: 'Identitas Guru (Nama Lengkap)',
      isRequired: true,
      description: 'Nama guru/ustadz pengajar. Jika satu nama muncul di beberapa baris (multi-kelas), sistem akan menggabungkannya ke 1 profil guru.',
      example: 'Muhammad Ayus Sofi, Dimas',
    },
    {
      sourceNames: ['Pelajaran', 'Mata Pelajaran', 'Mapel', 'Maddah'],
      targetField: 'Mata Pelajaran',
      isRequired: true,
      description: 'Nama pelajaran yang diajarkan. Jika belum ada di sistem, otomatis didaftarkan dan dicarikan nama Arabnya.',
      example: 'Muthala\'ah, Shorof, Ushul Fiqh',
    },
    {
      sourceNames: ['Kelas', 'Ruang', 'Kelompok Kelas'],
      targetField: 'Kelas & Tingkat',
      isRequired: true,
      description: 'Nama rombongan belajar. Angka depan (e.g. 3 dari 3-H, 4 dari 4-B) otomatis mendeteksi tingkat jenjang kelas.',
      example: '4-B, 3-H, 3-I',
    },
    {
      sourceNames: ['Rata - Rata 2026', 'Nilai Berjalan', 'Nilai Sekarang', 'Semester Ini'],
      targetField: 'Nilai Periode Berjalan (2026)',
      isRequired: false,
      description: 'Nilai rata-rata akhir periode aktif 2026. Nilai ini yang langsung tercetak di kolom النتيجة (Hasil) pada Rapor Individual.',
      example: '73,23 atau 82,50',
    },
    {
      sourceNames: ['Rata - Rata 2025', 'Nilai Sebelumnya', 'Nilai Lalu', 'Semester Lalu'],
      targetField: 'Nilai Periode Sebelumnya (2025)',
      isRequired: false,
      description: 'Nilai pembanding dari tahun 2025. Digunakan untuk menghitung selisih kenaikan dan kolom Ket (Keterangan).',
      example: '80,68 atau 75,50',
    },
    {
      sourceNames: ['Rank', 'Peringkat', 'Urutan'],
      targetField: 'Peringkat Resmi (Opsional)',
      isRequired: false,
      description: 'Peringkat resmi dari berkas Excel. Jika dikosongkan, sistem dapat menghitung peringkat kompetisi otomatis.',
      example: '279, 181, 101',
    },
    {
      sourceNames: ['NIP', 'No. Induk', 'NIK', 'ID Guru'],
      targetField: 'NIP Guru (Opsional)',
      isRequired: false,
      description: 'Nomor identitas unik guru. Mendukung angka dengan awalan nol (misal 0123). Jika kosong, dibuatkan otomatis.',
      example: '1001, 2001',
    },
    {
      sourceNames: ['Unit Kerja', 'Bagian', 'Tugas Tambahan'],
      targetField: 'Unit Kerja (Opsional)',
      isRequired: false,
      description: 'Departemen penugasan guru yang tercetak di bawah nama pada rapor.',
      example: 'Perpustakaan UNIDA Kampus Rabithah',
    },
  ];

  const content = (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4 text-neutral-700" />
            <span>Buku Panduan Integrasi Data</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Panduan Lengkap Impor & Pemetaan Kolom Excel
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Ikuti tata cara berikut agar data evaluasi pengajar terhubung secara presisi ke Rapor Arab dan Rekap Nilai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateSampleExcelTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors border border-neutral-300"
          >
            <Download className="w-3.5 h-3.5 text-neutral-700" />
            <span>Unduh Contoh Excel (.xlsx)</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('mapping')}
          className={`pb-2.5 transition-colors relative ${
            activeTab === 'mapping'
              ? 'text-neutral-950 border-b-2 border-neutral-900 font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          1. Tabel Pemetaan Kolom (Excel ➔ Sistem)
        </button>

        <button
          onClick={() => setActiveTab('steps')}
          className={`pb-2.5 transition-colors relative ${
            activeTab === 'steps'
              ? 'text-neutral-950 border-b-2 border-neutral-900 font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          2. Langkah-Langkah Alur Impor
        </button>

        <button
          onClick={() => setActiveTab('examples')}
          className={`pb-2.5 transition-colors relative ${
            activeTab === 'examples'
              ? 'text-neutral-950 border-b-2 border-neutral-900 font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          3. Kasus Khusus (Guru Ganda, Koma & Kosong)
        </button>
      </div>

      {/* Tab 1: Mapping Schema */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-600">
            Aplikasi ini tidak mewajibkan nama kolom yang kaku. Pada tahap pemetaan, Anda cukup mencocokkan kolom di file Anda dengan tujuan sistem berikut:
          </p>

          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-2.5 w-1/4">Kolom di File Excel Anda</th>
                    <th className="px-4 py-2.5 w-1/4">Tujuan di Sistem Rapor</th>
                    <th className="px-3 py-2.5 w-20 text-center">Status</th>
                    <th className="px-4 py-2.5">Penjelasan & Perilaku Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {mappingColumns.map((col, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 font-mono">
                          {col.sourceNames[0]}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          Atau: {col.sourceNames.slice(1).join(', ')}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{col.targetField}</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          Contoh: {col.example}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        {col.isRequired ? (
                          <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-neutral-900 text-white">
                            WAJIB
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700">
                            Opsional
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-neutral-600 leading-relaxed text-[11px]">
                        {col.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Visual Workflow Steps */}
      {activeTab === 'steps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h3 className="font-bold text-sm text-neutral-900">Unggah Berkas & Deteksi Sheet</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tarik atau pilih berkas spreadsheet (.xlsx atau .xls). Jika file Anda memiliki banyak sheet (misal: "Kelas 3", "Kelas 4", "Rekapitulasi"), Anda dapat memilih sheet spesifik dari menu dropdown.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="font-bold text-sm text-neutral-900">Pencocokan Kolom (Mapping)</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Sistem secara cerdas mendeteksi kata kunci umum (nama guru, pelajaran, kelas, rata-rata). Pastikan 3 kolom utama (Pengajar, Pelajaran, dan Kelas) telah terpilih dengan benar sebelum lanjut.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h3 className="font-bold text-sm text-neutral-900">Pemeriksaan Integritas & Pratinjau</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Sistem akan memvalidasi baris kosong, menghitung jumlah guru baru versus guru lama yang cocok, serta menghitung jumlah total penugasan yang akan dibuat.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h3 className="font-bold text-sm text-neutral-900">Pilih Strategi & Simpan</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Gunakan mode <strong>Tambah Data Baru</strong> agar penugasan guru sebelumnya tetap tersimpan, atau <strong>Ganti Seluruh Penugasan</strong> jika ingin mereset periode aktif dari file baru.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Special Cases & Scenarios */}
      {activeTab === 'examples' && (
        <div className="space-y-4 text-xs">
          {/* Kasus Ustadz Dimas */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
              <Sparkles className="w-4 h-4 text-neutral-800" />
              <span>Contoh Pengajar Multi-Tugas (Kasus Ustadz Dimas)</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Jika di dalam Excel nama <strong>Dimas</strong> muncul di 2 baris berbeda:
            </p>
            <div className="bg-neutral-50 border border-neutral-200 rounded p-2.5 font-mono text-[11px] space-y-1">
              <div>Baris 1: Dimas · Shorof · Kelas 3-H · Rata 2025: 75,50 · Rata 2026: 82,30</div>
              <div>Baris 2: Dimas · Ushul Fiqh · Kelas 3-I · Rata 2025: 78,40 · Rata 2026: 74,10</div>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              <strong>Hasil di sistem:</strong> Sistem tidak akan membuat 2 guru bernama Dimas, melainkan <strong>1 profil guru</strong> yang memiliki 2 penugasan. Saat mencetak Rapor Individual, kedua baris tersebut tampil dalam satu lembar rapor A5 yang rapi dan presisi.
            </p>
          </div>

          {/* Penanganan Desimal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="font-bold text-neutral-900 text-sm">Format Desimal Koma (80,68)</div>
              <p className="text-neutral-600 leading-relaxed">
                Di Indonesia, Excel lazim menggunakan tanda koma sebagai pemisah desimal (misal <code>80,68</code> atau <code>-7,45</code>). Sistem otomatis mengonversinya menjadi angka numerik murni tanpa merusak nilai.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="font-bold text-neutral-900 text-sm">Nilai Kosong / Belum Lengkap</div>
              <p className="text-neutral-600 leading-relaxed">
                Jika sebuah sel nilai kosong, berisi tanda strip (<code>-</code>), atau <code>###</code>, sistem tetap menyimpannya sebagai kosong (belum lengkap) dan tidak mengubahnya menjadi nilai <code>0</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
          {content}
          <div className="flex justify-end pt-4 border-t border-neutral-200 mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
      {content}
    </div>
  );
};
