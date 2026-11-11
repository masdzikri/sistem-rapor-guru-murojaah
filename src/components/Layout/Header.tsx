/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { PeriodeAkademik } from '../../types/index.ts';

interface HeaderProps {
  activeTab: string;
  activePeriod: PeriodeAkademik;
  onQuickImport: () => void;
  onResetDemo: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard Administrasi',
  teachers: 'Data Pengajar / Guru',
  assignments: 'Data Penugasan Mengajar',
  'excel-import': 'Impor Data Excel',
  gradebook: 'Rekapitulasi Nilai & Buku Nilai',
  'individual-reports': 'Generator Rapor Individual',
  'subject-recap': 'Generator Rekap Mata Pelajaran',
  templates: 'Pengelolaan Template Dokumen',
  archive: 'Arsip & Snapshot Dokumen',
  institution: 'Pengaturan Lembaga',
  backup: 'Cadangan & Pemulihan Data',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  activePeriod,
  onQuickImport,
  onResetDemo,
}) => {
  return (
    <header className="no-print h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 whitespace-nowrap truncate shrink-0">
        <span className="font-medium text-neutral-800">Sistem Akademik</span>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-neutral-900">
          {TAB_TITLES[activeTab] || 'Administrasi'}
        </span>
      </div>

      {/* Zone 2: Active Period Marker (Unboxed text with separators) */}
      <div className="hidden md:flex items-center gap-2 text-xs text-neutral-600 whitespace-nowrap">
        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
        <span className="font-medium text-neutral-900">{activePeriod.nama}</span>
        <span aria-hidden="true">·</span>
        <span className="font-arabic font-bold text-neutral-800" dir="rtl">
          {activePeriod.semesterArab} ({activePeriod.tahunArab})
        </span>
      </div>

      {/* Zone 3: Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onResetDemo}
          title="Muat data demo resmi pengujian"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
          <span className="hidden sm:inline">Data Demo</span>
        </button>

        <button
          onClick={onQuickImport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Impor Excel</span>
        </button>
      </div>
    </header>
  );
};
