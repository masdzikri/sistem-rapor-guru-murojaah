/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Archive,
  Search,
  Eye,
  Trash2,
  Printer,
  X,
  FileCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { db, subscribeDb } from '../../services/db.ts';
import { DocumentArchive } from '../../types/index.ts';
import { ArabicReportCard } from '../Reports/ArabicReportCard.tsx';
import { RecapTableView } from '../Reports/RecapTableView.tsx';

export const ArchiveListView: React.FC = () => {
  const [archives, setArchives] = useState<DocumentArchive[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentArchive | null>(null);

  const loadData = () => {
    setArchives(db.getArchives());
  };

  useEffect(() => {
    loadData();
    return subscribeDb(loadData);
  }, []);

  const filtered = archives.filter(
    (a) =>
      a.judul.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      (a.guruId && a.guruId.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = (doc: DocumentArchive) => {
    if (confirm(`Apakah Anda yakin ingin menghapus arsip dokumen "${doc.judul}"?`)) {
      db.deleteArchive(doc.id);
    }
  };

  const handlePrintModal = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Arsip & Riwayat Snapshot Dokumen
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Daftar dokumen rapor dan rekapitulasi yang telah diterbitkan. Data historis diarsip secara permanen (frozen snapshot) dan tidak berubah saat database diperbarui.
          </p>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari judul arsip atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm border border-neutral-300 rounded-lg pl-9 pr-3 py-2 bg-white text-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div className="text-xs text-neutral-500 font-mono">
          Total Dokumen Terarsip: {filtered.length}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Judul Dokumen</th>
                <th className="px-4 py-3 text-center">Tipe</th>
                <th className="px-4 py-3 text-center">Versi Snapshot</th>
                <th className="px-4 py-3 text-center">Tanggal Diterbitkan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    <Archive className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="font-medium text-neutral-700">Belum ada dokumen yang diarsipkan.</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Klik "Simpan ke Arsip" pada Generator Rapor Individual atau Generator Rekap Mapel untuk membuat snapshot permanen.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-neutral-400 font-mono text-xs">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900">{doc.judul}</div>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">
                        ID: {doc.id}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-block text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                        {doc.tipe === 'rapor_individual' ? 'Rapor Individual' : 'Rekap Mapel'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-neutral-700">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>Snapshot v{doc.versi}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center text-xs text-neutral-600">
                      {new Date(doc.tanggalDibuat).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {doc.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors"
                          title="Buka Pratinjau Dokumen Asli"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pratinjau</span>
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                          title="Hapus Arsip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <div className="text-xs font-bold uppercase text-emerald-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Snapshot Permanen Dokumen Arsip</span>
                </div>
                <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
                  {selectedDoc.judul}
                </h2>
                <div className="text-xs text-neutral-500 font-mono mt-0.5">
                  Arsip dibuat pada: {new Date(selectedDoc.tanggalDibuat).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Ulang Dokumen</span>
                </button>

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="max-h-[75vh] overflow-y-auto border border-neutral-200 rounded-lg p-4 bg-neutral-100 flex justify-center">
              {selectedDoc.tipe === 'rapor_individual' && selectedDoc.snapshotData.guru ? (
                <ArabicReportCard
                  guru={selectedDoc.snapshotData.guru}
                  items={selectedDoc.snapshotData.penugasanList}
                  institution={selectedDoc.snapshotData.institution}
                  periode={selectedDoc.snapshotData.periode}
                  template={db.getTemplateRapor()}
                  previewMode={true}
                />
              ) : selectedDoc.tipe === 'rekap_mata_pelajaran' ? (
                <div className="w-full bg-white p-4 rounded">
                  <RecapTableView
                    mataPelajaran={
                      selectedDoc.snapshotData.penugasanList[0]?.mataPelajaran || {
                        id: 's',
                        nama: 'Mata Pelajaran',
                        isActive: true,
                      }
                    }
                    tingkat={selectedDoc.tingkat || 'all'}
                    periode={selectedDoc.snapshotData.periode}
                    institution={selectedDoc.snapshotData.institution}
                    template={db.getTemplateRekap()}
                    rows={selectedDoc.snapshotData.penugasanList.map((item) => ({
                      penugasan: item.penugasan,
                      mataPelajaran: item.mataPelajaran,
                      kelas: item.kelas,
                      nilai: item.nilai,
                      guru: item.guru || {
                        id: item.penugasan.guruId,
                        nip: '',
                        nama: 'Pengajar',
                        isActive: true,
                        createdAt: '',
                      },
                    }))}
                    previewMode={true}
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500">Format snapshot tidak dikenali.</div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-200">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200"
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
