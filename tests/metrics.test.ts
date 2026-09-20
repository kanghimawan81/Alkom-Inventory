import assert from "node:assert";
import { calculateMetrics } from "../src/lib/metrics";

function testMetrics() {
  const mockStandar = [{ namaAlat: "Radio VHF", jumlahWajib: 10, kategori: "Komunikasi" }];
  const mockTergelar = [{ namaAlat: "Radio VHF", jumlah: 8, kondisi: "BAIK", kategori: "Komunikasi" }];

  const { summary, comparison } = calculateMetrics(mockStandar, mockTergelar);
  assert.strictEqual(summary.totalStandar, 10);
  assert.strictEqual(summary.totalTergelar, 8);
  assert.strictEqual(summary.persentaseKesiapan, 80);
  assert.strictEqual(comparison[0].gap, -2);
  console.log("Metrics test passed.");
}

testMetrics();
