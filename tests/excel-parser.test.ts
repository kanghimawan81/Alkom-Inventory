import assert from "node:assert";
import { parseInventoryWorkbook } from "../src/lib/excel";
import * as XLSX from "xlsx";

function testParser() {
  const wsData = [
    ["Kategori", "Nama Alat", "Jumlah", "Kondisi"],
    ["Komunikasi", "Radio VHF", 10, "BAIK"],
    ["Navigasi", "GPS Handheld", 5, "RUSAK_RINGAN"]
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const result = parseInventoryWorkbook(buffer);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].namaAlat, "Radio VHF");
  assert.strictEqual(result[0].jumlah, 10);
  assert.strictEqual(result[0].kondisi, "BAIK");
  console.log("Parser test passed.");
}

testParser();
