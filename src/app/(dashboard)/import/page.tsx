"use client";

import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ImportPage() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [satuanId, setSatuanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [satuanList, setSatuanList] = useState<{ id: string; nama: string; kodeSatuan: string }[]>([]);

  useEffect(() => {
    async function loadSatuan() {
      try {
        const res = await fetch("/api/satuan");
        if (res.ok) {
          const data = await res.json();
          setSatuanList(data);
          
          if (session?.user?.role === "OPERATOR_SATUAN" && session?.user?.satuanId) {
            setSatuanId(session.user.satuanId);
          } else if (data.length > 0) {
            setSatuanId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch satuan", err);
      }
    }
    loadSatuan();
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !satuanId) {
      setMessage({ text: "Harap pilih satuan dan unggah file.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("satuanId", satuanId);

    try {
      const res = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `Berhasil memproses ${data.count} baris data.`, type: "success" });
        setFile(null);
      } else {
        setMessage({ text: data.error || "Gagal memproses file.", type: "error" });
      }
    } catch {
      setMessage({ text: "Terjadi kesalahan sistem.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Unggah Inventaris Tergelar</h1>
      
      {message && (
        <div className={`mb-4 p-4 text-sm font-medium border rounded-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Pilih Satuan
          </label>
          {session?.user?.role === "OPERATOR_SATUAN" ? (
            <div className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-sm text-sm font-medium text-slate-700 dark:text-slate-300">
              Satuan: {satuanList.find(s => s.id === session.user.satuanId)?.nama || "Memuat..."}
            </div>
          ) : (
            <select
              required
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 text-sm"
              value={satuanId}
              onChange={(e) => setSatuanId(e.target.value)}
            >
              <option value="" disabled>-- Pilih Satuan --</option>
              {satuanList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.kodeSatuan})
                </option>
              ))}
            </select>
          )}
        </div>

        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-sm p-12 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer relative"
        >
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className="text-slate-400 mb-4" size={48} />
          {file ? (
            <p className="text-sm font-semibold text-slate-700">{file.name}</p>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Tarik & Lepas File Excel</p>
              <p className="text-xs text-slate-500 mt-1">atau klik untuk memilih file (.xlsx)</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !file || !satuanId}
          className="bg-slate-900 text-white font-semibold text-sm py-2 px-4 rounded-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Unggah Data"}
        </button>
      </form>
    </div>
  );
}
