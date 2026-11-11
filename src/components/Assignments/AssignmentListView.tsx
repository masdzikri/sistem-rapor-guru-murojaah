/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Trash2,
  X,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { db, subscribeDb } from '../../services/db.ts';
import { PenugasanMengajar, Guru, MataPelajaran, Kelas, PeriodeAkademik } from '../../types/index.ts';
import { formatNumberId } from '../../utils/calculations.ts';

export const AssignmentListView: React.FC = () => {
  const [assignments, setAssignments] = useState<PenugasanMengajar[]>([]);
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [periods, setPeriods] = useState<PeriodeAkademik[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    guruId: '',
    mataPelajaranId: '',
    kelasId: '',
    periodeId: '',
    status: 'aktif' as const,
    catatan: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = () => {
    setAssignments(db.getAssignments());
    setTeachers(db.getTeachers());
    setSubjects(db.getSubjects());
    setClasses(db.getClasses());
    const pList = db.getPeriods();
    setPeriods(pList);
    const active = db.getActivePeriod();
    if (!selectedPeriodId) setSelectedPeriodId(active.id);
  };

  useEffect(() => {
    loadData();
    return subscribeDb(loadData);
  }, []);

  const currentPeriod =
    periods.find((p) => p.id === selectedPeriodId) || db.getActivePeriod();

  // Filter assignments
  const filtered = assignments.filter((asg) => {
    if (asg.periodeId !== selectedPeriodId) return false;
    if (filterTeacher !== 'all' && asg.guruId !== filterTeacher) return false;
    if (filterSubject !== 'all' && asg.mataPelajaranId !== filterSubject) return false;

    if (search) {
      const t = teachers.find((x) => x.id === asg.guruId);
      const s = subjects.find((x) => x.id === asg.mataPelajaranId);
      const c = classes.find((x) => x.id === asg.kelasId);
      const query = search.toLowerCase();
      const matchTeacher = t?.nama.toLowerCase().includes(query);
      const matchSubject = s?.nama.toLowerCase().includes(query);
      const matchClass = c?.nama.toLowerCase().includes(query);
      if (!matchTeacher && !matchSubject && !matchClass) return false;
    }

    return true;
  });

  const handleOpenAdd = () => {
    setErrorMessage(null);
    setModalForm({
      guruId: teachers[0]?.id || '',
      mataPelajaranId: subjects[0]?.id || '',
      kelasId: classes[0]?.id || '',
      periodeId: selectedPeriodId,
      status: 'aktif',
      catatan: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!modalForm.guruId || !modalForm.mataPelajaranId || !modalForm.kelasId) {
      setErrorMessage('Pilih Guru, Mata Pelajaran, dan Kelas!');
      return;
    }

    const newAsg: PenugasanMengajar = {
      id: `asg-${modalForm.guruId}-${modalForm.mataPelajaranId}-${modalForm.kelasId}-${Date.now().toString(36)}`,
      guruId: modalForm.guruId,
      mataPelajaranId: modalForm.mataPelajaranId,
      kelasId: modalForm.kelasId,
      periodeId: modalForm.periodeId || selectedPeriodId,
      status: modalForm.status,
      catatan: modalForm.catatan,
      createdAt: new Date().toISOString(),
    };

    const res = db.saveAssignment(newAsg);
    if (!res.success) {
      setErrorMessage(res.message || 'Gagal menyimpan penugasan.');
      return;
    }

    setIsModalOpen(false);
  };

  const handleDelete = (asg: PenugasanMengajar) => {
    const t = teachers.find((x) => x.id === asg.guruId);
    const s = subjects.find((x) => x.id === asg.mataPelajaranId);
    const c = classes.find((x) => x.id === asg.kelasId);

    if (
      confirm(
        `Hapus penugasan ${t?.nama || 'Guru'} untuk pelajaran ${s?.nama || 'Mapel'} di kelas ${
          c?.nama || 'Kelas'
        }? Nilai terkait juga akan dihapus.`
      )
    ) {
      db.deleteAssignment(asg.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Data Penugasan Mengajar
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Relasi individual antara Guru, Mata Pelajaran, Kelas, dan Periode Akademik.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Penugasan</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Periode */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
            Periode Akademik:
          </label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-full text-xs border border-neutral-300 rounded-md p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Guru */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
            Filter Pengajar:
          </label>
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="w-full text-xs border border-neutral-300 rounded-md p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">Semua Pengajar ({teachers.length})</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Mapel */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
            Filter Mata Pelajaran:
          </label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full text-xs border border-neutral-300 rounded-md p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">Semua Mata Pelajaran ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} {s.namaArab ? `(${s.namaArab})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
            Cari Cepat:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari guru, kelas, mapel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs border border-neutral-300 rounded-md pl-8 pr-3 py-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Nama Pengajar</th>
                <th className="px-4 py-3">Mata Pelajaran</th>
                <th className="px-4 py-3 text-center">Kelas</th>
                <th className="px-4 py-3 text-center">Periode</th>
                <th className="px-4 py-3 text-right">Nilai Sekarang</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    Tidak ada penugasan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((asg, index) => {
                  const t = teachers.find((x) => x.id === asg.guruId);
                  const s = subjects.find((x) => x.id === asg.mataPelajaranId);
                  const c = classes.find((x) => x.id === asg.kelasId);
                  const ev = db.getEvaluationByAssignment(asg.id);

                  return (
                    <tr key={asg.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-neutral-400 font-mono text-xs">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-semibold text-neutral-900">
                        {t?.nama || '—'}
                      </td>

                      <td className="px-4 py-3 text-neutral-800">
                        {s?.nama || '—'}{' '}
                        {s?.namaArab && (
                          <span className="font-arabic text-neutral-500 text-xs">
                            ({s.namaArab})
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-semibold text-neutral-900">
                        {c?.nama || '—'}
                      </td>

                      <td className="px-4 py-3 text-center text-xs text-neutral-600">
                        {currentPeriod.tahunAkademik}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        {ev?.nilaiBerjalan !== null && ev?.nilaiBerjalan !== undefined
                          ? formatNumberId(ev.nilaiBerjalan, 2)
                          : <span className="text-neutral-400 font-normal">Belum diisi</span>}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {asg.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(asg)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Hapus Penugasan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-lg font-bold text-neutral-900">Tambah Penugasan Baru</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Pengajar / Guru <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={modalForm.guruId}
                  onChange={(e) => setModalForm({ ...modalForm, guruId: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama} ({t.unitKerja || 'KMI'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Mata Pelajaran <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={modalForm.mataPelajaranId}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, mataPelajaranId: e.target.value })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} {s.namaArab ? `(${s.namaArab})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Kelas <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={modalForm.kelasId}
                  onChange={(e) => setModalForm({ ...modalForm, kelasId: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.nama} (Tingkat {c.tingkat})
                    </option>
                  ))}
                </select>
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
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
