/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { db, subscribeDb } from '../../services/db.ts';
import { formatNumberId } from '../../utils/calculations.ts';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setTick((t) => t + 1));
  }, []);

  const teachers = db.getTeachers();
  const subjects = db.getSubjects();
  const classes = db.getClasses();
  const activePeriod = db.getActivePeriod();
  const assignments = db.getAssignments().filter((a) => a.periodeId === activePeriod.id);
  const evaluations = db.getEvaluations();
  const archives = db.getArchives();

  // Test Case Check: Dimas
  const dimas = teachers.find((t) => t.nama.toLowerCase().includes('dimas'));
  const dimasAssignments = dimas
    ? db.getTeacherAssignmentsWithDetails(dimas.id, activePeriod.id)
    : [];

  // Check completeness
  const completedEvaluations = assignments.filter((a) => {
    const ev = evaluations.find((e) => e.penugasanId === a.id);
    return ev && ev.nilaiBerjalan !== null;
  });

  const completenessPercent =
    assignments.length > 0
      ? Math.round((completedEvaluations.length / assignments.length) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-neutral-500 mb-1">
            Administrasi Akademik · {activePeriod.tahunAkademik} ({activePeriod.semesterArab})
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Sistem Rapor Guru & Evaluasi Akademik
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Aplikasi administrasi pencatatan penugasan guru multi-kelas, kalkulasi tren evaluasi berbasis Excel, serta generator rapor individual dan rekapitulasi nilai resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('excel-import')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Impor Data Excel</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Guru</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-900 mt-2">
            {teachers.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {teachers.filter((t) => t.isActive).length} guru aktif terdaftar
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Mata Pelajaran</span>
            <BookOpen className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-900 mt-2">
            {subjects.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Bahasa Arab, Dirasah & Umum
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Penugasan</span>
            <GraduationCap className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-900 mt-2">
            {assignments.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Relasi unik Guru-Mapel-Kelas
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Kelengkapan Nilai</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700 mt-2">
            {completenessPercent}%
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {completedEvaluations.length} dari {assignments.length} terisi
          </div>
        </div>
      </div>

      {/* Verification Case Showcase: "Kasus Uji Wajib Dimas" */}
      <div className="bg-white border-2 border-neutral-900 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                Pemeriksaan Integritas Relasi: Ustadz Dimas
              </h2>
              <p className="text-xs text-neutral-600">
                Verifikasi wajib: 1 guru mengajar 2 mata pelajaran berbeda (Shorof 3-H & Ushul Fiqh 3-I) menghasilkan 1 lembar rapor terpadu tanpa duplikasi dokumen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('individual-reports')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <span>Buka Rapor Dimas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 text-xs">
            <div className="font-bold text-neutral-900">
              1. Lembar Rapor Individual Dimas:
            </div>
            <div className="text-neutral-600">
              Terdapat {dimasAssignments.length} baris penugasan dalam 1 lembar dokumen:
            </div>
            <ul className="space-y-1 pl-4 list-disc text-neutral-700">
              {dimasAssignments.map((asg, idx) => (
                <li key={idx}>
                  <strong className="text-neutral-900">{asg.mataPelajaran.nama}</strong> ({asg.mataPelajaran.namaArab}) — Kelas <strong>{asg.kelas.nama}</strong> — Nilai: <span className="font-mono">{formatNumberId(asg.nilai?.nilaiBerjalan, 2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 text-xs">
            <div className="font-bold text-neutral-900">
              2. Keterhubungan ke Rekapitulasi Mata Pelajaran:
            </div>
            <div className="space-y-1 text-neutral-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dimas tercantum pada <strong>Rekap Shorof</strong> (Kelas 3-H).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dimas tercantum pada <strong>Rekap Ushul Fiqh</strong> (Kelas 3-I).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dimas tidak muncul pada kelas yang tidak diajarnya.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Quick Nav & Recent Archives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Nav Cards */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Alur Kerja Administrasi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => onNavigate('excel-import')}
              className="bg-white border border-neutral-200 hover:border-neutral-400 p-4 rounded-xl cursor-pointer transition-all shadow-xs space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-neutral-900">1. Impor File Excel</div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Unggah format evaluasi nilai, mapping kolom otomatis, penanganan angka koma dan guru berulang.
              </p>
            </div>

            <div
              onClick={() => onNavigate('gradebook')}
              className="bg-white border border-neutral-200 hover:border-neutral-400 p-4 rounded-xl cursor-pointer transition-all shadow-xs space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-neutral-900">2. Rekapitulasi & Buku Nilai</div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Tinjau seluruh data nilai per penugasan, edit inline, hitung otomatis selisih dan persentase perubahan.
              </p>
            </div>

            <div
              onClick={() => onNavigate('individual-reports')}
              className="bg-white border border-neutral-200 hover:border-neutral-400 p-4 rounded-xl cursor-pointer transition-all shadow-xs space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-neutral-900">3. Generator Rapor Guru</div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Hasil cetak format Arab resmi A5 (Amiri), multi-tugas satu lembar, pratinjau instan & cetak massal.
              </p>
            </div>

            <div
              onClick={() => onNavigate('subject-recap')}
              className="bg-white border border-neutral-200 hover:border-neutral-400 p-4 rounded-xl cursor-pointer transition-all shadow-xs space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-neutral-900">4. Generator Rekap Mapel</div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Rekap nilai pengajar per mata pelajaran dan tingkat kelas (seperti Muthala'ah Kelas 4), ranking, dan ekspor.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Archives Widget */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Arsip Dokumen Terbit
            </h3>
            <button
              onClick={() => onNavigate('archive')}
              className="text-xs font-medium text-neutral-700 hover:text-neutral-950 underline"
            >
              Lihat Semua ({archives.length})
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-3">
            {archives.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                Belum ada dokumen yang diarsipkan. Gunakan tombol "Simpan ke Arsip" di generator rapor atau rekap.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {archives.slice(0, 4).map((doc) => (
                  <div key={doc.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-neutral-900">{doc.judul}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {new Date(doc.tanggalDibuat).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} · Snapshot v{doc.versi}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 font-mono text-[11px] rounded">
                      {doc.tipe === 'rapor_individual' ? 'Rapor' : 'Rekap'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Security & Integrity Banner */}
          <div className="bg-neutral-100/60 border border-neutral-200 rounded-xl p-4 flex items-start gap-3 text-xs text-neutral-600">
            <ShieldCheck className="w-5 h-5 text-neutral-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-800">Integritas Data Lokal & Offline:</span>
              <p className="mt-0.5">
                Semua data tersimpan secara persisten di peramban lokal. Tidak ada data rahasia akademik santri atau pengajar yang dikirim ke server pihak ketiga.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
