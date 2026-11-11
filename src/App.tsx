/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar.tsx';
import { Header } from './components/Layout/Header.tsx';
import { DashboardView } from './components/Dashboard/DashboardView.tsx';
import { TeacherListView } from './components/Teachers/TeacherListView.tsx';
import { AssignmentListView } from './components/Assignments/AssignmentListView.tsx';
import { ExcelImportView } from './components/Excel/ExcelImportView.tsx';
import { GradebookView } from './components/Grades/GradebookView.tsx';
import { IndividualReportGenerator } from './components/Reports/IndividualReportGenerator.tsx';
import { SubjectRecapGenerator } from './components/Reports/SubjectRecapGenerator.tsx';
import { TemplateSettingsView } from './components/Templates/TemplateSettingsView.tsx';
import { ArchiveListView } from './components/Archive/ArchiveListView.tsx';
import { InstitutionSettingsView } from './components/Settings/InstitutionSettingsView.tsx';
import { BackupRestoreView } from './components/Backup/BackupRestoreView.tsx';
import { db, subscribeDb } from './services/db.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activePeriod, setActivePeriod] = useState(db.getActivePeriod());
  const [settings, setSettings] = useState(db.getSettings());

  // Listen to hash change from browser navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveTab(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update URL hash when tab changes
  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Subscribe to DB updates
  useEffect(() => {
    const updateState = () => {
      setActivePeriod(db.getActivePeriod());
      setSettings(db.getSettings());
    };
    return subscribeDb(updateState);
  }, []);

  const handleResetDemo = () => {
    if (confirm('Muat ulang Data Demo lengkap?')) {
      db.resetDemo();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        institutionName={settings.namaLembagaLatin}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          activePeriod={activePeriod}
          onQuickImport={() => handleSelectTab('excel-import')}
          onResetDemo={handleResetDemo}
        />

        {/* Viewport View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView onNavigate={handleSelectTab} />}
            {activeTab === 'teachers' && <TeacherListView />}
            {activeTab === 'assignments' && <AssignmentListView />}
            {activeTab === 'excel-import' && <ExcelImportView />}
            {activeTab === 'gradebook' && <GradebookView />}
            {activeTab === 'individual-reports' && <IndividualReportGenerator />}
            {activeTab === 'subject-recap' && <SubjectRecapGenerator />}
            {activeTab === 'templates' && <TemplateSettingsView />}
            {activeTab === 'archive' && <ArchiveListView />}
            {activeTab === 'institution' && <InstitutionSettingsView />}
            {activeTab === 'backup' && <BackupRestoreView />}
          </div>
        </main>
      </div>
    </div>
  );
}
