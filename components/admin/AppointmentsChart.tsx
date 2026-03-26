"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

type ChartData = {
  day: string;
  thisWeek: number;
  lastWeek: number;
};

type TooltipPayloadItem = {
  value: number;
  name: string;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function AppointmentsChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/admin/appointments/week-comparison");

        if (!res.ok) {
          throw new Error("Failed to load chart data");
        }

        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Appointments chart error:", err);
        setError("Unable to load chart data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        acc.thisWeek += item.thisWeek || 0;
        acc.lastWeek += item.lastWeek || 0;
        return acc;
      },
      { thisWeek: 0, lastWeek: 0 },
    );
  }, [data]);

  const trendText = useMemo(() => {
    if (totals.thisWeek === totals.lastWeek) return "No change vs last week";
    if (totals.thisWeek > totals.lastWeek) return "Higher than last week";
    return "Lower than last week";
  }, [totals]);

  const hasData = data.some((item) => item.thisWeek > 0 || item.lastWeek > 0);

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Weekly comparison
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Appointments This Week
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Compare this week’s appointment volume with last week.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
          <MiniStat label="This week" value={totals.thisWeek} />
          <MiniStat label="Last week" value={totals.lastWeek} />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
          {trendText}
        </span>

        {hasData && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
            {data.length} day{data.length > 1 ? "s" : ""} loaded
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-[24px] border border-white/10 bg-[#081423]/70" />
      ) : error ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-[24px] border border-dashed border-rose-400/20 bg-rose-500/10 px-4 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-200">
            ✕
          </div>
          <p className="text-sm font-medium text-rose-100">{error}</p>
          <p className="mt-1 text-xs text-rose-200/70">
            Please refresh the dashboard and try again.
          </p>
        </div>
      ) : !hasData ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300">
            ◌
          </div>
          <p className="text-sm font-medium text-slate-200">
            No appointment data available
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Weekly bars will appear here once data is available.
          </p>
        </div>
      ) : (
        <div className="h-72 rounded-[24px] border border-white/10 bg-[#081423]/70 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={8} barSize={18}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(148,163,184,0.18)"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94A3B8", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94A3B8", fontSize: 12 }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Legend
                wrapperStyle={{
                  color: "#CBD5E1",
                  fontSize: "12px",
                  paddingTop: "8px",
                }}
              />

              <Bar
                dataKey="thisWeek"
                name="This Week"
                fill="#22D3EE"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="lastWeek"
                name="Last Week"
                fill="#475569"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07111f]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <div className="space-y-2">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full")}
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-slate-300">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
