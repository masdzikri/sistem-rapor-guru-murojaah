/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { formatNumberId, parseSafeNumber } from './calculations.ts';

export interface SheetData {
  sheetName: string;
  data: Record<string, unknown>[];
  headers: string[];
}

/**
 * Membaca file Excel dan mengembalikan daftar sheet beserta datanya
 */
export async function readExcelFile(file: File): Promise<SheetData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: false, // Mempertahankan formatting teks (misal 0 di depan NIP)
    cellDates: false,
  });

  const sheets: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Ambil data dalam bentuk objek array
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    // Cari daftar kolom / header
    const headers: string[] = [];
    if (jsonData.length > 0) {
      Object.keys(jsonData[0]).forEach((key) => {
        if (!key.startsWith('__EMPTY')) {
          headers.push(key);
        } else {
          headers.push(key);
        }
      });
    }

    sheets.push({
      sheetName,
      data: jsonData,
      headers,
    });
  }

  return sheets;
}

/**
 * Menghasilkan file template Excel resmi untuk pengisian nilai & penugasan guru
 */
export function generateSampleExcelTemplate(): void {
  const templateRows = [
    {
      'No.': 1,
      'Rank': 279,
      'Nama Pengajar': 'Muhammad Ayus Sofi',
      'NIP': '1001',
      'Pelajaran': 'Muthala\'ah',
      'Kelas': '4-B',
      'Rata - Rata 2025': '80,68',
      'Rata - Rata 2026': '73,23',
      'Selisih': '-7,45',
      'Persentase': '-9%',
      'Ket': 'Turun',
      'Unit Kerja': 'KMI Gontor',
    },
    {
      'No.': 2,
      'Rank': 181,
      'Nama Pengajar': 'Wildan Taqiyuddin, S.E.',
      'NIP': '1002',
      'Pelajaran': 'Muthala\'ah',
      'Kelas': '4-C',
      'Rata - Rata 2025': '77,82',
      'Rata - Rata 2026': '66,67',
      'Selisih': '-11,15',
      'Persentase': '-14%',
      'Ket': 'Turun',
      'Unit Kerja': 'Bagian Pengasuhan Santri',
    },
    {
      'No.': 3,
      'Rank': 292,
      'Nama Pengajar': 'Muhammad Rifqi Fachriyan',
      'NIP': '1003',
      'Pelajaran': 'Muthala\'ah',
      'Kelas': '4-D',
      'Rata - Rata 2025': '65,56',
      'Rata - Rata 2026': '65,61',
      'Selisih': '0,05',
      'Persentase': '0%',
      'Ket': 'Naik',
      'Unit Kerja': 'KMI Gontor',
    },
    {
      'No.': 4,
      'Rank': 125,
      'Nama Pengajar': 'Agung Wicaksono, S.I.kom.',
      'NIP': '1004',
      'Pelajaran': 'Muthala\'ah',
      'Kelas': '4-G',
      'Rata - Rata 2025': '60,13',
      'Rata - Rata 2026': '62,34',
      'Selisih': '2,22',
      'Persentase': '4%',
      'Ket': 'Naik',
      'Unit Kerja': 'Sekretariat Pimpinan',
    },
    {
      'No.': 5,
      'Rank': 356,
      'Nama Pengajar': 'Yusuf Zidane',
      'NIP': '1005',
      'Pelajaran': 'Muthala\'ah',
      'Kelas': '4-H',
      'Rata - Rata 2025': '65,54',
      'Rata - Rata 2026': '61,56',
      'Selisih': '-3,98',
      'Persentase': '-6%',
      'Ket': 'Turun',
      'Unit Kerja': 'KMI Gontor',
    },
    {
      'No.': 6,
      'Rank': 101,
      'Nama Pengajar': 'Dimas',
      'NIP': '2001',
      'Pelajaran': 'Shorof',
      'Kelas': '3-H',
      'Rata - Rata 2025': '75,50',
      'Rata - Rata 2026': '82,30',
      'Selisih': '6,80',
      'Persentase': '9%',
      'Ket': 'Naik',
      'Unit Kerja': 'Perpustakaan UNIDA Kampus Rabithah',
    },
    {
      'No.': 7,
      'Rank': 142,
      'Nama Pengajar': 'Dimas',
      'NIP': '2001',
      'Pelajaran': 'Ushul Fiqh',
      'Kelas': '3-I',
      'Rata - Rata 2025': '78,40',
      'Rata - Rata 2026': '74,10',
      'Selisih': '-4,30',
      'Persentase': '-5%',
      'Ket': 'Turun',
      'Unit Kerja': 'Perpustakaan UNIDA Kampus Rabithah',
    },
    {
      'No.': 8,
      'Rank': 88,
      'Nama Pengajar': 'Ahmad',
      'NIP': '2002',
      'Pelajaran': 'Shorof',
      'Kelas': '3-C',
      'Rata - Rata 2025': '70,20',
      'Rata - Rata 2026': '76,50',
      'Selisih': '6,30',
      'Persentase': '9%',
      'Ket': 'Naik',
      'Unit Kerja': 'KMI Gontor',
    },
    {
      'No.': 9,
      'Rank': 95,
      'Nama Pengajar': 'Budi',
      'NIP': '2003',
      'Pelajaran': 'Shorof',
      'Kelas': '3-K',
      'Rata - Rata 2025': '68,40',
      'Rata - Rata 2026': '69,10',
      'Selisih': '0,70',
      'Persentase': '1%',
      'Ket': 'Naik',
      'Unit Kerja': 'KMI Gontor',
    },
    {
      'No.': 10,
      'Rank': 110,
      'Nama Pengajar': 'Ahmad',
      'NIP': '2002',
      'Pelajaran': 'Ushul Fiqh',
      'Kelas': '3-L',
      'Rata - Rata 2025': '71,00',
      'Rata - Rata 2026': '73,50',
      'Selisih': '2,50',
      'Persentase': '4%',
      'Ket': 'Naik',
      'Unit Kerja': 'KMI Gontor',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Evaluasi');

  // Trigger download
  XLSX.writeFile(wb, 'Template_Nilai_Dan_Penugasan_Guru.xlsx');
}

/**
 * Ekspor data tabel rekap ke format Excel
 */
export function exportRecapToExcel(
  filename: string,
  sheetName: string,
  rows: Record<string, unknown>[]
): void {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
