/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  Save,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { db, subscribeDb } from '../../services/db.ts';
import { PenugasanMengajar, NilaiEvaluasi, Guru, MataPelajaran, Kelas } from '../../types/index.ts';
import {
  parseSafeNumber,
  formatNumberId,
  formatPercentage,
  calculateEvaluation,
} from '../../utils/calculations.ts';

export const GradebookView: React.FC = () => {
  const [assignments, setAssignments] = useState<PenugasanMengajar[]>([]);
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, NilaiEvaluasi>>({});
  const [activePeriodId, setActivePeriodId] = useState<string>('');

  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const period = db.getActivePeriod();
    setActivePeriodId(period.id);
    const asgList = db.getAssignments().filter((a) => a.periodeId === period.id);
    setAssignments(asgList);
    setTeachers(db.getTeachers());
    setSubjects(db.getSubjects());
    setClasses(db.getClasses());

    // Map evaluations by penugasanId
    const evMap: Record<string, NilaiEvaluasi> = {};
    db.getEvaluations().forEach((ev) => {
      evMap[ev.penugasanId] = ev;
    });
    setEvaluations(evMap);
  };

  useEffect(() => {
    loadData();
    return subscribeDb(loadData);
  }, []);

  const handleScoreChange = (
    penugasanId: string,
    field: 'nilaiSebelumnya' | 'nilaiBerjalan',
    rawVal: string
  ) => {
    const currentEv = evaluations[penugasanId] || {
      id: `ev-${penugasanId}`,
      penugasanId,
      nilaiSebelumnya: null,
      nilaiBerjalan: null,
      selisih: null,
      persentase: null,
      tren: 'Belum Lengkap',
      isLengkap: false,
      updatedAt: new Date().toISOString(),
    };

    const num = parseSafeNumber(rawVal);
    const updated = {
      ...currentEv,
      [field]: num,
    };

    // Calculate diff & trend
    const calc = calculateEvaluation(updated.nilaiSebelumnya, updated.nilaiBerjalan);
    updated.selisih = calc.selisih;
    updated.persentase = calc.persentase;
    updated.tren = calc.tren;
    updated.isLengkap = updated.nilaiBerjalan !== null;

    setEvaluations((prev) => ({
      ...prev,
      [penugasanId]: updated,
    }));

    // Auto-save to persistent DB
    db.saveEvaluation(updated);
  };

  const filteredAssignments = assignments.filter((asg) => {
    if (filterSubject !== 'all' && asg.mataPelajaranId !== filterSubject) return false;
    if (search) {
      const t = teachers.find((x) => x.id === asg.guruId);
      const s = subjects.find((x) => x.id === asg.mataPelajaranId);
      const c = classes.find((x) => x.id === asg.kelasId);
      const q = search.toLowerCase();
      if (
        !t?.nama.toLowerCase().includes(q) &&
        !s?.nama.toLowerCase().includes(q) &&
        !c?.nama.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

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
            Rekapitulasi Nilai & Buku Nilai Pengajar
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Pengisian dan peninjauan nilai evaluasi per penugasan. Perhitungan selisih, persentase, dan tren dihitung otomatis secara instan.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Subject Filter */}
          <div className="w-full sm:w-64">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full text-xs border border-neutral-300 rounded-lg p-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
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
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari guru, pelajaran, atau kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs border border-neutral-300 rounded-lg pl-8 pr-3 py-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div className="text-xs text-neutral-500 font-mono">
          Total Baris: {filteredAssignments.length} Penugasan
        </div>
      </div>

      {/* Spreadsheet-like Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">No</th>
                <th className="px-4 py-3">Nama Pengajar</th>
                <th className="px-3 py-3">Mata Pelajaran</th>
                <th className="px-3 py-3 text-center">Kelas</th>
                <th className="px-3 py-3 text-center w-32">Rata - Rata 2025</th>
                <th className="px-3 py-3 text-center w-32">Rata - Rata 2026</th>
                <th className="px-3 py-3 text-right w-24">Selisih</th>
                <th className="px-3 py-3 text-right w-24">Persen</th>
                <th className="px-3 py-3 text-center w-28">Ket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                    Tidak ada penugasan yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asg, index) => {
                  const teacher = teachers.find((t) => t.id === asg.guruId);
                  const subject = subjects.find((s) => s.id === asg.mataPelajaranId);
                  const cls = classes.find((c) => c.id === asg.kelasId);
                  const ev = evaluations[asg.id];

                  return (
                    <tr key={asg.id} className="hover:bg-neutral-50/70">
                      <td className="px-3 py-2 text-center text-neutral-400 font-mono text-xs">
                        {index + 1}
                      </td>

                      <td className="px-4 py-2 font-medium text-neutral-900">
                        {teacher?.nama || '—'}
                      </td>

                      <td className="px-3 py-2 text-neutral-800">
                        {subject?.nama || '—'}
                      </td>

                      <td className="px-3 py-2 text-center font-mono font-semibold text-neutral-900">
                        {cls?.nama || '—'}
                      </td>

                      {/* Input Nilai Sebelumnya */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="text"
                          placeholder="—"
                          defaultValue={ev?.nilaiSebelumnya !== null && ev?.nilaiSebelumnya !== undefined ? formatNumberId(ev.nilaiSebelumnya, 2) : ''}
                          onBlur={(e) =>
                            handleScoreChange(asg.id, 'nilaiSebelumnya', e.target.value)
                          }
                          className="w-24 text-center text-xs font-mono border border-neutral-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-neutral-900"
                        />
                      </td>

                      {/* Input Nilai Berjalan */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="text"
                          placeholder="—"
                          defaultValue={ev?.nilaiBerjalan !== null && ev?.nilaiBerjalan !== undefined ? formatNumberId(ev.nilaiBerjalan, 2) : ''}
                          onBlur={(e) =>
                            handleScoreChange(asg.id, 'nilaiBerjalan', e.target.value)
                          }
                          className="w-24 text-center text-xs font-mono font-semibold border border-neutral-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-neutral-900"
                        />
                      </td>

                      {/* Selisih Otomatis */}
                      <td
                        className={`px-3 py-2 text-right font-mono text-xs tabular-nums ${
                          (ev?.selisih ?? 0) > 0
                            ? 'text-emerald-700 font-semibold'
                            : (ev?.selisih ?? 0) < 0
                            ? 'text-rose-700 font-semibold'
                            : 'text-neutral-500'
                        }`}
                      >
                        {formatNumberId(ev?.selisih, 2)}
                      </td>

                      {/* Persentase Otomatis */}
                      <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-neutral-700">
                        {formatPercentage(ev?.persentase, false, 0)}
                      </td>

                      {/* Tren Otomatis */}
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                            ev?.tren === 'Naik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ev?.tren === 'Turun'
                              ? 'bg-rose-100 text-rose-800'
                              : ev?.tren === 'Tetap'
                              ? 'bg-neutral-100 text-neutral-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ev?.tren === 'Naik' && <TrendingUp className="w-3 h-3 text-emerald-700" />}
                          {ev?.tren === 'Turun' && <TrendingDown className="w-3 h-3 text-rose-700" />}
                          {ev?.tren === 'Tetap' && <Minus className="w-3 h-3 text-neutral-600" />}
                          <span>{ev?.tren || 'Belum Lengkap'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
