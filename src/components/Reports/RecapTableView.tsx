/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  MataPelajaran,
  PeriodeAkademik,
  InstitutionSettings,
  TemplateRekapConfig,
  PenugasanMengajar,
  Kelas,
  NilaiEvaluasi,
  Guru,
} from '../../types/index.ts';
import { formatNumberId, formatPercentage } from '../../utils/calculations.ts';
import { db, DEFAULT_COLUMN_WIDTHS, DEFAULT_HEADER_REKAP } from '../../services/db.ts';

export interface RecapRowItem {
  penugasan: PenugasanMengajar;
  mataPelajaran: MataPelajaran;
  guru: Guru;
  kelas: Kelas;
  nilai: NilaiEvaluasi | null;
  calculatedRank?: number | null;
}

interface RecapTableViewProps {
  mataPelajaran: MataPelajaran;
  tingkat: string;
  tingkatLabel?: string;
  periode: PeriodeAkademik;
  institution: InstitutionSettings;
  template: TemplateRekapConfig;
  rows: RecapRowItem[];
  previewMode?: boolean;
}

export const RecapTableView: React.FC<RecapTableViewProps> = ({
  mataPelajaran,
  tingkat,
  tingkatLabel,
  periode,
  institution,
  template,
  rows,
  previewMode = false,
}) => {
  const isLandscape = template.orientation === 'landscape';
  const isA5 = template.paperSize === 'A5' || !template.paperSize;

  const widthMm = isA5 ? (isLandscape ? '210mm' : '148mm') : (isLandscape ? '297mm' : '210mm');
  const minHeightMm = isA5 ? (isLandscape ? '148mm' : '210mm') : (isLandscape ? '210mm' : '297mm');
  const printClass = isA5
    ? (isLandscape ? 'print-page-recap-a5-landscape' : 'print-page-recap-a5')
    : 'print-page-recap';

  const baseFontSize = template.fontSize || (isA5 ? (isLandscape ? 8.5 : 7.5) : 9);

  // Dynamic Margins & Spacings
  const topMm = template.marginTopMm ?? (isA5 ? 5 : 8);
  const bottomMm = template.marginBottomMm ?? (isA5 ? 5 : 8);
  const leftMm = template.marginLeftMm ?? (isA5 ? 6 : 8);
  const rightMm = template.marginRightMm ?? (isA5 ? 6 : 8);
  const rowPaddingY = template.rowHeightMm ?? 1.2;
  const colWidths = { ...DEFAULT_COLUMN_WIDTHS, ...(template.columnWidths || {}) };
  const headerCfg = {
    ...DEFAULT_HEADER_REKAP,
    ...(template.header || {}),
  };

  // Calculate summary statistics
  const countWithScores = rows.filter((r) => r.nilai?.nilaiBerjalan !== null && r.nilai?.nilaiBerjalan !== undefined);
  const avgPrev =
    rows.filter((r) => r.nilai?.nilaiSebelumnya !== null && r.nilai?.nilaiSebelumnya !== undefined).length > 0
      ? rows.reduce((acc, r) => acc + (r.nilai?.nilaiSebelumnya ?? 0), 0) /
        rows.filter((r) => r.nilai?.nilaiSebelumnya !== null && r.nilai?.nilaiSebelumnya !== undefined).length
      : null;
  const avgCurr =
    countWithScores.length > 0
      ? rows.reduce((acc, r) => acc + (r.nilai?.nilaiBerjalan ?? 0), 0) / countWithScores.length
      : null;
  const avgSelisih = avgPrev !== null && avgCurr !== null ? avgCurr - avgPrev : null;
  const avgPersen = avgPrev && avgPrev > 0 && avgSelisih !== null ? (avgSelisih / avgPrev) * 100 : null;

  return (
    <div
      className={`${printClass} bg-white text-neutral-900 mx-auto select-text ${
        previewMode ? 'border border-neutral-300 shadow-md' : ''
      }`}
      style={{
        width: widthMm,
        minHeight: minHeightMm,
        boxSizing: 'border-box',
        fontSize: `${baseFontSize}pt`,
        paddingTop: `${topMm}mm`,
        paddingBottom: `${bottomMm}mm`,
        paddingLeft: `${leftMm}mm`,
        paddingRight: `${rightMm}mm`,
      }}
    >
      {/* Header Dokumen Rekapitulasi - Konfigurasi Fleksibel */}
      {headerCfg.showHeader && (
        <div className="border-b-2 border-neutral-900 pb-2 mb-2 flex justify-between items-end gap-2">
          <div className="space-y-0.5">
            {headerCfg.showLembaga && (
              <div className="text-[7pt] uppercase tracking-wider text-neutral-600 font-semibold">
                {institution.namaLembagaLatin || 'Pondok Modern Darussalam Gontor'} · {institution.namaKulliyahArab || 'كلية المعلمين الإسلامية'}
              </div>
            )}
            {headerCfg.showJudul && (
              <h1 className="text-[10pt] font-extrabold tracking-tight text-neutral-900 leading-snug">
                {headerCfg.customJudul || 'REKAPITULASI EVALUASI NILAI PENGAJAR'}
              </h1>
            )}
            {headerCfg.customSubheader && (
              <div className="text-[7.5pt] text-neutral-700 font-medium italic">
                {headerCfg.customSubheader}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[7pt] text-neutral-700">
              {headerCfg.showPelajaran && (
                <span>
                  Pelajaran: <strong className="font-semibold text-neutral-900">{mataPelajaran.nama}</strong>
                  {headerCfg.showNamaArabMapel && mataPelajaran.namaArab && ` (${mataPelajaran.namaArab})`}
                </span>
              )}
              {headerCfg.showPelajaran && (headerCfg.showTingkat || headerCfg.showPeriode) && (
                <span aria-hidden="true">·</span>
              )}
              {headerCfg.showTingkat && (
                <span>
                  Tingkat:{' '}
                  <strong className="font-semibold text-neutral-900">
                    {tingkatLabel ||
                      (tingkat === 'all' || !tingkat
                        ? 'Semua Tingkat'
                        : tingkat.startsWith('class:')
                        ? `Kelas ${db.getClass(tingkat.replace('class:', ''))?.nama || tingkat.replace('class:', '')}`
                        : `Kelas ${tingkat}`)}
                  </strong>
                </span>
              )}
              {headerCfg.showTingkat && headerCfg.showPeriode && (
                <span aria-hidden="true">·</span>
              )}
              {headerCfg.showPeriode && (
                <span>
                  Periode: <strong className="font-semibold text-neutral-900">{periode.nama}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="text-right text-[6.5pt] text-neutral-600 font-mono shrink-0 pl-1">
            {headerCfg.showTanggal && (
              <div>Tanggal: {new Date().toLocaleDateString('id-ID')}</div>
            )}
            {headerCfg.showTotalKelas && (
              <div>Total: {rows.length} Kelas</div>
            )}
            {headerCfg.showInfoMargin && (
              <div className="text-[6pt] text-neutral-400 font-sans">Margin: {topMm}mm (P: {baseFontSize}pt)</div>
            )}
          </div>
        </div>
      )}

      {/* Tabel Utama Rekap Nilai - Dioptimalkan Khusus A5 Potret */}
      <div className="w-full">
        <table className="w-full border-collapse border border-neutral-900 table-fixed" style={{ fontSize: `${baseFontSize}pt` }}>
          <thead>
            <tr className="bg-neutral-100 text-neutral-900 font-bold border-b-2 border-neutral-900">
              <th className="border border-neutral-900 px-0.5 py-1 text-center align-middle" style={{ width: `${colWidths.no}%` }}>No.</th>
              {template.showRanking && (
                <th className="border border-neutral-900 px-0.5 py-1 text-center align-middle" style={{ width: `${colWidths.rank}%` }}>
                  Rank
                </th>
              )}
              <th
                className="border border-neutral-900 px-1.5 py-1 text-left align-middle"
                style={{ width: `${template.showRanking ? (colWidths.nama ?? 29) : ((colWidths.nama ?? 29) + (colWidths.rank ?? 5.5))}%` }}
              >
                Nama Pengajar
              </th>
              <th className="border border-neutral-900 px-1 py-1 text-center align-middle" style={{ width: `${colWidths.pelajaran}%` }}>Pelajaran</th>
              <th className="border border-neutral-900 px-0.5 py-1 text-center align-middle" style={{ width: `${colWidths.kelas}%` }}>Kelas</th>
              {template.showNilaiSebelumnya && (
                <th className="border border-neutral-900 px-1 py-1 text-center align-middle" style={{ width: `${colWidths.nilaiSebelumnya}%` }}>
                  Rata 2025
                </th>
              )}
              {template.showNilaiBerjalan && (
                <th className="border border-neutral-900 px-1 py-1 text-center align-middle" style={{ width: `${colWidths.nilaiBerjalan}%` }}>
                  Rata 2026
                </th>
              )}
              {template.showSelisih && (
                <th className="border border-neutral-900 px-1 py-1 text-center align-middle" style={{ width: `${colWidths.selisih}%` }}>Selisih</th>
              )}
              {template.showPersentase && (
                <th className="border border-neutral-900 px-0.5 py-1 text-center align-middle" style={{ width: `${colWidths.persentase}%` }}>%</th>
              )}
              {template.showTren && (
                <th className="border border-neutral-900 px-0.5 py-1 text-center align-middle" style={{ width: `${colWidths.tren}%` }}>Ket</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-neutral-400 p-6 text-center text-neutral-500">
                  Tidak ada data penugasan untuk filter mata pelajaran dan tingkat kelas yang dipilih.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const nilai = row.nilai;

                const rankDisplay =
                  row.nilai?.rankingSumber !== null && row.nilai?.rankingSumber !== undefined
                    ? row.nilai.rankingSumber
                    : row.calculatedRank ?? '—';

                return (
                  <tr
                    key={row.penugasan.id}
                    className={`border-b border-neutral-400 ${idx % 2 === 1 ? 'bg-neutral-50/50' : 'bg-white'}`}
                  >
                    <td
                      className="border border-neutral-400 px-0.5 text-center font-mono align-middle"
                      style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                    >
                      {idx + 1}
                    </td>

                    {template.showRanking && (
                      <td
                        className="border border-neutral-400 px-0.5 text-center font-mono font-bold align-middle"
                        style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                      >
                        {rankDisplay}
                      </td>
                    )}

                    {/* Nama Pengajar Ditampilkan Lengkap Semua Tanpa Titik-Titik / Ellipsis */}
                    <td
                      className="border border-neutral-400 px-1.5 font-medium text-neutral-900 whitespace-normal break-words leading-tight align-middle text-left"
                      style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                    >
                      {row.guru.nama}
                    </td>

                    <td
                      className="border border-neutral-400 px-0.5 text-center text-neutral-800 whitespace-normal break-words leading-tight align-middle"
                      style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                    >
                      {row.mataPelajaran.nama}
                    </td>

                    <td
                      className="border border-neutral-400 px-0.5 text-center font-semibold font-mono align-middle"
                      style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                    >
                      {row.kelas.nama}
                    </td>

                    {template.showNilaiSebelumnya && (
                      <td
                        className="border border-neutral-400 px-1 pr-1.5 text-right font-sans font-medium tabular-nums align-middle overflow-hidden whitespace-nowrap text-[7pt]"
                        style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                      >
                        {formatNumberId(nilai?.nilaiSebelumnya, 2)}
                      </td>
                    )}

                    {template.showNilaiBerjalan && (
                      <td
                        className="border border-neutral-400 px-1 pr-1.5 text-right font-sans font-bold tabular-nums align-middle overflow-hidden whitespace-nowrap text-[7pt] text-neutral-900"
                        style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                      >
                        {formatNumberId(nilai?.nilaiBerjalan, 2)}
                      </td>
                    )}

                    {template.showSelisih && (
                      <td
                        className={`border border-neutral-400 px-1 pr-1.5 text-right font-sans font-bold tabular-nums align-middle overflow-hidden whitespace-nowrap text-[7pt] ${
                          (nilai?.selisih ?? 0) > 0
                            ? 'text-emerald-700'
                            : (nilai?.selisih ?? 0) < 0
                            ? 'text-rose-700'
                            : 'text-neutral-600'
                        }`}
                        style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                      >
                        {formatNumberId(nilai?.selisih, 2)}
                      </td>
                    )}

                    {template.showPersentase && (
                      <td
                        className="border border-neutral-400 px-0.5 pr-1 text-right font-sans font-medium tabular-nums align-middle overflow-hidden whitespace-nowrap text-[6.5pt]"
                        style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                      >
                        {formatPercentage(nilai?.persentase, false, 0)}
                      </td>
                    )}

                    {template.showTren && (
                      <td
                        className="border border-neutral-400 px-0.5 text-center align-middle"
                        style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                      >
                        {nilai?.tren === 'Naik' ? (
                          <span className="inline-block font-semibold px-1 py-0.5 rounded text-[6pt] bg-emerald-100 text-emerald-800">
                            Naik
                          </span>
                        ) : nilai?.tren === 'Turun' ? (
                          <span className="inline-block font-semibold px-1 py-0.5 rounded text-[6pt] bg-rose-100 text-rose-800">
                            Turun
                          </span>
                        ) : nilai?.tren === 'Tetap' ? (
                          <span className="inline-block font-semibold px-1 py-0.5 rounded text-[6pt] bg-neutral-100 text-neutral-700">
                            Tetap
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-mono text-[7pt]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          {template.showStatistik && rows.length > 0 && (
            <tfoot>
              <tr className="bg-neutral-100 font-bold border-t-2 border-neutral-900 text-neutral-900">
                <td
                  colSpan={template.showRanking ? 5 : 4}
                  className="border border-neutral-900 px-1.5 text-right text-[6.5pt] uppercase tracking-wider align-middle"
                  style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                >
                  Rata-rata Keseluruhan ({rows.length} Kelas):
                </td>
                {template.showNilaiSebelumnya && (
                  <td
                    className="border border-neutral-900 px-1 pr-1.5 text-right font-sans font-medium tabular-nums text-[6.5pt] overflow-hidden whitespace-nowrap align-middle"
                    style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                  >
                    {avgPrev !== null ? formatNumberId(avgPrev, 2) : '—'}
                  </td>
                )}
                {template.showNilaiBerjalan && (
                  <td
                    className="border border-neutral-900 px-1 pr-1.5 text-right font-sans font-bold tabular-nums text-[6.5pt] text-neutral-900 overflow-hidden whitespace-nowrap align-middle"
                    style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                  >
                    {avgCurr !== null ? formatNumberId(avgCurr, 2) : '—'}
                  </td>
                )}
                {template.showSelisih && (
                  <td
                    className={`border border-neutral-900 px-1 pr-1.5 text-right font-sans font-bold tabular-nums text-[6.5pt] overflow-hidden whitespace-nowrap align-middle ${
                      (avgSelisih ?? 0) > 0
                        ? 'text-emerald-700'
                        : (avgSelisih ?? 0) < 0
                        ? 'text-rose-700'
                        : 'text-neutral-700'
                    }`}
                    style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                  >
                    {avgSelisih !== null ? formatNumberId(avgSelisih, 2) : '—'}
                  </td>
                )}
                {template.showPersentase && (
                  <td
                    className="border border-neutral-900 px-0.5 pr-1 text-right font-sans font-medium tabular-nums text-[6.5pt] overflow-hidden whitespace-nowrap align-middle"
                    style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                  >
                    {avgPersen !== null ? `${avgPersen > 0 ? '+' : ''}${avgPersen.toFixed(0)}%` : '—'}
                  </td>
                )}
                {template.showTren && (
                  <td
                    className="border border-neutral-900 px-0.5 text-center text-[6.5pt] align-middle"
                    style={{ paddingTop: `${rowPaddingY}mm`, paddingBottom: `${rowPaddingY}mm` }}
                  >
                    <span
                      className={`inline-block font-bold px-1 py-0.5 rounded text-[6pt] ${
                        (avgSelisih ?? 0) > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : (avgSelisih ?? 0) < 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      {(avgSelisih ?? 0) > 0 ? 'Naik' : (avgSelisih ?? 0) < 0 ? 'Turun' : 'Tetap'}
                    </span>
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
