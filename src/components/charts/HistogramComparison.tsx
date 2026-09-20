"use client";

import { MetricsResult } from "@/lib/metrics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const cardStyle = {
  backgroundColor: "hsl(240 32% 10%)",
  border: "1px solid hsl(240 26% 22%)",
  borderRadius: "0.75rem",
};

export default function HistogramComparison({ data }: { data: MetricsResult["comparison"] }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        style={{ ...cardStyle, border: "1px dashed hsl(240 26% 22%)" }}
      >
        <p className="text-sm" style={{ color: "hsl(240 18% 50%)" }}>Tidak ada data komparasi</p>
      </div>
    );
  }

  return (
    <div className="p-5" style={cardStyle}>
      <h3
        className="text-[11px] font-bold uppercase tracking-widest mb-5"
        style={{ color: "hsl(240 18% 55%)" }}
      >
        Komparasi Kebutuhan vs Tergelar
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(240 26% 20%)"
            />
            <XAxis
              dataKey="namaAlat"
              tick={{ fontSize: 11, fill: "hsl(240 18% 52%)" }}
              tickMargin={10}
              angle={-40}
              textAnchor="end"
              height={60}
              axisLine={{ stroke: "hsl(240 26% 22%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(240 18% 52%)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240 32% 14%)",
                borderColor: "hsl(240 26% 28%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(240 30% 90%)",
              }}
              cursor={{ fill: "hsl(248 30% 15% / 0.4)" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                paddingTop: "16px",
                color: "hsl(240 20% 65%)",
              }}
              iconType="square"
            />
            <Bar dataKey="standar" name="Standar" fill="hsl(248 60% 55%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="tergelar" name="Tergelar" fill="hsl(160 55% 45%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

