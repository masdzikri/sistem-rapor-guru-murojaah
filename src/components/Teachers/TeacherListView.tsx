/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  BookOpen,
} from 'lucide-react';
import { db, subscribeDb } from '../../services/db.ts';
import { Guru } from '../../types/index.ts';

export const TeacherListView: React.FC = () => {
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [search, setSearch] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Guru | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState<Guru | null>(null);

  const activePeriod = db.getActivePeriod();

  const loadData = () => {
    setTeachers(db.getTeachers());
  };

  useEffect(() => {
    loadData();
    return subscribeDb(loadData);
  }, []);

  const filteredTeachers = teachers.filter((t) =>
    t.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.nip.includes(search) ||
    (t.unitKerja && t.unitKerja.toLowerCase().includes(search.toLowerCase())) ||
    (t.namaArab && t.namaArab.includes(search))
  );

  const handleOpenAdd = () => {
    setEditingTeacher({
      id: `g-${Date.now()}`,
      nip: '',
      nama: '',
      namaArab: '',
      unitKerja: 'KMI Gontor',
      isActive: true,
      catatan: '',
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Guru) => {
    setEditingTeacher({ ...t });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingTeacher.nama.trim()) {
      alert('Nama guru wajib diisi!');
      return;
    }
    db.saveTeacher(editingTeacher);
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pengajar "${nama}" beserta seluruh penugasannya?`)) {
      db.deleteTeacher(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Data Pengajar / Guru
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manajemen identitas pengajar, tahun, nama Arab, dan unit kerja lembaga.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengajar</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari nama, tahun, atau unit kerja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm border border-neutral-300 rounded-lg pl-9 pr-3 py-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div className="text-xs text-neutral-500 font-mono">
          Total Pengajar: {filteredTeachers.length}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Rank</th>
                <th className="px-4 py-3">Nama Pengajar (Latin)</th>
                <th className="px-4 py-3 font-arabic text-right">الاسم بالعربية</th>
                <th className="px-4 py-3">Tahun</th>
                <th className="px-4 py-3">Unit / Bagian Kerja</th>
                <th className="px-4 py-3 text-center">Penugasan ({activePeriod.tahunAkademik})</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    Tidak ada data pengajar yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, index) => {
                  const assignments = db.getTeacherAssignmentsWithDetails(
                    teacher.id,
                    activePeriod.id
                  );

                  const rankVal =
                    assignments.find((a) => a.nilai?.rankingSumber != null)?.nilai?.rankingSumber ??
                    (index + 1);

                  return (
                    <tr key={teacher.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-neutral-800 font-mono text-xs font-semibold">
                        {rankVal}
                      </td>

                      <td className="px-4 py-3 font-semibold text-neutral-900">
                        {teacher.nama}
                      </td>

                      <td className="px-4 py-3 font-arabic text-right text-base text-neutral-800" dir="rtl">
                        {teacher.namaArab || '—'}
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                        {teacher.nip || '—'}
                      </td>

                      <td className="px-4 py-3 text-xs text-neutral-600">
                        {teacher.unitKerja || '—'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedTeacherForDetail(teacher)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs font-semibold transition-colors"
                          title="Klik untuk melihat rincian mata pelajaran & kelas"
                        >
                          <BookOpen className="w-3 h-3 text-neutral-500" />
                          <span>{assignments.length} Penugasan</span>
                        </button>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                            teacher.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {teacher.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(teacher)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded hover:bg-neutral-100"
                            title="Edit Pengajar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(teacher.id, teacher.nama)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Hapus Pengajar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Teacher */}
      {isModalOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-lg font-bold text-neutral-900">
                {editingTeacher.id ? 'Edit Data Pengajar' : 'Tambah Pengajar Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Nama Lengkap (Latin) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Ustadz Dimas"
                  value={editingTeacher.nama}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, nama: e.target.value })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Nama dalam Aksara Arab (Opsional)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="e.g. أ. ديماس"
                  value={editingTeacher.namaArab || ''}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, namaArab: e.target.value })
                  }
                  className="w-full text-base font-arabic border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Tahun
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026 atau 2024"
                    value={editingTeacher.nip}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, nip: e.target.value })
                    }
                    className="w-full text-sm font-mono border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Unit / Bagian Kerja
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Perpustakaan UNIDA"
                    value={editingTeacher.unitKerja || ''}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, unitKerja: e.target.value })
                    }
                    className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingTeacher.isActive}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, isActive: e.target.checked })
                  }
                  className="rounded text-neutral-900"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-neutral-800">
                  Status Pengajar Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Detail Modal for Teacher Assignments */}
      {selectedTeacherForDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  Penugasan Mengajar: {selectedTeacherForDetail.nama}
                </h2>
                <p className="text-xs text-neutral-500">
                  {selectedTeacherForDetail.unitKerja || 'KMI Gontor'} · Periode {activePeriod.nama}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeacherForDetail(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {db.getTeacherAssignmentsWithDetails(selectedTeacherForDetail.id, activePeriod.id).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between bg-neutral-50/50"
                  >
                    <div>
                      <div className="font-semibold text-sm text-neutral-900">
                        {item.mataPelajaran.nama} ({item.mataPelajaran.namaArab || ''})
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Kelas: <strong className="text-neutral-800">{item.kelas.nama}</strong>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs text-neutral-500">Nilai Berjalan:</div>
                      <div className="text-sm font-bold text-neutral-900">
                        {item.nilai?.nilaiBerjalan !== null && item.nilai?.nilaiBerjalan !== undefined
                          ? item.nilai.nilaiBerjalan.toFixed(2).replace('.', ',')
                          : '—'}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-200">
              <button
                onClick={() => setSelectedTeacherForDetail(null)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
