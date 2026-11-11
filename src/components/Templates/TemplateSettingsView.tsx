/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Check,
  Eye,
  Settings,
} from 'lucide-react';
import {
  db,
  DEFAULT_SETTINGS,
  DEFAULT_TEMPLATE_RAPOR,
  DEFAULT_TEMPLATE_REKAP,
  DEFAULT_HEADER_REKAP,
  subscribeDb,
} from '../../services/db.ts';
import {
  InstitutionSettings,
  TemplateRaporConfig,
  TemplateRekapConfig,
} from '../../types/index.ts';

export const TemplateSettingsView: React.FC = () => {
  const [institution, setInstitution] = useState<InstitutionSettings>(db.getSettings());
  const [templateRapor, setTemplateRapor] = useState<TemplateRaporConfig>(
    db.getTemplateRapor()
  );
  const [templateRekap, setTemplateRekap] = useState<TemplateRekapConfig>(
    db.getTemplateRekap()
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setInstitution(db.getSettings());
    setTemplateRapor(db.getTemplateRapor());
    setTemplateRekap(db.getTemplateRekap());
  };

  useEffect(() => {
    loadData();
    return subscribeDb(loadData);
  }, []);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(institution);
    db.saveTemplateRapor(templateRapor);
    db.saveTemplateRekap(templateRekap);
    showToast('Seluruh konfigurasi template dokumen berhasil disimpan.');
  };

  const handleResetDefaults = () => {
    if (confirm('Kembalikan pengaturan template ke setelan default awal?')) {
      setInstitution(DEFAULT_SETTINGS);
      setTemplateRapor(DEFAULT_TEMPLATE_RAPOR);
      setTemplateRekap(DEFAULT_TEMPLATE_REKAP);
      db.saveSettings(DEFAULT_SETTINGS);
      db.saveTemplateRapor(DEFAULT_TEMPLATE_RAPOR);
      db.saveTemplateRekap(DEFAULT_TEMPLATE_REKAP);
      showToast('Setelan template telah dikembalikan ke default.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Pengelolaan Template Dokumen
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Kustomisasi judul bahasa Arab, kop institusi, ukuran font, margin cetak A5, dan label kolom tabel rapor.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan Default</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Template</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Template Teks Arab Rapor Individual (Sesuai Referensi Gambar 1) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="text-base font-bold text-neutral-900">
              1. Teks Judul & Identitas Rapor Arab (Gambar Referensi 1)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Teks berikut ditampilkan pada header lembar rapor individual santri/guru dalam aksara Arab.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Judul Utama Rapor (Bahasa Arab)
              </label>
              <input
                type="text"
                dir="rtl"
                value={institution.judulRaporArab}
                onChange={(e) =>
                  setInstitution({ ...institution, judulRaporArab: e.target.value })
                }
                className="w-full text-base font-arabic font-bold border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900 text-right"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Default: قائمة نتائج المراجعة العامة للفصل الدراسي الثاني</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Tahun Akademik Rapor (Bahasa Arab)
              </label>
              <input
                type="text"
                dir="rtl"
                value={institution.tahunAkademikArab}
                onChange={(e) =>
                  setInstitution({ ...institution, tahunAkademikArab: e.target.value })
                }
                className="w-full text-base font-arabic font-bold border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900 text-right"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Default: عام: ١٤٤٨ / ٢٠٢٦</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Nama Bagian / Kulliyah (Bahasa Arab)
              </label>
              <input
                type="text"
                dir="rtl"
                value={institution.namaKulliyahArab}
                onChange={(e) =>
                  setInstitution({ ...institution, namaKulliyahArab: e.target.value })
                }
                className="w-full text-base font-arabic border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900 text-right"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Default: كلية المعلمين الإسلامية</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Nama Lembaga / Pondok (Bahasa Arab)
              </label>
              <input
                type="text"
                dir="rtl"
                value={institution.namaLembagaArab}
                onChange={(e) =>
                  setInstitution({ ...institution, namaLembagaArab: e.target.value })
                }
                className="w-full text-base font-arabic border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900 text-right"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Default: معهد دار السلام كونتور للتربية الإسلامية الحديثة</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Unit / Bagian Kerja Default (Latin)
              </label>
              <input
                type="text"
                value={institution.unitKerjaDefault}
                onChange={(e) =>
                  setInstitution({ ...institution, unitKerjaDefault: e.target.value })
                }
                className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Default: Perpustakaan UNIDA Kampus Rabithah</p>
            </div>
          </div>
        </div>

        {/* Section 2: Format & Tampilan Visual Rapor Arab */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="text-base font-bold text-neutral-900">
              2. Ukuran Kertas, Tata Letak & Font Rapor
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Standar panitia adalah kertas <strong>A5 Portrait</strong> (148 × 210 mm). Anda juga dapat memilih A4 jika diperlukan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Ukuran Kertas Dokumen
              </label>
              <select
                value={templateRapor.paperSize || 'A5'}
                onChange={(e) =>
                  setTemplateRapor({
                    ...templateRapor,
                    paperSize: e.target.value as 'A5' | 'A4',
                    fontSizeTitle: e.target.value === 'A5' ? 18 : 22,
                    fontSizeBody: e.target.value === 'A5' ? 11 : 12,
                    marginTopMm: e.target.value === 'A5' ? 6 : 12,
                    marginBottomMm: e.target.value === 'A5' ? 6 : 12,
                    marginLeftMm: e.target.value === 'A5' ? 7 : 12,
                    marginRightMm: e.target.value === 'A5' ? 7 : 12,
                  })
                }
                className="w-full text-xs font-semibold border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                <option value="A5">A5 Portrait (148 × 210 mm) - Standar Panitia</option>
                <option value="A4">A4 Portrait (210 × 297 mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Ukuran Font Judul Arab (pt)
              </label>
              <input
                type="number"
                step="0.5"
                min={10}
                max={24}
                value={templateRapor.fontSizeTitle}
                onChange={(e) =>
                  setTemplateRapor({
                    ...templateRapor,
                    fontSizeTitle: Number(e.target.value),
                  })
                }
                className="w-full text-sm font-mono border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Ukuran Font Tabel (pt)
              </label>
              <input
                type="number"
                step="0.5"
                min={8}
                max={16}
                value={templateRapor.fontSizeBody}
                onChange={(e) =>
                  setTemplateRapor({
                    ...templateRapor,
                    fontSizeBody: Number(e.target.value),
                  })
                }
                className="w-full text-sm font-mono border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Warna Header Tabel Rapor
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={templateRapor.headerBgColor}
                  onChange={(e) =>
                    setTemplateRapor({
                      ...templateRapor,
                      headerBgColor: e.target.value,
                    })
                  }
                  className="w-10 h-10 border border-neutral-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={templateRapor.headerBgColor}
                  onChange={(e) =>
                    setTemplateRapor({
                      ...templateRapor,
                      headerBgColor: e.target.value,
                    })
                  }
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-6 text-xs text-neutral-800">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={templateRapor.useArabicDigits}
                onChange={(e) =>
                  setTemplateRapor({
                    ...templateRapor,
                    useArabicDigits: e.target.checked,
                  })
                }
                className="rounded text-neutral-900"
              />
              <span>Gunakan Angka Arab Timur (١, ٢, ٣...) pada kolom nomor & nilai</span>
            </label>
          </div>
        </div>

        {/* Section 3: Label Header Kolom Rapor Arab */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="text-base font-bold text-neutral-900">
              3. Teks Header Kolom Tabel Rapor (RTL)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Urutan kolom dari kanan ke kiri pada tabel evaluasi rapor individual.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Kolom 1: Nomor (Kanan)
              </label>
              <input
                type="text"
                dir="rtl"
                value={templateRapor.columnLabels.no}
                onChange={(e) =>
                  setTemplateRapor({
                    ...templateRapor,
                    columnLabels: { ...templateRapor.columnLabels, no: e.target.value },
                  })
                }
                className="w-full text-base font-arabic font-bold border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Kolom 2: Mata Pelajaran
              </label>
              <input
                type="text"
                dir="rtl"
                value={templateRapor.columnLabels.pelajaran}
                onChange={(e) =>
                  setTemplateRapor({
                    ...templateRapor,
                    columnLabels: {
                      ...templateRapor.columnLabels,
                      pelajaran: e.target.value,
                    },
                  })
                }
                className="w-full text-base font-arabic font-bold border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Kolom 3: Kelas
              </label>
              <input
                type="text"
                dir="rtl"
                value={templateRapor.columnLabels.kelas}
                onChange={(e) =>
                  setTemplateRapor({
                    ...templateRapor,
                    columnLabels: { ...templateRapor.columnLabels, kelas: e.target.value },
                  })
                }
                className="w-full text-base font-arabic font-bold border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Kolom 4: Hasil / Nilai (Kiri)
              </label>
              <input
                type="text"
                dir="rtl"
                value={templateRapor.columnLabels.hasil}
                onChange={(e) =>
                  setTemplateRapor({
                    ...templateRapor,
                    columnLabels: { ...templateRapor.columnLabels, hasil: e.target.value },
                  })
                }
                className="w-full text-base font-arabic font-bold border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 text-center"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Format Rekapitulasi Nilai Mata Pelajaran (A5 Portrait) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="text-base font-bold text-neutral-900">
              4. Format Cetak Rekapitulasi Nilai Mata Pelajaran
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Standar panitia ulangan umum 1448/2026 adalah ukuran <strong>A5 Potret (148 × 210 mm)</strong>, serasi dengan rapot individual.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Ukuran Kertas Rekap
              </label>
              <select
                value={templateRekap.paperSize || 'A5'}
                onChange={(e) =>
                  setTemplateRekap({
                    ...templateRekap,
                    paperSize: e.target.value as 'A5' | 'A4',
                  })
                }
                className="w-full text-xs font-semibold border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                <option value="A5">A5 (148 × 210 mm) - Standar Panitia Rapor</option>
                <option value="A4">A4 (210 × 297 mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Orientasi Cetak
              </label>
              <select
                value={templateRekap.orientation || 'portrait'}
                onChange={(e) =>
                  setTemplateRekap({
                    ...templateRekap,
                    orientation: e.target.value as 'portrait' | 'landscape',
                  })
                }
                className="w-full text-xs font-semibold border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                <option value="portrait">↕ Potret (148 × 210 mm) - Standar Pas Rapor</option>
                <option value="landscape">↔ Lanskap (210 × 148 mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Ukuran Font Tabel (pt)
              </label>
              <input
                type="number"
                step="0.5"
                min="6"
                max="12"
                value={templateRekap.fontSize || 7.5}
                onChange={(e) =>
                  setTemplateRekap({
                    ...templateRekap,
                    fontSize: parseFloat(e.target.value) || 7.5,
                  })
                }
                className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Rekomendasi A5: 7 - 8 pt</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Tinggi Baris (mm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.4"
                max="5"
                value={templateRekap.rowHeightMm ?? 1.2}
                onChange={(e) =>
                  setTemplateRekap({
                    ...templateRekap,
                    rowHeightMm: parseFloat(e.target.value) || 1.2,
                  })
                }
                className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Standar: 1.2 mm (0.8 - 2.5)</p>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200">
            <label className="block text-xs font-bold text-neutral-800 uppercase mb-2">
              Margin Cetak Tabel Rekapitulasi (Milimeter)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Margin Atas (mm)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={templateRekap.marginTopMm ?? 5}
                  onChange={(e) =>
                    setTemplateRekap({
                      ...templateRekap,
                      marginTopMm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Margin Bawah (mm)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={templateRekap.marginBottomMm ?? 5}
                  onChange={(e) =>
                    setTemplateRekap({
                      ...templateRekap,
                      marginBottomMm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Margin Kiri (mm)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={templateRekap.marginLeftMm ?? 6}
                  onChange={(e) =>
                    setTemplateRekap({
                      ...templateRekap,
                      marginLeftMm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Margin Kanan (mm)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={templateRekap.marginRightMm ?? 6}
                  onChange={(e) =>
                    setTemplateRekap({
                      ...templateRekap,
                      marginRightMm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900"
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5">
              Rekomendasi A5 Potret: Atas/Bawah 4 - 6 mm, Kiri/Kanan 5 - 7 mm agar proporsional dan tidak mepet tepi.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-800 uppercase">
                Elemen Tulisan Header Rekapitulasi (Kop)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  checked={templateRekap.header?.showHeader ?? true}
                  onChange={(e) =>
                    setTemplateRekap({
                      ...templateRekap,
                      header: {
                        ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                        showHeader: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-neutral-900"
                />
                <span>Tampilkan Header</span>
              </label>
            </div>

            {(templateRekap.header?.showHeader ?? true) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateRekap.header?.showLembaga ?? true}
                    onChange={(e) =>
                      setTemplateRekap({
                        ...templateRekap,
                        header: {
                          ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                          showLembaga: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-neutral-900"
                  />
                  <span>Nama Lembaga & Kulliyah</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateRekap.header?.showJudul ?? true}
                    onChange={(e) =>
                      setTemplateRekap({
                        ...templateRekap,
                        header: {
                          ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                          showJudul: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-neutral-900"
                  />
                  <span>Judul Dokumen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateRekap.header?.showPelajaran ?? true}
                    onChange={(e) =>
                      setTemplateRekap({
                        ...templateRekap,
                        header: {
                          ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                          showPelajaran: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-neutral-900"
                  />
                  <span>Nama Pelajaran</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateRekap.header?.showNamaArabMapel ?? true}
                    onChange={(e) =>
                      setTemplateRekap({
                        ...templateRekap,
                        header: {
                          ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                          showNamaArabMapel: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-neutral-900"
                  />
                  <span>Teks Arab Pelajaran</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateRekap.header?.showTingkat ?? true}
                    onChange={(e) =>
                      setTemplateRekap({
                        ...templateRekap,
                        header: {
                          ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                          showTingkat: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-neutral-900"
                  />
                  <span>Info Tingkat / Kelas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateRekap.header?.showPeriode ?? true}
                    onChange={(e) =>
                      setTemplateRekap({
                        ...templateRekap,
                        header: {
                          ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                          showPeriode: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-neutral-900"
                  />
                  <span>Info Periode Semester</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateRekap.header?.showTanggal ?? true}
                    onChange={(e) =>
                      setTemplateRekap({
                        ...templateRekap,
                        header: {
                          ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                          showTanggal: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-neutral-900"
                  />
                  <span>Tanggal Cetak</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateRekap.header?.showTotalKelas ?? true}
                    onChange={(e) =>
                      setTemplateRekap({
                        ...templateRekap,
                        header: {
                          ...(templateRekap.header || DEFAULT_HEADER_REKAP),
                          showTotalKelas: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-neutral-900"
                  />
                  <span>Total Kelas</span>
                </label>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-neutral-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateRekap.showRanking}
                onChange={(e) =>
                  setTemplateRekap({ ...templateRekap, showRanking: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Tampilkan Kolom Rank</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateRekap.showNilaiSebelumnya}
                onChange={(e) =>
                  setTemplateRekap({ ...templateRekap, showNilaiSebelumnya: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Tampilkan Rata 2025</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateRekap.showNilaiBerjalan}
                onChange={(e) =>
                  setTemplateRekap({ ...templateRekap, showNilaiBerjalan: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Tampilkan Rata 2026</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateRekap.showSelisih}
                onChange={(e) =>
                  setTemplateRekap({ ...templateRekap, showSelisih: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Tampilkan Selisih</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateRekap.showPersentase}
                onChange={(e) =>
                  setTemplateRekap({ ...templateRekap, showPersentase: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Tampilkan %</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateRekap.showTren}
                onChange={(e) =>
                  setTemplateRekap({ ...templateRekap, showTren: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Tampilkan Kolom Ket</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={templateRekap.showStatistik}
                onChange={(e) =>
                  setTemplateRekap({ ...templateRekap, showStatistik: e.target.checked })
                }
                className="rounded text-neutral-900"
              />
              <span>Tampilkan Baris Rata-rata Keseluruhan</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
