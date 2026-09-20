import * as XLSX from "xlsx";

export interface InventoryRow {
  kategori: string;
  namaAlat: string;
  jumlah: number;
  kondisi: string;
  keterangan?: string;
}

export function parseInventoryWorkbook(buffer: Buffer): InventoryRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  if (!wb.SheetNames.length) {
    throw new Error("Excel file is empty or corrupted");
  }

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Convert to JSON, expecting headers on the first row
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
  
  if (rawData.length < 2) {
    throw new Error("No data found in the spreadsheet");
  }

  const headers = rawData[0].map(h => String(h).toLowerCase().trim());
  
  const kategoriIdx = headers.findIndex(h => h.includes("kategori"));
  const namaAlatIdx = headers.findIndex(h => h.includes("nama alat"));
  const jumlahIdx = headers.findIndex(h => h.includes("jumlah"));
  const kondisiIdx = headers.findIndex(h => h.includes("kondisi"));
  
  if (kategoriIdx === -1 || namaAlatIdx === -1 || jumlahIdx === -1 || kondisiIdx === -1) {
    throw new Error("Invalid template. Required columns: Kategori, Nama Alat, Jumlah, Kondisi");
  }

  const rows: InventoryRow[] = [];
  
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[namaAlatIdx]) continue;

    const kategori = String(row[kategoriIdx] || "Uncategorized").trim();
    const namaAlat = String(row[namaAlatIdx]).trim();
    const jumlahRaw = row[jumlahIdx];
    const jumlah = isNaN(Number(jumlahRaw)) ? 0 : Math.max(0, parseInt(String(jumlahRaw), 10));
    
    let kondisi = String(row[kondisiIdx] || "BAIK").toUpperCase().trim();
    // Normalize condition
    if (kondisi.includes("RUSAK") || kondisi === "RR" || kondisi === "RB") kondisi = "RUSAK";
    else kondisi = "BAIK";

    rows.push({
      kategori,
      namaAlat,
      jumlah,
      kondisi
    });
  }

  return rows;
}

export interface MasterStandardRow {
  kategori: string;
  namaAlat: string;
  jumlahWajib: number;
  satuanNamaOrKode?: string;
}

export function parseMasterStandardWorkbook(buffer: Buffer): MasterStandardRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  if (!wb.SheetNames.length) {
    throw new Error("File Excel kosong atau rusak");
  }

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
  if (rawData.length < 2) {
    throw new Error("Tidak ada baris data ditemukan pada spreadsheet");
  }

  // Scan the first 15 rows to find header columns
  let headerRowIdx = -1;
  let kategoriIdx = -1;
  let namaAlatIdx = -1;
  let jumlahIdx = -1;
  let satuanIdx = -1;

  for (let r = 0; r < Math.min(15, rawData.length); r++) {
    const row = rawData[r];
    if (!Array.isArray(row)) continue;
    const headers = row.map((cell) => String(cell || "").toLowerCase().trim());

    const kat = headers.findIndex((h) => h.includes("kategori") || h.includes("category"));
    const alat = headers.findIndex(
      (h) =>
        h.includes("nama alat") ||
        h.includes("nama_alat") ||
        h.includes("peralatan") ||
        h === "alat" ||
        h === "item"
    );
    const jml = headers.findIndex(
      (h) =>
        h.includes("jumlah wajib") ||
        h.includes("jumlah standar") ||
        h.includes("kebutuhan") ||
        h.includes("standar") ||
        h.includes("jumlah") ||
        h === "jml" ||
        h === "qty"
    );

    if (alat !== -1 && jml !== -1) {
      headerRowIdx = r;
      kategoriIdx = kat;
      namaAlatIdx = alat;
      jumlahIdx = jml;
      satuanIdx = headers.findIndex(
        (h) => h.includes("satuan") || h.includes("unit") || h.includes("kode satuan")
      );
      break;
    }
  }

  if (headerRowIdx === -1 || namaAlatIdx === -1 || jumlahIdx === -1) {
    throw new Error(
      "Format kolom tidak sesuai. Minimal harus memiliki kolom: 'Nama Alat' (atau 'Peralatan') dan 'Jumlah Wajib' (atau 'Jumlah' / 'Kebutuhan')."
    );
  }

  const rows: MasterStandardRow[] = [];
  let currentKategori = "KOMUNIKASI";

  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    const rawNamaAlat = row[namaAlatIdx];
    if (!rawNamaAlat) continue;

    let namaAlat = String(rawNamaAlat).trim();
    // Remove leading bullet/letter numbering e.g. "a. ", "1. ", "1) "
    namaAlat = namaAlat.replace(/^[a-z0-9]+[.)]\s*/i, "").trim();
    if (!namaAlat || namaAlat === "-") continue;

    if (kategoriIdx !== -1 && row[kategoriIdx]) {
      const katStr = String(row[kategoriIdx]).trim();
      if (katStr && katStr !== "-") currentKategori = katStr.toUpperCase();
    }

    const jumlahRaw = row[jumlahIdx];
    const jumlah = isNaN(Number(jumlahRaw)) ? 0 : Math.max(0, parseInt(String(jumlahRaw), 10));

    const satuanVal =
      satuanIdx !== -1 && row[satuanIdx] ? String(row[satuanIdx]).trim() : undefined;

    rows.push({
      kategori: currentKategori,
      namaAlat,
      jumlahWajib: jumlah,
      satuanNamaOrKode: satuanVal,
    });
  }

  return rows;
}
