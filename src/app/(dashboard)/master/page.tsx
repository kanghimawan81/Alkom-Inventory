"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MasterStandarAlat, Satuan } from "@prisma/client";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  UploadCloud, 
  Download,
  FileCheck
} from "lucide-react";
import * as XLSX from "xlsx";

type MasterData = MasterStandarAlat & { satuan: Satuan };

interface FormData {
  id?: string;
  satuanId: string;
  kategori: string;
  namaAlat: string;
  jumlahWajib: number;
}

const COMMON_CATEGORIES = ["KOMUNIKASI", "NAVIGASI", "ALPERNIKA", "RADAR", "PENDUKUNG"];

export default function MasterStandardPage() {
  const [data, setData] = useState<MasterData[]>([]);
  const [satuanList, setSatuanList] = useState<Satuan[]>([]);
  const [selectedSatuanFilter, setSelectedSatuanFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Modal & Tab state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "excel">("manual");
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Manual Form state
  const [formData, setFormData] = useState<FormData>({
    satuanId: "",
    kategori: "",
    namaAlat: "",
    jumlahWajib: 1,
  });

  // Excel Import state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelSatuanId, setExcelSatuanId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Satuan options
  const fetchSatuanList = useCallback(async () => {
    try {
      const res = await fetch("/api/satuan");
      if (res.ok) {
        const json = await res.json();
        setSatuanList(json);
      }
    } catch (err) {
      console.error("Failed to fetch satuan list:", err);
    }
  }, []);

  // Fetch Master Data
  const fetchMaster = useCallback(async () => {
    setLoading(true);
    try {
      const query = selectedSatuanFilter ? `?satuanId=${encodeURIComponent(selectedSatuanFilter)}` : "";
      const res = await fetch(`/api/master-standard${query}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch master data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSatuanFilter]);

  useEffect(() => {
    fetchSatuanList();
  }, [fetchSatuanList]);

  useEffect(() => {
    fetchMaster();
  }, [fetchMaster]);

  // Open modal for Manual Create
  const handleOpenCreate = () => {
    setIsEditing(false);
    setActiveTab("manual");
    setFormError(null);
    setFormData({
      satuanId: selectedSatuanFilter || (satuanList[0]?.id ?? ""),
      kategori: "KOMUNIKASI",
      namaAlat: "",
      jumlahWajib: 1,
    });
    setIsModalOpen(true);
  };

  // Open modal for Excel Import
  const handleOpenExcelImport = () => {
    setIsEditing(false);
    setActiveTab("excel");
    setFormError(null);
    setExcelSatuanId(selectedSatuanFilter || (satuanList[0]?.id ?? ""));
    setExcelFile(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: MasterData) => {
    setIsEditing(true);
    setActiveTab("manual");
    setFormError(null);
    setFormData({
      id: item.id,
      satuanId: item.satuanId,
      kategori: item.kategori,
      namaAlat: item.namaAlat,
      jumlahWajib: item.jumlahWajib,
    });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (formSubmitting) return;
    setIsModalOpen(false);
    setFormError(null);
    setExcelFile(null);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Kategori", "Nama Alat", "Jumlah Standar"],
      ["KOMUNIKASI", "Radio HF SSB 100W", 10],
      ["KOMUNIKASI", "Radio VHF/UHF Handheld", 25],
      ["KOMUNIKASI", "Base Station Repeater", 2],
      ["NAVIGASI", "GPS Handheld Rugged", 8],
      ["ALPERNIKA", "Jammer Portable", 3],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StandarKebutuhan");
    XLSX.writeFile(wb, "template-master-standar.xlsx");
  };

  // Handle Manual Form Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.satuanId) {
      setFormError("Pilih Satuan terlebih dahulu.");
      return;
    }
    if (!formData.kategori.trim()) {
      setFormError("Kategori wajib diisi.");
      return;
    }
    if (!formData.namaAlat.trim()) {
      setFormError("Nama alat wajib diisi.");
      return;
    }
    if (formData.jumlahWajib < 0) {
      setFormError("Jumlah wajib tidak boleh bernilai negatif.");
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/master-standard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          satuanId: formData.satuanId,
          kategori: formData.kategori.trim().toUpperCase(),
          namaAlat: formData.namaAlat.trim(),
          jumlahWajib: Number(formData.jumlahWajib),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan standar kebutuhan");
      }

      setNotification({
        type: "success",
        message: isEditing ? "Standar kebutuhan berhasil diperbarui." : "Standar kebutuhan berhasil ditambahkan.",
      });
      setTimeout(() => setNotification(null), 4000);

      setIsModalOpen(false);
      fetchMaster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Excel Import Submit
  const handleExcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!excelFile) {
      setFormError("Pilih atau seret file Excel terlebih dahulu.");
      return;
    }

    if (!excelSatuanId) {
      setFormError("Pilih target Satuan untuk pengisian standar.");
      return;
    }

    setFormSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append("file", excelFile);
      formPayload.append("satuanId", excelSatuanId);

      const res = await fetch("/api/master-standard/import", {
        method: "POST",
        body: formPayload,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal mengimpor file Excel.");
      }

      setNotification({
        type: "success",
        message: `Berhasil mengimpor ${json.count} standar kebutuhan dari Excel!`,
      });
      setTimeout(() => setNotification(null), 5000);

      setIsModalOpen(false);
      setExcelFile(null);
      fetchMaster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat impor Excel";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, namaAlat: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus standar untuk "${namaAlat}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/master-standard?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menghapus data");
      }

      setNotification({
        type: "success",
        message: `Standar "${namaAlat}" berhasil dihapus.`,
      });
      setTimeout(() => setNotification(null), 4000);
      fetchMaster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus";
      alert(msg);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Master Standar Kebutuhan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola standar minimum jumlah alkom per satuan (bisa input manual atau unggah file Excel).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Satuan Filter Dropdown */}
          <select
            value={selectedSatuanFilter}
            onChange={(e) => setSelectedSatuanFilter(e.target.value)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Semua Satuan</option>
            {satuanList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kodeSatuan})
              </option>
            ))}
          </select>

          {/* Import Excel Button */}
          <button
            onClick={handleOpenExcelImport}
            className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3.5 py-2 text-sm font-semibold rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />
            Import Excel
          </button>

          {/* Tambah Standar Button */}
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-semibold rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Tambah Standar
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`p-4 text-sm font-medium border rounded-md flex items-center gap-2 transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-300 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Nama Alat</th>
                <th className="px-4 py-3 font-semibold">Satuan</th>
                <th className="px-4 py-3 font-semibold text-right">Jumlah Wajib</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-slate-400" size={18} />
                      <span>Memuat data standar...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p className="font-medium text-slate-600 dark:text-slate-400">Belum ada master standar kebutuhan</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleOpenCreate}
                          className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90"
                        >
                          Input Manual
                        </button>
                        <button
                          onClick={handleOpenExcelImport}
                          className="text-xs font-semibold px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Unggah File Excel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.namaAlat}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {item.satuan?.nama ? (
                        <span>
                          {item.satuan.nama} <span className="text-xs text-slate-400">({item.satuan.kodeSatuan})</span>
                        </span>
                      ) : (
                        item.satuanId
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                      {item.jumlahWajib} unit
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.namaAlat)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
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

      {/* Modal Dialog Form & Excel Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? "Edit Standar Kebutuhan" : "Tambah Standar Kebutuhan"}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={formSubmitting}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs (Only shown when not editing) */}
            {!isEditing && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => { setActiveTab("manual"); setFormError(null); }}
                  className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
                    activeTab === "manual"
                      ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100 bg-white dark:bg-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Input Manual (Per Alat)
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("excel"); setFormError(null); }}
                  className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "excel"
                      ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300 bg-white dark:bg-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <FileSpreadsheet size={15} />
                  Unggah File Excel (.xlsx)
                </button>
              </div>
            )}

            {/* Content Tab 1: Manual Input */}
            {activeTab === "manual" ? (
              <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 rounded flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Satuan Select */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Satuan Target <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.satuanId}
                    disabled={isEditing || formSubmitting}
                    onChange={(e) => setFormData({ ...formData, satuanId: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-75"
                  >
                    <option value="" disabled>-- Pilih Satuan --</option>
                    {satuanList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kodeSatuan})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Kategori Alat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KOMUNIKASI, NAVIGASI"
                    value={formData.kategori}
                    disabled={formSubmitting}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {COMMON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {COMMON_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, kategori: cat })}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nama Alat */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Nama Alat / Perlengkapan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Radio HF SSB 100W"
                    value={formData.namaAlat}
                    disabled={isEditing || formSubmitting}
                    onChange={(e) => setFormData({ ...formData, namaAlat: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-75"
                  />
                  {isEditing && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kombinasi Satuan dan Nama Alat merupakan kunci unik.
                    </p>
                  )}
                </div>

                {/* Jumlah Wajib */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Jumlah Standar Wajib (Unit) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="Contoh: 10"
                    value={formData.jumlahWajib}
                    disabled={formSubmitting}
                    onChange={(e) => setFormData({ ...formData, jumlahWajib: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 font-semibold"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={formSubmitting}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-5 py-2 text-sm font-semibold rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {formSubmitting && <Loader2 size={15} className="animate-spin" />}
                    {isEditing ? "Simpan Perubahan" : "Tambah Standar"}
                  </button>
                </div>
              </form>
            ) : (
              /* Content Tab 2: Excel Import */
              <form onSubmit={handleExcelSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 rounded flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Satuan Target */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Target Satuan <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={excelSatuanId}
                    disabled={formSubmitting}
                    onChange={(e) => setExcelSatuanId(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="" disabled>-- Pilih Satuan Target --</option>
                    {satuanList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kodeSatuan})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template Download Prompt */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Belum punya format Excel?</p>
                    <p className="text-[11px] text-slate-500">Unduh template kolom standar kebutuhan</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Download size={14} />
                    Download Template
                  </button>
                </div>

                {/* Drag and drop area */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      setExcelFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    excelFile
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-900/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  />

                  {excelFile ? (
                    <div className="flex flex-col items-center text-center space-y-1">
                      <FileCheck size={32} className="text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{excelFile.name}</p>
                      <p className="text-xs text-slate-500">{(excelFile.size / 1024).toFixed(1)} KB</p>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 underline mt-1">
                        Klik untuk mengganti file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <UploadCloud size={32} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Klik atau seret file Excel ke sini
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Format yang didukung: .xlsx atau .xls (Maks. 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer for Excel */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={formSubmitting}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting || !excelFile}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-sm font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Mengimpor Data...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={16} />
                        Unggah & Simpan Standar
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
