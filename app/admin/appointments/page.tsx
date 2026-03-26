"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* ================= TYPES ================= */

type AppointmentStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "paid"
  | string;

type Appointment = {
  id: string;
  patient_name: string | null;
  patient_email: string | null;
  doctor_email: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
};

type FilterType =
  | "all"
  | "today"
  | "upcoming"
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "paid";

type SortType =
  | "date-asc"
  | "date-desc"
  | "time-asc"
  | "time-desc"
  | "patient-asc"
  | "patient-desc"
  | "doctor-asc"
  | "doctor-desc";

type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

/* ================= HELPERS ================= */

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDatePretty = (value: string) => {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimePretty = (value: string) => {
  const raw = String(value).slice(0, 5);
  const [h, m] = raw.split(":").map(Number);

  if (Number.isNaN(h) || Number.isNaN(m)) return raw;

  const d = new Date();
  d.setHours(h, m, 0, 0);

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusStyle = (status: AppointmentStatus) => {
  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize border";

  switch (status) {
    case "pending":
      return `${base} bg-amber-500/15 text-amber-300 border-amber-400/20`;
    case "accepted":
      return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-400/20`;
    case "rejected":
      return `${base} bg-rose-500/15 text-rose-300 border-rose-400/20`;
    case "completed":
      return `${base} bg-slate-500/15 text-slate-300 border-slate-400/20`;
    case "paid":
      return `${base} bg-violet-500/15 text-violet-300 border-violet-400/20`;
    default:
      return `${base} bg-white/[0.04] text-slate-300 border-white/10`;
  }
};

const getInitials = (name: string | null) => {
  const safe = (name || "Unknown Patient").trim();
  return (
    safe
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "UP"
  );
};

const isUpcoming = (appointment: Appointment, today: string) =>
  appointment.appointment_date > today ||
  (appointment.appointment_date === today &&
    appointment.status !== "completed" &&
    appointment.status !== "rejected");

const compareDateTimeAsc = (a: Appointment, b: Appointment) =>
  `${a.appointment_date} ${a.appointment_time}`.localeCompare(
    `${b.appointment_date} ${b.appointment_time}`,
  );

const compareDateTimeDesc = (a: Appointment, b: Appointment) =>
  `${b.appointment_date} ${b.appointment_time}`.localeCompare(
    `${a.appointment_date} ${a.appointment_time}`,
  );

/* ================= PAGE ================= */

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortType>("date-desc");

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const today = getTodayString();

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

  const loadAppointments = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
            id,
            patient_name,
            patient_email,
            doctor_email,
            appointment_date,
            appointment_time,
            status
          `,
        )
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false });

      if (error) {
        console.error("Appointments fetch error:", error);
        addToast("error", "Unable to load appointments.");
        return;
      }

      setAppointments((data || []) as Appointment[]);
    } catch (err) {
      console.error("Unexpected appointments error:", err);
      addToast("error", "Unexpected error while loading appointments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadAppointments(true);
    }, 45000);

    return () => window.clearInterval(interval);
  }, []);

  const counts = useMemo(
    () => ({
      all: appointments.length,
      today: appointments.filter((a) => a.appointment_date === today).length,
      upcoming: appointments.filter((a) => isUpcoming(a, today)).length,
      pending: appointments.filter((a) => a.status === "pending").length,
      accepted: appointments.filter((a) => a.status === "accepted").length,
      rejected: appointments.filter((a) => a.status === "rejected").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      paid: appointments.filter((a) => a.status === "paid").length,
    }),
    [appointments, today],
  );

  const filteredAppointments = useMemo(() => {
    let list = [...appointments];
    const q = search.trim().toLowerCase();

    if (statusFilter === "today") {
      list = list.filter((a) => a.appointment_date === today);
    } else if (statusFilter === "upcoming") {
      list = list.filter((a) => isUpcoming(a, today));
    } else if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (q) {
      list = list.filter((a) => {
        const patient = (a.patient_name || "").toLowerCase();
        const patientEmail = (a.patient_email || "").toLowerCase();
        const doctor = a.doctor_email.toLowerCase();

        return (
          patient.includes(q) || patientEmail.includes(q) || doctor.includes(q)
        );
      });
    }

    switch (sort) {
      case "date-asc":
        list.sort(compareDateTimeAsc);
        break;
      case "date-desc":
        list.sort(compareDateTimeDesc);
        break;
      case "time-asc":
        list.sort((a, b) =>
          a.appointment_time.localeCompare(b.appointment_time),
        );
        break;
      case "time-desc":
        list.sort((a, b) =>
          b.appointment_time.localeCompare(a.appointment_time),
        );
        break;
      case "patient-asc":
        list.sort((a, b) =>
          (a.patient_name || "").localeCompare(b.patient_name || ""),
        );
        break;
      case "patient-desc":
        list.sort((a, b) =>
          (b.patient_name || "").localeCompare(a.patient_name || ""),
        );
        break;
      case "doctor-asc":
        list.sort((a, b) => a.doctor_email.localeCompare(b.doctor_email));
        break;
      case "doctor-desc":
        list.sort((a, b) => b.doctor_email.localeCompare(a.doctor_email));
        break;
    }

    return list;
  }, [appointments, search, sort, statusFilter, today]);

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
                <span>Admin appointments control</span>
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Appointments
                </h1>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  Monitor every clinic appointment from a cleaner premium
                  interface.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniTopBadge label="Total" value={counts.all} />
              <MiniTopBadge label="Today" value={counts.today} />
              <MiniTopBadge label="Upcoming" value={counts.upcoming} />
              <button
                onClick={() => loadAppointments(true)}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                label="Pending"
                value={counts.pending}
                icon="◌"
                accent="amber"
                subtitle="Awaiting action"
              />
              <StatCard
                label="Accepted"
                value={counts.accepted}
                icon="✓"
                accent="emerald"
                subtitle="Confirmed"
              />
              <StatCard
                label="Paid"
                value={counts.paid}
                icon="◈"
                accent="violet"
                subtitle="Payment received"
              />
              <StatCard
                label="Completed"
                value={counts.completed}
                icon="◆"
                accent="slate"
                subtitle="Finished visits"
              />
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Filters
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Browse appointments
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Search by patient or doctor and sort the results your way.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px] xl:min-w-[520px]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search patient, email, or doctor..."
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
                    <option value="date-desc">Sort: Newest date</option>
                    <option value="date-asc">Sort: Oldest date</option>
                    <option value="time-asc">Sort: Earliest time</option>
                    <option value="time-desc">Sort: Latest time</option>
                    <option value="patient-asc">Sort: Patient A-Z</option>
                    <option value="patient-desc">Sort: Patient Z-A</option>
                    <option value="doctor-asc">Sort: Doctor A-Z</option>
                    <option value="doctor-desc">Sort: Doctor Z-A</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <FilterButton
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                >
                  All ({counts.all})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "today"}
                  onClick={() => setStatusFilter("today")}
                >
                  Today ({counts.today})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "upcoming"}
                  onClick={() => setStatusFilter("upcoming")}
                >
                  Upcoming ({counts.upcoming})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "pending"}
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending ({counts.pending})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "accepted"}
                  onClick={() => setStatusFilter("accepted")}
                >
                  Accepted ({counts.accepted})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "rejected"}
                  onClick={() => setStatusFilter("rejected")}
                >
                  Rejected ({counts.rejected})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "completed"}
                  onClick={() => setStatusFilter("completed")}
                >
                  Completed ({counts.completed})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "paid"}
                  onClick={() => setStatusFilter("paid")}
                >
                  Paid ({counts.paid})
                </FilterButton>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Appointments table
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    All clinic appointments
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {filteredAppointments.length} result
                    {filteredAppointments.length !== 1 ? "s" : ""}.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-white/[0.03] text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left">Patient</th>
                      <th className="px-6 py-4 text-left">Doctor</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Time</th>
                      <th className="px-6 py-4 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredAppointments.map((a) => (
                      <tr
                        key={a.id}
                        className="transition hover:bg-white/[0.03]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-xs font-bold text-slate-950">
                              {getInitials(a.patient_name)}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {a.patient_name || "—"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {a.patient_email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {a.doctor_email}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {formatDatePretty(a.appointment_date)}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {formatTimePretty(a.appointment_time)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusStyle(a.status)}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredAppointments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-14 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-slate-300">
                              ◌
                            </div>
                            <p className="text-sm font-medium text-slate-200">
                              No appointments found
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Try another filter or search query.
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
  accent: "amber" | "emerald" | "violet" | "slate";
}) {
  const accentClass =
    accent === "amber"
      ? "from-amber-400/20 to-amber-500/5 text-amber-300 border-amber-400/15"
      : accent === "emerald"
        ? "from-emerald-400/20 to-emerald-500/5 text-emerald-300 border-emerald-400/15"
        : accent === "violet"
          ? "from-violet-400/20 to-violet-500/5 text-violet-300 border-violet-400/15"
          : "from-slate-400/20 to-slate-500/5 text-slate-300 border-slate-400/15";

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

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-cyan-400/20 bg-cyan-500/12 text-cyan-100 shadow-[0_10px_24px_rgba(34,211,238,0.10)]"
          : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
      )}
    >
      {children}
    </button>
  );
}
