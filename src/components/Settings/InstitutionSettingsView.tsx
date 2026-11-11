/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  Check,
  Calendar,
  Plus,
} from 'lucide-react';
import { db, subscribeDb } from '../../services/db.ts';
import { InstitutionSettings, PeriodeAkademik } from '../../types/index.ts';

export const InstitutionSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<InstitutionSettings>(db.getSettings());
  const [periods, setPeriods] = useState<PeriodeAkademik[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newPeriodModal, setNewPeriodModal] = useState(false);
  const [newPeriodForm, setNewPeriodForm] = useState({
    tahunAkademik: '1448 / 2026',
    semester: 'Semester 2 (Genap)',
    semesterArab: 'الفصل الدراسي الثاني',
    tahunArab: '١٤٤٨ / ٢٠٢٦',
  });

  const loadData = () => {
    setSettings(db.getSettings());
    setPeriods(db.getPeriods());
  };

  useEffect(() => {
    loadData();
    return subscribeDb(loadData);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(settings);
    showToast('Identitas lembaga dan pengesahan berhasil disimpan.');
  };

  const handleSetActivePeriod = (pId: string) => {
    const updated = periods.map((p) => ({
      ...p,
      isAktif: p.id === pId,
    }));
    updated.forEach((p) => db.savePeriod(p));
    setPeriods(updated);
    showToast('Periode aktif berhasil diperbarui.');
  };

  const handleAddPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const newP: PeriodeAkademik = {
      id: `p-${Date.now()}`,
      nama: `${newPeriodForm.semester} - ${newPeriodForm.tahunAkademik}`,
      tahunAkademik: newPeriodForm.tahunAkademik,
      semester: newPeriodForm.semester,
      semesterArab: newPeriodForm.semesterArab,
      tahunArab: newPeriodForm.tahunArab,
      isAktif: true,
      isDefault: false,
    };
    db.savePeriod(newP);
    setNewPeriodModal(false);
    showToast(`Periode ${newP.nama} berhasil ditambahkan dan diaktifkan.`);
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
            Pengaturan Lembaga & Periode Akademik
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Konfigurasi identitas resmi lembaga, nama dalam bahasa Arab dan Latin, serta manajemen periode aktif.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Institution Details Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-5"
          >
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Identitas Lembaga</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Digunakan pada header dokumen cetak dan titimangsa tanda tangan.
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Nama Lembaga (Bahasa Arab)
              </label>
              <input
                type="text"
                dir="rtl"
                required
                value={settings.namaLembagaArab}
                onChange={(e) =>
                  setSettings({ ...settings, namaLembagaArab: e.target.value })
                }
                className="w-full text-base font-arabic font-bold border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900 text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Nama Bagian / Kulliyyah (Bahasa Arab)
              </label>
              <input
                type="text"
                dir="rtl"
                required
                value={settings.namaKulliyahArab}
                onChange={(e) =>
                  setSettings({ ...settings, namaKulliyahArab: e.target.value })
                }
                className="w-full text-base font-arabic border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900 text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Nama Lembaga (Latin / Indonesia)
              </label>
              <input
                type="text"
                required
                value={settings.namaLembagaLatin}
                onChange={(e) =>
                  setSettings({ ...settings, namaLembagaLatin: e.target.value })
                }
                className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Kota Titimangsa Surat
                </label>
                <input
                  type="text"
                  value={settings.kotaSurat}
                  onChange={(e) =>
                    setSettings({ ...settings, kotaSurat: e.target.value })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Unit Kerja Bawaan (Default)
                </label>
                <input
                  type="text"
                  value={settings.unitKerjaDefault}
                  onChange={(e) =>
                    setSettings({ ...settings, unitKerjaDefault: e.target.value })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3">
                Pengesahan / Pejabat Penandatangan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Nama Pejabat Penandatangan
                  </label>
                  <input
                    type="text"
                    value={settings.penandatanganNama}
                    onChange={(e) =>
                      setSettings({ ...settings, penandatanganNama: e.target.value })
                    }
                    className="w-full text-sm font-medium border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Jabatan Pejabat Penandatangan
                  </label>
                  <input
                    type="text"
                    value={settings.penandatanganJabatan}
                    onChange={(e) =>
                      setSettings({ ...settings, penandatanganJabatan: e.target.value })
                    }
                    className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Academic Periods */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Periode Akademik</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Tentukan periode yang aktif untuk pelaporan rapor.
                </p>
              </div>

              <button
                onClick={() => setNewPeriodModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Periode</span>
              </button>
            </div>

            <div className="space-y-3">
              {periods.map((p) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-lg border transition-colors flex items-center justify-between ${
                    p.isAktif
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">{p.nama}</div>
                    <div
                      className={`text-xs mt-0.5 font-arabic ${
                        p.isAktif ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                      dir="rtl"
                    >
                      {p.semesterArab} · {p.tahunArab}
                    </div>
                  </div>

                  <div>
                    {p.isAktif ? (
                      <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                        Aktif Sekarang
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetActivePeriod(p.id)}
                        className="text-xs font-medium px-2.5 py-1 bg-white border border-neutral-300 text-neutral-800 rounded hover:bg-neutral-50"
                      >
                        Aktifkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add Period */}
      {newPeriodModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-neutral-900">Tambah Periode Akademik Baru</h2>
            <form onSubmit={handleAddPeriod} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Tahun Akademik (Latin)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1448 / 2026"
                  value={newPeriodForm.tahunAkademik}
                  onChange={(e) =>
                    setNewPeriodForm({ ...newPeriodForm, tahunAkademik: e.target.value })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Nama Semester (Latin)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semester 2 (Genap)"
                  value={newPeriodForm.semester}
                  onChange={(e) =>
                    setNewPeriodForm({ ...newPeriodForm, semester: e.target.value })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Semester (Bahasa Arab)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  required
                  placeholder="الفصل الدراسي الثاني"
                  value={newPeriodForm.semesterArab}
                  onChange={(e) =>
                    setNewPeriodForm({ ...newPeriodForm, semesterArab: e.target.value })
                  }
                  className="w-full text-base font-arabic border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Tahun (Bahasa Arab)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  required
                  placeholder="١٤٤٨ / ٢٠٢٦"
                  value={newPeriodForm.tahunArab}
                  onChange={(e) =>
                    setNewPeriodForm({ ...newPeriodForm, tahunArab: e.target.value })
                  }
                  className="w-full text-base font-arabic border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 text-right"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setNewPeriodModal(false)}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800"
                >
                  Simpan Periode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
