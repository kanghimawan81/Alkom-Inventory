"use client";

import { MetricsResult } from "@/lib/metrics";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = {
  BAIK: "hsl(160 55% 45%)",
  RUSAK: "hsl(350 80% 58%)",
};

const cardStyle = {
  backgroundColor: "hsl(240 32% 10%)",
  border: "1px solid hsl(240 26% 22%)",
  borderRadius: "0.75rem",
};

export default function ReadinessPieChart({ data }: { data: MetricsResult["summary"]["kondisi"] }) {
  const chartData = [
    { name: "Baik", value: data.BAIK, fill: COLORS.BAIK },
    { name: "Rusak", value: data.RUSAK, fill: COLORS.RUSAK },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        style={{ ...cardStyle, border: "1px dashed hsl(240 26% 22%)" }}
      >
        <p className="text-sm" style={{ color: "hsl(240 18% 50%)" }}>Tidak ada data kondisi</p>
      </div>
    );
  }

  return (
    <div className="p-5 h-full" style={cardStyle}>
      <h3
        className="text-[11px] font-bold uppercase tracking-widest mb-5"
        style={{ color: "hsl(240 18% 55%)" }}
      >
        Persentasi Kesiapan Alkom
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240 32% 14%)",
                borderColor: "hsl(240 26% 28%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(240 30% 90%)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "12px",
                color: "hsl(240 20% 65%)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

