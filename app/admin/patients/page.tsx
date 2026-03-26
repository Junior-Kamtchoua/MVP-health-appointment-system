"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* ================= TYPES ================= */

type AppointmentPatientRow = {
  patient_name: string | null;
  patient_email: string | null;
  created_at: string;
};

type Patient = {
  email: string;
  name: string | null;
  first_appointment: string;
  appointments_count: number;
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

/* ================= HELPERS ================= */

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getInitials = (name: string | null, email: string) => {
  const safe = (name || email).trim();
  return (
    safe
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "P"
  );
};

const formatDatePretty = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ================= PAGE ================= */

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortType>("appointments-desc");

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

  const loadPatients = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);

      const { data, error } = await supabase
        .from("appointments")
        .select("patient_name, patient_email, created_at")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Patients fetch error:", error);
        addToast("error", "Unable to load patients.");
        return;
      }

      const rows = (data || []) as AppointmentPatientRow[];
      const map = new Map<string, Patient>();

      rows.forEach((row) => {
        if (!row.patient_email) return;

        if (!map.has(row.patient_email)) {
          map.set(row.patient_email, {
            email: row.patient_email,
            name: row.patient_name,
            first_appointment: row.created_at,
            appointments_count: 1,
          });
        } else {
          const current = map.get(row.patient_email)!;

          map.set(row.patient_email, {
            ...current,
            name: current.name || row.patient_name,
            appointments_count: current.appointments_count + 1,
          });
        }
      });

      setPatients(Array.from(map.values()));
    } catch (err) {
      console.error("Unexpected patients error:", err);
      addToast("error", "Unexpected error while loading patients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadPatients(true);
    }, 45000);

    return () => window.clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = patients.length;
    const totalAppointments = patients.reduce(
      (acc, p) => acc + p.appointments_count,
      0,
    );
    const recurring = patients.filter((p) => p.appointments_count > 1).length;
    const singleVisit = patients.filter(
      (p) => p.appointments_count === 1,
    ).length;

    return { total, totalAppointments, recurring, singleVisit };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? [...patients]
      : patients.filter(
          (patient) =>
            (patient.name || "").toLowerCase().includes(q) ||
            patient.email.toLowerCase().includes(q),
        );

    switch (sort) {
      case "name-asc":
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name-desc":
        list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "appointments-desc":
        list.sort((a, b) => b.appointments_count - a.appointments_count);
        break;
      case "appointments-asc":
        list.sort((a, b) => a.appointments_count - b.appointments_count);
        break;
      case "created-desc":
        list.sort((a, b) =>
          b.first_appointment.localeCompare(a.first_appointment),
        );
        break;
      case "created-asc":
        list.sort((a, b) =>
          a.first_appointment.localeCompare(b.first_appointment),
        );
        break;
    }

    return list;
  }, [patients, search, sort]);

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

      <div className="space-y-6 text-slate-100">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.15),rgba(255,255,255,0.02))]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <span>Admin patients control</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Patients
                </h1>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  Patients extracted from appointment history, with a more
                  premium and structured view.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniTopBadge label="Total" value={stats.total} />
              <MiniTopBadge label="Recurring" value={stats.recurring} />
              <MiniTopBadge label="Single Visit" value={stats.singleVisit} />
              <button
                onClick={() => loadPatients(true)}
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
                label="Patients"
                value={stats.total}
                icon="◎"
                accent="cyan"
                subtitle="Unique patient emails"
              />
              <StatCard
                label="Appointments"
                value={stats.totalAppointments}
                icon="◷"
                accent="sky"
                subtitle="Total visit count"
              />
              <StatCard
                label="Recurring"
                value={stats.recurring}
                icon="◆"
                accent="violet"
                subtitle="More than one visit"
              />
              <StatCard
                label="Single Visit"
                value={stats.singleVisit}
                icon="◌"
                accent="amber"
                subtitle="Only one recorded visit"
              />
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Filters
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Browse patients
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Search patients and change the sorting to inspect your
                    database faster.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px] xl:min-w-[520px]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search patient by name or email..."
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
                    <option value="appointments-desc">
                      Sort: Most appointments
                    </option>
                    <option value="appointments-asc">
                      Sort: Fewest appointments
                    </option>
                    <option value="name-asc">Sort: Name A-Z</option>
                    <option value="name-desc">Sort: Name Z-A</option>
                    <option value="created-desc">
                      Sort: Newest first appointment
                    </option>
                    <option value="created-asc">
                      Sort: Oldest first appointment
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Patients table
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Extracted patients
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {filteredPatients.length} result
                    {filteredPatients.length !== 1 ? "s" : ""}.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px]">
                  <thead className="bg-white/[0.03] text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left">Patient</th>
                      <th className="px-6 py-4 text-left">Email</th>
                      <th className="px-6 py-4 text-left">Appointments</th>
                      <th className="px-6 py-4 text-left">First Appointment</th>
                      <th className="px-6 py-4 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.email}
                        className="transition hover:bg-white/[0.03]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-xs font-bold text-slate-950">
                              {getInitials(patient.name, patient.email)}
                            </div>
                            <p className="font-medium text-white">
                              {patient.name || "—"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {patient.email}
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">
                          {patient.appointments_count}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {formatDatePretty(patient.first_appointment)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-14 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-slate-300">
                              ◌
                            </div>
                            <p className="text-sm font-medium text-slate-200">
                              No patients found
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

/* ================= COMPONENTS ================= */

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
  accent: "cyan" | "sky" | "violet" | "amber";
}) {
  const accentClass =
    accent === "cyan"
      ? "from-cyan-400/20 to-cyan-500/5 text-cyan-300 border-cyan-400/15"
      : accent === "sky"
        ? "from-sky-400/20 to-sky-500/5 text-sky-300 border-sky-400/15"
        : accent === "violet"
          ? "from-violet-400/20 to-violet-500/5 text-violet-300 border-violet-400/15"
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
