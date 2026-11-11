/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileSpreadsheet,
  FileCheck2,
  FileText,
  TrendingUp,
  Sliders,
  Archive,
  Building2,
  Database,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  institutionName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  institutionName,
}) => {
  const menuItems = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'teachers', label: '2. Data Guru', icon: Users },
    { id: 'assignments', label: '3. Data Penugasan Mengajar', icon: GraduationCap },
    { id: 'excel-import', label: '4. Impor Excel', icon: FileSpreadsheet },
    { id: 'gradebook', label: '5. Rekapitulasi Nilai', icon: FileCheck2 },
    { id: 'individual-reports', label: '6. Generator Rapor Individual', icon: FileText },
    { id: 'subject-recap', label: '7. Generator Rekap Mata Pelajaran', icon: TrendingUp },
    { id: 'templates', label: '8. Template Dokumen', icon: Sliders },
    { id: 'archive', label: '9. Arsip Dokumen', icon: Archive },
    { id: 'institution', label: '10. Pengaturan Lembaga', icon: Building2 },
    { id: 'backup', label: '11. Backup & Restore Data', icon: Database },
  ];

  return (
    <aside className="no-print w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0 select-none">
      {/* Brand & Institution Info */}
      <div className="p-5 border-b border-neutral-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0">
            SRG
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-neutral-900 truncate tracking-tight">
              SISTEM RAPOR GURU
            </h1>
            <p className="text-[11px] text-neutral-500 truncate">
              {institutionName || 'Pondok Modern Darussalam Gontor'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1.5">
          Menu Administrasi
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-neutral-500'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Details */}
      <div className="p-3 border-t border-neutral-200 text-[11px] text-neutral-500 bg-neutral-50/50">
        <div className="flex items-center justify-between">
          <span className="font-mono text-neutral-600">v2.4 · Offline Local</span>
          <span className="font-arabic text-neutral-700 font-bold" dir="rtl">
            ١٤٤٨ هـ
          </span>
        </div>
      </div>
    </aside>
  );
};
