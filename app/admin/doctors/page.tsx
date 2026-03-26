"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/*TYPES*/

type DoctorRow = {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  created_at?: string | null;
};

type AppointmentCountRow = {
  doctor_email: string;
};

type DoctorSummary = {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  appointments_count: number;
  created_at: string | null;
};

type SortType =
  | "name-asc"
  | "name-desc"
  | "appointments-desc"
  | "appointments-asc"
  | "created-desc"
  | "created-asc";

type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

/*HELPERS*/

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const formatDatePretty = (value: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/*PAGE*/

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortType>("name-asc");

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    type: ToastItem["type"],
    message: string,
    duration = 3000,
  ) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  };

  const loadDoctors = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);

      const [doctorsRes, appointmentsRes] = await Promise.all([
        supabase
          .from("doctors")
          .select("id, full_name, email, specialty, created_at")
          .order("full_name", { ascending: true }),
        supabase.from("appointments").select("doctor_email"),
      ]);

      if (doctorsRes.error) {
        console.error("Doctors fetch error:", doctorsRes.error);
        addToast("error", "Unable to load doctors.");
        return;
      }

      if (appointmentsRes.error) {
        console.error("Appointments fetch error:", appointmentsRes.error);
        addToast("error", "Unable to load appointment counts.");
        return;
      }

      const doctorRows = (doctorsRes.data || []) as DoctorRow[];
      const appointmentRows = (appointmentsRes.data ||
        []) as AppointmentCountRow[];

      const countMap = new Map<string, number>();

      appointmentRows.forEach((row) => {
        if (!row.doctor_email) return;
        countMap.set(
          row.doctor_email,
          (countMap.get(row.doctor_email) || 0) + 1,
        );
      });

      const normalizedDoctors: DoctorSummary[] = doctorRows.map((doctor) => ({
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email,
        specialty: doctor.specialty,
        created_at: doctor.created_at ?? null,
        appointments_count: countMap.get(doctor.email) || 0,
      }));

      setDoctors(normalizedDoctors);
    } catch (err) {
      console.error("Unexpected doctors error:", err);
      addToast("error", "Unexpected error while loading doctors.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadDoctors(true);
    }, 45000);

    return () => window.clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = doctors.length;
    const general = doctors.filter(
      (d) => !d.specialty || d.specialty === "General",
    ).length;
    const specialists = doctors.filter(
      (d) => d.specialty && d.specialty !== "General",
    ).length;
    const totalAppointments = doctors.reduce(
      (acc, d) => acc + d.appointments_count,
      0,
    );

    return { total, general, specialists, totalAppointments };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? [...doctors]
      : doctors.filter(
          (doctor) =>
            doctor.full_name.toLowerCase().includes(q) ||
            doctor.email.toLowerCase().includes(q) ||
            (doctor.specialty || "").toLowerCase().includes(q),
        );

    switch (sort) {
      case "name-asc":
        list.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case "name-desc":
        list.sort((a, b) => b.full_name.localeCompare(a.full_name));
        break;
      case "appointments-desc":
        list.sort((a, b) => b.appointments_count - a.appointments_count);
        break;
      case "appointments-asc":
        list.sort((a, b) => a.appointments_count - b.appointments_count);
        break;
      case "created-desc":
        list.sort((a, b) =>
          String(b.created_at || "").localeCompare(String(a.created_at || "")),
        );
        break;
      case "created-asc":
        list.sort((a, b) =>
          String(a.created_at || "").localeCompare(String(b.created_at || "")),
        );
        break;
    }

    return list;
  }, [doctors, search, sort]);

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl",
              toast.type === "success" &&
                "border-emerald-400/20 bg-emerald-500/12 text-emerald-100",
              toast.type === "error" &&
                "border-rose-400/20 bg-rose-500/12 text-rose-100",
              toast.type === "info" &&
                "border-cyan-400/20 bg-cyan-500/12 text-cyan-100",
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.15),rgba(255,255,255,0.02))]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <span>Admin doctors control</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Doctors
                </h1>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  Manage and review all registered doctors in one premium
                  directory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniTopBadge label="Total" value={stats.total} />
              <MiniTopBadge label="Specialists" value={stats.specialists} />
              <MiniTopBadge label="General" value={stats.general} />
              <button
                onClick={() => loadDoctors(true)}
                disabled={refreshing}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-500/15 disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]"
                />
              ))}
            </div>
            <div className="h-[420px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
          </>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Doctors"
                value={stats.total}
                icon="✚"
                accent="cyan"
                subtitle="Registered profiles"
              />
              <StatCard
                label="Specialists"
                value={stats.specialists}
                icon="◆"
                accent="violet"
                subtitle="With specialty set"
              />
              <StatCard
                label="General"
                value={stats.general}
                icon="◎"
                accent="sky"
                subtitle="General practitioners"
              />
              <StatCard
                label="Appointments"
                value={stats.totalAppointments}
                icon="◷"
                accent="amber"
                subtitle="Across all doctors"
              />
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Filters
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Browse doctors
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Search by name, email, or specialty and change the sorting.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px] xl:min-w-[520px]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, email, or specialty..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#081423] px-4 py-3 pl-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                    />
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ⌕
                    </span>
                  </div>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortType)}
                    className="rounded-2xl border border-white/10 bg-[#081423] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="name-asc">Sort: Name A-Z</option>
                    <option value="name-desc">Sort: Name Z-A</option>
                    <option value="appointments-desc">
                      Sort: Most appointments
                    </option>
                    <option value="appointments-asc">
                      Sort: Fewest appointments
                    </option>
                    <option value="created-desc">Sort: Newest created</option>
                    <option value="created-asc">Sort: Oldest created</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Doctors table
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Registered doctors
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {filteredDoctors.length} result
                    {filteredDoctors.length !== 1 ? "s" : ""}.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px]">
                  <thead className="bg-white/[0.03] text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left">Doctor</th>
                      <th className="px-6 py-4 text-left">Email</th>
                      <th className="px-6 py-4 text-left">Specialty</th>
                      <th className="px-6 py-4 text-left">Appointments</th>
                      <th className="px-6 py-4 text-left">Created</th>
                      <th className="px-6 py-4 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredDoctors.map((doctor) => (
                      <tr
                        key={doctor.id}
                        className="transition hover:bg-white/[0.03]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-xs font-bold text-slate-950">
                              {getInitials(doctor.full_name)}
                            </div>
                            <p className="font-medium text-white">
                              {doctor.full_name}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {doctor.email}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {doctor.specialty || "General"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">
                          {doctor.appointments_count}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {formatDatePretty(doctor.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredDoctors.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-14 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-slate-300">
                              ◌
                            </div>
                            <p className="text-sm font-medium text-slate-200">
                              No doctors found
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Try another search query.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

/*COMPONENTS*/

function MiniTopBadge({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  subtitle,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  subtitle: string;
  accent: "cyan" | "violet" | "sky" | "amber";
}) {
  const accentClass =
    accent === "cyan"
      ? "from-cyan-400/20 to-cyan-500/5 text-cyan-300 border-cyan-400/15"
      : accent === "violet"
        ? "from-violet-400/20 to-violet-500/5 text-violet-300 border-violet-400/15"
        : accent === "sky"
          ? "from-sky-400/20 to-sky-500/5 text-sky-300 border-sky-400/15"
          : "from-amber-400/20 to-amber-500/5 text-amber-300 border-amber-400/15";

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br text-lg",
            accentClass,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
