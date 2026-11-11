/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Guru,
  InstitutionSettings,
  PeriodeAkademik,
  TemplateRaporConfig,
  PenugasanMengajar,
  MataPelajaran,
  Kelas,
  NilaiEvaluasi,
} from '../../types/index.ts';
import { toArabicDigits, getSubjectArabicName } from '../../utils/arabic.ts';
import { formatNumberId } from '../../utils/calculations.ts';

export interface ReportCardItem {
  penugasan: PenugasanMengajar;
  mataPelajaran: MataPelajaran;
  kelas: Kelas;
  nilai: NilaiEvaluasi | null;
}

interface ArabicReportCardProps {
  guru: Guru;
  items: ReportCardItem[];
  institution: InstitutionSettings;
  periode: PeriodeAkademik;
  template: TemplateRaporConfig;
  previewMode?: boolean;
}

export const ArabicReportCard: React.FC<ArabicReportCardProps> = ({
  guru,
  items,
  institution,
  periode,
  template,
  previewMode = false,
}) => {
  const isA5 = template.paperSize !== 'A4';

  // Jumlah baris minimal 9 baris persis seperti pada gambar referensi resmi
  const minRows = 9;
  const totalRowsCount = Math.max(minRows, items.length);
  const emptyRowsCount = Math.max(0, totalRowsCount - items.length);

  // Dimensi fisik kertas
  const pageWidth = isA5 ? '148mm' : '210mm';
  const pageHeight = isA5 ? '210mm' : '297mm';
  const topBottomMargin = isA5 ? 6 : (template.marginTopMm || 10);
  const leftRightMargin = isA5 ? 7 : (template.marginLeftMm || 10);

  // Tipografi proporsional dan jelas (tidak kekecilan)
  const baseTitleSize = template.fontSizeTitle && template.fontSizeTitle >= 15 ? template.fontSizeTitle : 18;
  const titleSize = isA5 ? baseTitleSize : 22;
  const bodySize = isA5 ? (template.fontSizeBody && template.fontSizeBody >= 10 ? template.fontSizeBody : 11) : 12;

  // Nama Pengajar Terformat
  const teacherDisplayName = guru.nama.startsWith('Al-Ustadz') || guru.nama.startsWith('Ustadz')
    ? guru.nama
    : `Al-Ustadz ${guru.nama}`;

  return (
    <div
      className={`print-page ${isA5 ? 'print-page-a5' : ''} bg-white text-neutral-900 mx-auto select-text ${
        previewMode ? 'border border-neutral-300 shadow-xl' : ''
      }`}
      style={{
        width: pageWidth,
        height: isA5 ? '210mm' : undefined,
        minHeight: pageHeight,
        maxHeight: isA5 ? '210mm' : undefined,
        padding: `${topBottomMargin}mm ${leftRightMargin}mm`,
        boxSizing: 'border-box',
      }}
    >
      {/* Bingkai Halaman / Frame sesuai Gambar 1 */}
      <div
        className="w-full h-full flex flex-col justify-between"
        style={{
          border: `${template.borderWidth || 1.5}px solid #171717`,
          padding: isA5 ? '4.5mm 5.5mm 4.5mm 5.5mm' : '8mm 10mm',
          height: isA5 ? '198mm' : 'calc(297mm - 20mm)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Rapor Arab */}
        <div className="text-center w-full">
          {/* Judul Utama Arab */}
          <h1
            className="font-arabic font-bold text-neutral-950 tracking-normal text-center leading-snug"
            dir="rtl"
            style={{ fontSize: `${titleSize}pt` }}
          >
            {institution.judulRaporArab || 'قائمة نتائج المراجعة العامة للفصل الدراسي الثاني'}
          </h1>

          {/* Tahun Akademik Arab */}
          <h2
            className="font-arabic font-bold text-neutral-900 text-center leading-snug mt-1"
            dir="rtl"
            style={{ fontSize: `${titleSize - 2.5}pt` }}
          >
            {(institution.tahunAkademikArab || periode.tahunArab || 'عام: ١٤٤٨ / ٢٠٢٦').replace(/^العام:/, 'عام:')}
          </h2>

          {/* Kulliyyatul Mu'allimin & Nama Lembaga */}
          <div className="mt-1 space-y-0.5">
            <h3
              className="font-arabic font-bold text-neutral-900 text-center leading-snug"
              dir="rtl"
              style={{ fontSize: isA5 ? '13.5pt' : '16pt' }}
            >
              {institution.namaKulliyahArab || 'كلية المعلمين الإسلامية'}
            </h3>
            <h4
              className="font-arabic font-medium text-neutral-800 text-center leading-snug"
              dir="rtl"
              style={{ fontSize: isA5 ? '11.5pt' : '13.5pt' }}
            >
              {institution.namaLembagaArab || 'معهد دار السلام كونتور للتربية الإسلامية الحديثة'}
            </h4>
          </div>

          {/* Identitas Pengajar & Bagian */}
          <div className="mt-2.5 mb-2.5 text-center">
            <p
              className="font-bold text-neutral-950 tracking-tight text-center underline underline-offset-4 decoration-1"
              style={{ fontSize: isA5 ? '13pt' : '15pt' }}
            >
              {teacherDisplayName}
            </p>
            <p
              className="font-normal text-neutral-800 text-center mt-0.5"
              style={{ fontSize: isA5 ? '10pt' : '11.5pt' }}
            >
              {guru.unitKerja || institution.unitKerjaDefault || 'Perpustakaan UNIDA Kampus Rabithah'}
            </p>
          </div>
        </div>

        {/* Tabel Evaluasi Kanan ke Kiri (RTL) yang mengisi sisa halaman A5 */}
        <div className="w-full flex-1 flex flex-col justify-start" dir="rtl">
          <table
            className="w-full border-collapse text-right"
            style={{
              border: '1.5px solid #525252',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: template.headerBgColor || '#a8a8a8',
                  color: '#000000',
                }}
              >
                {/* Kolom 1: Nomor urut (RTL - paling kanan) */}
                <th
                  className="font-arabic font-bold text-center border border-neutral-700 py-1.5"
                  style={{
                    width: '13.5%',
                    fontSize: isA5 ? '12.5pt' : '14pt',
                  }}
                >
                  {template.columnLabels.no || 'الرقم'}
                </th>

                {/* Kolom 2: Mata Pelajaran / Komponen */}
                <th
                  className="font-arabic font-bold text-center border border-neutral-700 py-1.5"
                  style={{
                    width: '43.5%',
                    fontSize: isA5 ? '12.5pt' : '14pt',
                  }}
                >
                  {template.columnLabels.pelajaran || 'الدرس'}
                </th>

                {/* Kolom 3: Kelas */}
                <th
                  className="font-arabic font-bold text-center border border-neutral-700 py-1.5"
                  style={{
                    width: '21.5%',
                    fontSize: isA5 ? '12.5pt' : '14pt',
                  }}
                >
                  {template.columnLabels.kelas || 'الفصل'}
                </th>

                {/* Kolom 4: Nilai / Hasil (RTL - paling kiri) */}
                <th
                  className="font-arabic font-bold text-center border border-neutral-700 py-1.5"
                  style={{
                    width: '21.5%',
                    fontSize: isA5 ? '12.5pt' : '14pt',
                  }}
                >
                  {template.columnLabels.hasil || 'النتيجة'}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Baris data penugasan nyata guru */}
              {items.map((item, index) => {
                const noDigit = template.useArabicDigits !== false
                  ? toArabicDigits(index + 1)
                  : String(index + 1);

                const mapelText =
                  (item.mataPelajaran.namaArab && item.mataPelajaran.namaArab.trim() !== '')
                    ? item.mataPelajaran.namaArab
                    : getSubjectArabicName(item.mataPelajaran.nama);

                // Format nilai
                let gradeDisplay = '—';
                if (item.nilai?.nilaiBerjalan !== null && item.nilai?.nilaiBerjalan !== undefined) {
                  gradeDisplay = formatNumberId(item.nilai.nilaiBerjalan, 2);
                  if (template.useArabicDigits !== false) {
                    gradeDisplay = toArabicDigits(gradeDisplay);
                  }
                }

                return (
                  <tr
                    key={item.penugasan.id}
                    style={{ height: isA5 ? '12.5mm' : '14mm' }}
                  >
                    <td
                      className="font-arabic text-center border border-neutral-600 font-bold px-1 text-black"
                      style={{ fontSize: isA5 ? '12.5pt' : '13pt' }}
                      dir="rtl"
                    >
                      {noDigit}
                    </td>
                    <td
                      className="font-arabic text-center border border-neutral-600 font-semibold px-2 text-black"
                      style={{ fontSize: `${bodySize}pt` }}
                      dir="rtl"
                    >
                      {mapelText}
                    </td>
                    <td
                      className="text-center border border-neutral-600 font-semibold px-1 text-black"
                      style={{ fontSize: `${bodySize}pt` }}
                      dir="ltr"
                    >
                      {item.kelas.nama}
                    </td>
                    <td
                      className="text-center border border-neutral-600 font-bold font-mono px-1 text-black"
                      style={{ fontSize: `${bodySize}pt` }}
                      dir={template.useArabicDigits !== false ? 'rtl' : 'ltr'}
                    >
                      {gradeDisplay}
                    </td>
                  </tr>
                );
              })}

              {/* Baris kosong untuk menjaga proporsi tabel persis 9 baris seperti referensi */}
              {Array.from({ length: emptyRowsCount }).map((_, idx) => {
                const rowNo = items.length + idx + 1;
                const noDigit = template.useArabicDigits !== false
                  ? toArabicDigits(rowNo)
                  : String(rowNo);

                return (
                  <tr
                    key={`empty-row-${idx}`}
                    style={{ height: isA5 ? '12.5mm' : '14mm' }}
                  >
                    <td
                      className="font-arabic text-center border border-neutral-600 text-neutral-800 font-bold px-1"
                      style={{ fontSize: isA5 ? '12.5pt' : '13pt' }}
                      dir="rtl"
                    >
                      {noDigit}
                    </td>
                    <td className="border border-neutral-600 px-2">&nbsp;</td>
                    <td className="border border-neutral-600 px-1">&nbsp;</td>
                    <td className="border border-neutral-600 px-1">&nbsp;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
