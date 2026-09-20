import { MetricsResult } from "@/lib/metrics";

const cardStyle = {
  backgroundColor: "hsl(240 32% 10%)",
  border: "1px solid hsl(240 26% 22%)",
  borderRadius: "0.75rem",
};

const accentTopBorder = (color: string) => ({
  borderTop: `2px solid ${color}`,
});

export function MetricCards({ data }: { data: MetricsResult["summary"] }) {
  const pct = ((data.totalTergelar / (data.totalStandar || 1)) * 100).toFixed(1);
  const isFulfilled = data.totalTergelar >= data.totalStandar;
  const isOptimal = data.persentaseKesiapan >= 80;
  const isSufficient = data.persentaseKesiapan >= 50;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total Kebutuhan */}
      <div
        className="p-5 flex flex-col justify-between"
        style={{ ...cardStyle, ...accentTopBorder("hsl(248 100% 73%)") }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "hsl(240 18% 55%)" }}>
          Total Kebutuhan
        </p>
        <p
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color: "hsl(240 30% 92%)" }}
        >
          {data.totalStandar}
        </p>
        <p className="text-xs mt-2" style={{ color: "hsl(240 18% 50%)" }}>Unit standar wajib</p>
      </div>

      {/* Card 2: Total Tergelar */}
      <div
        className="p-5 flex flex-col justify-between"
        style={{ ...cardStyle, ...accentTopBorder("hsl(199 89% 64%)") }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "hsl(240 18% 55%)" }}>
          Total Tergelar
        </p>
        <p
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color: "hsl(240 30% 92%)" }}
        >
          {data.totalTergelar}
        </p>
        <p className="text-xs mt-2" style={{ color: "hsl(240 18% 50%)" }}>Unit terpasang aktif</p>
      </div>

      {/* Card 3: Persentase Pemenuhan */}
      <div
        className="p-5 flex flex-col justify-between"
        style={{
          ...cardStyle,
          ...accentTopBorder(isFulfilled ? "hsl(160 60% 52%)" : "hsl(350 100% 66%)"),
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "hsl(240 18% 55%)" }}>
          Pemenuhan
        </p>
        <div className="flex items-baseline gap-2">
          <p
            className="text-4xl font-bold tabular-nums tracking-tight"
            style={{ color: "hsl(240 30% 92%)" }}
          >
            {pct}%
          </p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={
              isFulfilled
                ? { backgroundColor: "hsl(160 60% 20%)", color: "hsl(160 60% 65%)" }
                : { backgroundColor: "hsl(350 60% 20%)", color: "hsl(350 80% 70%)" }
            }
          >
            {isFulfilled ? "Terpenuhi" : "Defisit"}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "hsl(240 26% 22%)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, parseFloat(pct))}%`,
              background: isFulfilled
                ? "linear-gradient(90deg, hsl(160 60% 40%), hsl(160 60% 55%))"
                : "linear-gradient(90deg, hsl(350 80% 45%), hsl(350 80% 60%))",
            }}
          />
        </div>
      </div>

      {/* Card 4: Kesiapan Operasional */}
      <div
        className="p-5 flex flex-col justify-between"
        style={{
          ...cardStyle,
          ...accentTopBorder(
            isOptimal ? "hsl(160 60% 52%)" : isSufficient ? "hsl(39 96% 66%)" : "hsl(350 100% 66%)"
          ),
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "hsl(240 18% 55%)" }}>
          Kesiapan Operasional
        </p>
        <div className="flex items-baseline gap-2">
          <p
            className="text-4xl font-bold tabular-nums tracking-tight"
            style={{ color: "hsl(240 30% 92%)" }}
          >
            {data.persentaseKesiapan}%
          </p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={
              isOptimal
                ? { backgroundColor: "hsl(160 60% 20%)", color: "hsl(160 60% 65%)" }
                : isSufficient
                ? { backgroundColor: "hsl(39 60% 20%)", color: "hsl(39 96% 70%)" }
                : { backgroundColor: "hsl(350 60% 20%)", color: "hsl(350 80% 70%)" }
            }
          >
            {isOptimal ? "Optimal" : isSufficient ? "Cukup" : "Kritis"}
          </span>
        </div>
        <div className="mt-3 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "hsl(240 26% 22%)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, data.persentaseKesiapan)}%`,
              background: isOptimal
                ? "linear-gradient(90deg, hsl(160 60% 40%), hsl(160 60% 55%))"
                : isSufficient
                ? "linear-gradient(90deg, hsl(39 80% 45%), hsl(39 80% 60%))"
                : "linear-gradient(90deg, hsl(350 80% 45%), hsl(350 80% 60%))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

