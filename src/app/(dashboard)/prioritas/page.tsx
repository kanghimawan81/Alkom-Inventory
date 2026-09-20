"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Search, 
  TrendingDown,
  PackageX,
  PackagePlus,
  RefreshCw
} from "lucide-react";
import * as XLSX from "xlsx";
import { PrioritasResult } from "@/app/api/prioritas/route";

export default function PrioritasPengadaanPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<PrioritasResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Satuan list for filter
  const [satuanList, setSatuanList] = useState<{ id: string; nama: string; kodeSatuan: string }[]>([]);

  // Filters
  const [selectedSatuanId, setSelectedSatuanId] = useState<string>("");
  const [selectedKategori, setSelectedKategori] = useState<string>("");
  const [selectedPrioritas, setSelectedPrioritas] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadSatuan() {
      try {
        const res = await fetch("/api/satuan");
        if (res.ok) {
          const json = await res.json();
          setSatuanList(json);
        }
      } catch (err) {
        console.error("Gagal memuat daftar satuan", err);
      }
    }
    loadSatuan();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedSatuanId 
        ? `/api/prioritas?satuanId=${selectedSatuanId}` 
        : "/api/prioritas";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data prioritas pengadaan");
      const json: PrioritasResult = await res.json();
      setData(json);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [selectedSatuanId]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [fetchData, session]);

  // Fixed categories list with exact label required by user
  const categories = [
    { label: "Komunikasi Kodal", value: "KOMUNIKASI KODAL" },
    { label: "Komunikasi Penerbangan", value: "KOMUNIKASI PENERBANGAN" },
    { label: "Komunikasi Koordinasi", value: "KOMUNIKASI KOORDINASI" },
    { label: "Komunikasi Adminlog", value: "KOMUNIKASI ADMINLOG" },
    { label: "CTDLS", value: "CTDLS" },
    { label: "VDCS", value: "VDCS" },
    { label: "Komunikasi Dukopslat", value: "KOMUNIKASI DUKOPSLAT" },
    { label: "Komunikasi Markas", value: "KOMUNIKASI MARKAS" },
    { label: "Jaringan Intranet", value: "JARINGAN INTRANET" },
    { label: "Jaringan Internet", value: "JARINGAN INTERNET" },
    { label: "Sound System", value: "SOUND SYSTEM" },
  ];

  // Filter items
  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      if (selectedKategori && item.kategori !== selectedKategori) {
        return false;
      }
      if (selectedPrioritas && item.tingkatPrioritas !== selectedPrioritas) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.namaAlat.toLowerCase().includes(q);
        const matchCat = item.kategori.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [data, selectedKategori, selectedPrioritas, searchQuery]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!filteredItems.length) return;

    const exportRows = filteredItems.map((item, idx) => ({
      "No": idx + 1,
      "Satuan": item.satuanNama || "Semua Satuan",
      "Kategori": categories.find(c => c.value === item.kategori)?.label || item.kategori,
      "Nama Alkom": item.namaAlat,
      "Standar Wajib": item.standar,
      "Tergelar": item.tergelar,
      "Kondisi Baik": item.baik,
      "Rusak": item.rusak,
      "Defisit Unit": item.defisit,
      "Rekomendasi Pengadaan": item.kebutuhanPengadaan,
      "Kesiapan (%)": `${item.persentaseKesiapan}%`,
      "Tingkat Prioritas": item.tingkatPrioritas,
      "Catatan Urgensi": item.alasanPrioritas,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prioritas Pemenuhan Kebutuhan");

    // Adjust column width
    worksheet["!cols"] = [
      { wch: 5 },  // No
      { wch: 18 }, // Satuan
      { wch: 16 }, // Kategori
      { wch: 28 }, // Nama Alkom
      { wch: 14 }, // Standar Wajib
      { wch: 10 }, // Tergelar
      { wch: 12 }, // Kondisi Baik
      { wch: 14 }, // Rusak
      { wch: 12 }, // Defisit Unit
      { wch: 22 }, // Rekomendasi Pengadaan
      { wch: 14 }, // Kesiapan (%)
      { wch: 18 }, // Tingkat Prioritas
      { wch: 45 }, // Catatan Urgensi
    ];

    const filename = `Prioritas_Pengadaan_Alkom_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (!session) return null;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="bg-white dark:bg-slate-950 p-4 border border-slate-300 dark:border-slate-800 rounded-sm shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Satuan Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Satuan:</span>
            <select
              value={selectedSatuanId}
              onChange={(e) => setSelectedSatuanId(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm py-1.5 px-3 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 text-slate-900 dark:text-slate-100"
            >
              <option value="">Semua Satuan</option>
              {satuanList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.kodeSatuan})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori:</span>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm py-1.5 px-3 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 text-slate-900 dark:text-slate-100"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prioritas:</span>
            <select
              value={selectedPrioritas}
              onChange={(e) => setSelectedPrioritas(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm py-1.5 px-3 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 text-slate-900 dark:text-slate-100"
            >
              <option value="">Semua Tingkat</option>
              <option value="TINGGI">Prioritas 1 (Tinggi / Kritis)</option>
              <option value="SEDANG">Prioritas 2 (Sedang)</option>
              <option value="RENDAH">Prioritas 3 (Rendah)</option>
              <option value="TERPENUHI">Terpenuhi</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari alkom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 w-48 lg:w-60"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            title="Muat ulang data"
            className="p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            disabled={loading || !filteredItems.length}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <Download size={16} />
            Unduh Excel
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Rekomendasi Pengadaan */}
          <div className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 rounded-sm flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Kebutuhan Pengadaan
              </span>
              <PackagePlus size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {data.summary.totalKebutuhanPengadaan}
              </span>
              <span className="text-xs text-slate-500 font-medium">Unit Diperlukan</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {data.summary.totalDefisit} defisit fisik + {data.summary.totalRusak} rusak
            </p>
          </div>

          {/* Card 2: Prioritas Tinggi / Kritis */}
          <div className="border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 rounded-sm flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                Prioritas 1 (Tinggi / Kritis)
              </span>
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight text-red-700 dark:text-red-400">
                {data.summary.prioritasTinggiCount}
              </span>
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Jenis Alkom</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400/80 mt-2">
              Kesiapan &lt; 50% atau defisit signifikan
            </p>
          </div>

          {/* Card 3: Prioritas Sedang */}
          <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-sm flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Prioritas 2 (Sedang)
              </span>
              <TrendingDown size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight text-amber-700 dark:text-amber-400">
                {data.summary.prioritasSedangCount}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Jenis Alkom</span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-2">
              Kesiapan 50% - 79% atau ada defisit parsial
            </p>
          </div>

          {/* Card 4: Total Defisit Fisik */}
          <div className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 rounded-sm flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kondisi Siap Operasional
              </span>
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
                {data.summary.terpenuhiCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Jenis Terpenuhi</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Dari total {data.summary.totalItem} jenis alkom terdaftar
            </p>
          </div>
        </div>
      )}

      {/* Main Table Content */}
      <div className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-sm overflow-hidden shadow-xs flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-300 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Daftar Prioritas Pemenuhan Kebutuhan Alkom
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan disusun berdasarkan tingkat urgensi defisit dan unit rusak yang membutuhkan pemenuhan/penggantian.
            </p>
          </div>
          <div className="text-xs font-medium text-slate-500">
            Menampilkan <span className="font-bold text-slate-900 dark:text-slate-100">{filteredItems.length}</span> alkom
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-slate-400" />
            <p className="text-sm text-slate-500 font-medium">Menganalisis data kebutuhan dan prioritas pemenuhan kebutuhan...</p>
          </div>
        ) : error ? (
          <div className="p-6 m-4 bg-red-50 text-red-800 border border-red-200 rounded-sm text-sm flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 select-none">
                <tr>
                  <th className="px-4 py-3 text-center w-12">No</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Nama Alkom</th>
                  <th className="px-4 py-3 text-right">Standar</th>
                  <th className="px-4 py-3 text-right">Tergelar</th>
                  <th className="px-4 py-3 text-center">Rincian Kondisi</th>
                  <th className="px-4 py-3 text-right">Defisit</th>
                  <th className="px-4 py-3 text-right">Rusak</th>
                  <th className="px-4 py-3 text-right">Total Pengadaan</th>
                  <th className="px-4 py-3 text-center">Kesiapan</th>
                  <th className="px-4 py-3 text-center">Tingkat Prioritas</th>
                  <th className="px-4 py-3">Catatan Urgensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <PackageX size={32} className="text-slate-400" />
                        <p className="font-medium text-slate-600 dark:text-slate-400">Tidak ada alkom yang sesuai dengan filter.</p>
                        <p className="text-xs text-slate-400">Silakan ubah filter kategori, satuan, atau kata kunci pencarian.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isP1 = item.tingkatPrioritas === "TINGGI";
                    const isP2 = item.tingkatPrioritas === "SEDANG";
                    const isP3 = item.tingkatPrioritas === "RENDAH";
                    const isTerpenuhi = item.tingkatPrioritas === "TERPENUHI";

                    return (
                      <tr 
                        key={item.id || idx} 
                        className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors ${
                          isP1 ? "bg-red-50/25 dark:bg-red-950/10" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            {categories.find(c => c.value === item.kategori)?.label || item.kategori}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          <div>{item.namaAlat}</div>
                          {selectedSatuanId === "" && item.satuanNama && (
                            <span className="text-[11px] text-slate-400">{item.satuanNama}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300 font-semibold">
                          {item.standar}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {item.tergelar}
                        </td>
                        {/* Kondisi Breakdown */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums">
                            <span 
                              title={`Baik: ${item.baik} unit`}
                              className="px-1.5 py-0.5 rounded-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                              B: {item.baik}
                            </span>
                            <span 
                              title={`Rusak: ${item.rusak} unit`}
                              className="px-1.5 py-0.5 rounded-xs bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold"
                            >
                              R: {item.rusak}
                            </span>
                          </div>
                        </td>
                        {/* Defisit */}
                        <td className={`px-4 py-3 text-right tabular-nums font-bold ${
                          item.defisit > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"
                        }`}>
                          {item.defisit > 0 ? `-${item.defisit}` : "0"}
                        </td>
                        {/* Rusak */}
                        <td className={`px-4 py-3 text-right tabular-nums font-bold ${
                          item.rusak > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"
                        }`}>
                          {item.rusak}
                        </td>
                        {/* Total Pengadaan */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          {item.kebutuhanPengadaan > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              +{item.kebutuhanPengadaan} unit
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              Lengkap
                            </span>
                          )}
                        </td>
                        {/* Kesiapan Progress */}
                        <td className="px-4 py-3 text-center">
                          <div className="w-24 mx-auto">
                            <div className="flex justify-between text-[11px] font-semibold mb-1">
                              <span className={`tabular-nums ${
                                item.persentaseKesiapan >= 80 
                                  ? "text-emerald-700 dark:text-emerald-400" 
                                  : item.persentaseKesiapan >= 50 
                                  ? "text-amber-600 dark:text-amber-400" 
                                  : "text-red-600 dark:text-red-400"
                              }`}>
                                {item.persentaseKesiapan}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.persentaseKesiapan >= 80 
                                    ? "bg-emerald-600" 
                                    : item.persentaseKesiapan >= 50 
                                    ? "bg-amber-500" 
                                    : "bg-red-600"
                                }`}
                                style={{ width: `${Math.min(100, item.persentaseKesiapan)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        {/* Prioritas Badge */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isP1 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs text-xs font-bold bg-red-700 text-white shadow-xs">
                              <AlertTriangle size={12} />
                              Prioritas 1 (Tinggi)
                            </span>
                          )}
                          {isP2 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs text-xs font-semibold bg-amber-600 text-white shadow-xs">
                              <TrendingDown size={12} />
                              Prioritas 2 (Sedang)
                            </span>
                          )}
                          {isP3 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs text-xs font-medium bg-blue-600 text-white shadow-xs">
                              Prioritas 3 (Rendah)
                            </span>
                          )}
                          {isTerpenuhi && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs text-xs font-medium bg-emerald-700 text-white shadow-xs">
                              <CheckCircle2 size={12} />
                              Terpenuhi
                            </span>
                          )}
                        </td>
                        {/* Catatan Urgensi */}
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                          {item.alasanPrioritas}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
