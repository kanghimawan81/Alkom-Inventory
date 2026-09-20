"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MetricsResult } from "@/lib/metrics";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { useSession } from "next-auth/react";

const HistogramComparison = dynamic(() => import("@/components/charts/HistogramComparison"), { ssr: false });
const ReadinessPieChart = dynamic(() => import("@/components/charts/ReadinessPieChart"), { ssr: false });

const cardStyle = {
  backgroundColor: "hsl(240 32% 10%)",
  border: "1px solid hsl(240 26% 22%)",
  borderRadius: "0.75rem",
};

const selectStyle = {
  backgroundColor: "hsl(240 30% 14%)",
  border: "1px solid hsl(240 26% 24%)",
  borderRadius: "0.5rem",
  color: "hsl(240 30% 85%)",
  fontSize: "13px",
  padding: "6px 12px",
  outline: "none",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<MetricsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [satuanList, setSatuanList] = useState<{ id: string; nama: string; kodeSatuan: string }[]>([]);

  // Filter state
  const [satuanId, setSatuanId] = useState<string>("");

  useEffect(() => {
    async function loadSatuan() {
      try {
        const res = await fetch("/api/satuan");
        if (res.ok) {
          const data = await res.json();
          setSatuanList(data);
        }
      } catch (err) {
        console.error("Failed to fetch satuan", err);
      }
    }
    loadSatuan();
  }, []);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        const url = satuanId ? `/api/metrics?satuanId=${satuanId}` : "/api/metrics";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Gagal mengambil metrik");
        const data = await res.json();
        setMetrics(data);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchMetrics();
    }
  }, [satuanId, session]);

  if (!session) return null;

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Filter Bar */}
      <div
        className="flex justify-between items-center p-4"
        style={cardStyle}
      >
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(240 18% 55%)" }}>
            Filter Satuan
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {session?.user?.role === "OPERATOR_SATUAN" ? (
             <div className="text-sm font-semibold" style={{ color: "hsl(240 30% 85%)" }}>
               {satuanList.find(s => s.id === session.user.satuanId)?.nama || "Memuat..."}
             </div>
          ) : (
            <select
              value={satuanId}
              onChange={(e) => setSatuanId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Semua Satuan</option>
              {satuanList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.kodeSatuan})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
              style={{
                borderTopColor: "hsl(248 100% 73%)",
                borderRightColor: "hsl(248 80% 60% / 0.4)",
              }}
            />
            <p className="text-sm font-medium animate-pulse" style={{ color: "hsl(240 18% 55%)" }}>
              Memuat data metrik...
            </p>
          </div>
        </div>
      ) : error ? (
        <div
          className="p-4 text-sm font-medium rounded-xl flex items-center gap-2"
          style={{
            backgroundColor: "hsl(350 60% 18%)",
            border: "1px solid hsl(350 60% 30%)",
            color: "hsl(350 80% 72%)",
          }}
        >
          {error}
        </div>
      ) : metrics ? (
        <>
          <MetricCards data={metrics.summary} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <HistogramComparison data={metrics.comparison} />
            <ReadinessPieChart data={metrics.summary.kondisi} />
          </div>

          {/* Kebutuhan Table */}
          <div className="overflow-hidden" style={cardStyle}>
            <div
              className="p-4"
              style={{ borderBottom: "1px solid hsl(240 26% 18%)" }}
            >
              <h3
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "hsl(240 18% 55%)" }}
              >
                Kebutuhan Alkom
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead
                  className="text-[11px] uppercase"
                  style={{
                    backgroundColor: "hsl(240 30% 12%)",
                    borderBottom: "1px solid hsl(240 26% 20%)",
                    color: "hsl(240 18% 52%)",
                  }}
                >
                  <tr>
                    <th className="px-4 py-3 font-semibold tracking-wider">Kategori</th>
                    <th className="px-4 py-3 font-semibold tracking-wider">Alkom</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-right">Standar</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-right">Tergelar</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-right">Kebutuhan</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.comparison.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm"
                        style={{ color: "hsl(240 18% 50%)" }}
                      >
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    metrics.comparison.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid hsl(240 26% 18%)",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "hsl(240 30% 13%)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold"
                            style={{
                              backgroundColor: "hsl(248 40% 22%)",
                              color: "hsl(248 80% 78%)",
                            }}
                          >
                            {item.kategori}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: "hsl(240 25% 85%)" }}>
                          {item.namaAlat}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums" style={{ color: "hsl(240 18% 65%)" }}>
                          {item.standar}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums" style={{ color: "hsl(240 18% 65%)" }}>
                          {item.tergelar}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums font-bold"
                          style={{
                            color:
                              item.gap < 0
                                ? "hsl(350 80% 65%)"
                                : "hsl(160 55% 55%)",
                          }}
                        >
                          {item.gap > 0 ? `+${item.gap}` : item.gap}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

