"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

type PieData = {
  status: string;
  total: number;
};

type TooltipPayloadItem = {
  value: number;
  name: string;
  color: string;
  payload: PieData;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

const COLORS: Record<string, string> = {
  pending: "#F59E0B",
  accepted: "#10B981",
  rejected: "#F43F5E",
  completed: "#94A3B8",
  paid: "#8B5CF6",
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function AppointmentsStatusPie() {
  const [data, setData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/admin/appointments/by-status");

        if (!res.ok) {
          throw new Error("Failed to load pie chart data");
        }

        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Appointments pie chart error:", err);
        setError("Unable to load appointment status data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalAppointments = useMemo(
    () => data.reduce((acc, item) => acc + (item.total || 0), 0),
    [data],
  );

  const hasData = data.some((item) => item.total > 0);

  const biggestStatus = useMemo(() => {
    if (!data.length) return null;
    return [...data].sort((a, b) => b.total - a.total)[0] || null;
  }, [data]);

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Status distribution
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Appointments by Status
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Understand how appointments are distributed across statuses.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
          <MiniStat label="Total" value={totalAppointments} />
          <MiniStat
            label="Top status"
            value={biggestStatus ? biggestStatus.status : "—"}
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        {biggestStatus && hasData && (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            Top status: {biggestStatus.status} ({biggestStatus.total})
          </span>
        )}

        {hasData && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
            {data.length} status
            {data.length > 1 ? "es" : ""} loaded
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
            No status data available
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Status slices will appear here once appointment data is available.
          </p>
        </div>
      ) : (
        <div className="h-72 rounded-[24px] border border-white/10 bg-[#081423]/70 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="status"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={4}
                stroke="rgba(15,23,42,0.85)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`${entry.status}-${index}`}
                    fill={COLORS[entry.status] || "#475569"}
                  />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  color: "#CBD5E1",
                  fontSize: "12px",
                  paddingTop: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white capitalize">
        {value}
      </p>
    </div>
  );
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const status = item?.payload?.status || item?.name || "Unknown";
  const total = item?.payload?.total ?? item?.value ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07111f]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span
          className={cn("h-2.5 w-2.5 rounded-full")}
          style={{ backgroundColor: item.color }}
        />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {status}
        </p>
      </div>

      <p className="mt-2 text-sm font-semibold text-white">
        {total} appointment{total > 1 ? "s" : ""}
      </p>
    </div>
  );
}
