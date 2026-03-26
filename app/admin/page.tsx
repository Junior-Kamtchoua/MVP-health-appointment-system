"use client";

import { useEffect, useMemo, useState } from "react";
import AppointmentsChart from "@/components/admin/AppointmentsChart";
import AppointmentsStatusPie from "@/components/admin/AppointmentsStatusPie";

/*TYPES*/

type Stats = {
  totalDoctors: number;
  totalPatients: number;
  appointmentsToday: number;
};

type RecentAppointment = {
  patient_name: string | null;
  patient_email: string | null;
  doctor_email: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
};

type Doctor = {
  id: string;
  full_name: string;
  email: string;
};

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

/*HELPERS*/

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

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
  if (!value) return "—";
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

const getStatusStyle = (status: string) => {
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

const getTodayPretty = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

/*PAGE*/

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointmentsSearch, setAppointmentsSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [sort, setSort] = useState<SortType>("date-asc");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [today, setToday] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /*TOAST*/

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

  /*FETCH*/

  const fetchData = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);

      const [statsRes, apptsRes, doctorsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/appointments/recent"),
        fetch("/api/admin/doctors"),
      ]);

      if (!statsRes.ok || !apptsRes.ok || !doctorsRes.ok) {
        throw new Error("Failed to load admin dashboard data.");
      }

      const [statsData, apptsData, doctorsData] = await Promise.all([
        statsRes.json(),
        apptsRes.json(),
        doctorsRes.json(),
      ]);

      setStats(statsData);
      setRecentAppointments(apptsData || []);
      setDoctors(doctorsData || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      addToast("error", "Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    setToday(getTodayPretty());
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchData(true);
    }, 45000);

    return () => window.clearInterval(interval);
  }, []);

  const appointmentStatusCounts = useMemo(() => {
    return {
      all: recentAppointments.length,
      pending: recentAppointments.filter((a) => a.status === "pending").length,
      accepted: recentAppointments.filter((a) => a.status === "accepted")
        .length,
      rejected: recentAppointments.filter((a) => a.status === "rejected")
        .length,
      completed: recentAppointments.filter((a) => a.status === "completed")
        .length,
      paid: recentAppointments.filter((a) => a.status === "paid").length,
    };
  }, [recentAppointments]);

  const filteredAppointments = useMemo(() => {
    let list = [...recentAppointments];

    if (statusFilter !== "all") {
      list = list.filter((appointment) => appointment.status === statusFilter);
    }

    const term = appointmentsSearch.trim().toLowerCase();
    if (term) {
      list = list.filter((appointment) => {
        const patient = (appointment.patient_name || "").toLowerCase();
        const patientEmail = (appointment.patient_email || "").toLowerCase();
        const doctorEmail = (appointment.doctor_email || "").toLowerCase();
        return (
          patient.includes(term) ||
          patientEmail.includes(term) ||
          doctorEmail.includes(term)
        );
      });
    }

    switch (sort) {
      case "date-desc":
        list.sort((a, b) =>
          `${b.appointment_date} ${b.appointment_time}`.localeCompare(
            `${a.appointment_date} ${a.appointment_time}`,
          ),
        );
        break;
      case "time-asc":
        list.sort((a, b) =>
          String(a.appointment_time).localeCompare(String(b.appointment_time)),
        );
        break;
      case "time-desc":
        list.sort((a, b) =>
          String(b.appointment_time).localeCompare(String(a.appointment_time)),
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
      case "date-asc":
      default:
        list.sort((a, b) =>
          `${a.appointment_date} ${a.appointment_time}`.localeCompare(
            `${b.appointment_date} ${b.appointment_time}`,
          ),
        );
        break;
    }

    return list;
  }, [appointmentsSearch, recentAppointments, sort, statusFilter]);

  const filteredDoctors = useMemo(() => {
    const term = doctorSearch.trim().toLowerCase();
    if (!term) return doctors;

    return doctors.filter((doc) => {
      const fullName = doc.full_name.toLowerCase();
      const email = doc.email.toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }, [doctorSearch, doctors]);

  /*UI*/

  return (
    <>
      {/* TOASTS */}
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
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.15),rgba(255,255,255,0.02))]" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <span>Admin control center</span>
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Dashboard
                </h1>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  Welcome back,{" "}
                  <span className="font-semibold text-cyan-200">Admin</span>.
                  Monitor your clinic, track activity, and manage operations
                  from one premium workspace.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniTopBadge label="Role" value="Administrator" />
              <MiniTopBadge label="Date" value={today || "—"} />
              <MiniTopBadge
                label="Live"
                value={refreshing ? "Refreshing" : "Active"}
              />
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-500/15 disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </section>

        {/* LOADING */}
        {loading && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="h-80 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
              <div className="h-80 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
            </div>

            <div className="h-[420px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
          </>
        )}

        {/* CONTENT */}
        {!loading && stats && (
          <>
            {/* STATS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Patients"
                value={stats.totalPatients}
                icon="◎"
                subtitle="Registered patient records"
                accent="cyan"
              />
              <StatCard
                label="Total Doctors"
                value={stats.totalDoctors}
                icon="✚"
                subtitle="Active medical staff"
                accent="sky"
              />
              <StatCard
                label="Appointments Today"
                value={stats.appointmentsToday}
                icon="◷"
                subtitle="Scheduled for today"
                accent="amber"
              />
              <StatCard
                label="Recent Appointments"
                value={recentAppointments.length}
                icon="◈"
                subtitle="Loaded on dashboard"
                accent="violet"
              />
            </section>

            {/* FILTER BAR */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Appointment filters
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Recent appointments
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Search, sort, and filter recent visits across the clinic.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px] xl:min-w-[520px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={appointmentsSearch}
                      onChange={(e) => setAppointmentsSearch(e.target.value)}
                      placeholder="Search patient, patient email, or doctor email..."
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
                    <option value="date-asc">Sort: Date ascending</option>
                    <option value="date-desc">Sort: Date descending</option>
                    <option value="time-asc">Sort: Time ascending</option>
                    <option value="time-desc">Sort: Time descending</option>
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
                  All ({appointmentStatusCounts.all})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "pending"}
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending ({appointmentStatusCounts.pending})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "accepted"}
                  onClick={() => setStatusFilter("accepted")}
                >
                  Accepted ({appointmentStatusCounts.accepted})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "rejected"}
                  onClick={() => setStatusFilter("rejected")}
                >
                  Rejected ({appointmentStatusCounts.rejected})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "completed"}
                  onClick={() => setStatusFilter("completed")}
                >
                  Completed ({appointmentStatusCounts.completed})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "paid"}
                  onClick={() => setStatusFilter("paid")}
                >
                  Paid ({appointmentStatusCounts.paid})
                </FilterButton>
              </div>
            </section>

            {/* TABLE */}
            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Appointments table
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Clinic activity
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {filteredAppointments.length} result
                    {filteredAppointments.length !== 1 ? "s" : ""} currently
                    displayed.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-white/[0.03] text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left">Patient</th>
                      <th className="px-6 py-4 text-left">Patient Email</th>
                      <th className="px-6 py-4 text-left">Doctor</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Time</th>
                      <th className="px-6 py-4 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredAppointments.map((appointment, index) => (
                      <tr
                        key={`${appointment.doctor_email}-${appointment.appointment_date}-${appointment.appointment_time}-${index}`}
                        className="transition hover:bg-white/[0.03]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-xs font-bold text-slate-950">
                              {getInitials(
                                appointment.patient_name || "Unknown Patient",
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {appointment.patient_name || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {appointment.patient_email || "—"}
                        </td>

                        <td className="px-6 py-4 text-slate-200">
                          {appointment.doctor_email}
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {formatDatePretty(appointment.appointment_date)}
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {formatTimePretty(
                            String(appointment.appointment_time),
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={getStatusStyle(appointment.status)}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredAppointments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-14 text-center">
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

            {/* CHARTS */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Analytics
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Appointments chart
                  </h3>
                </div>
                <AppointmentsChart />
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Distribution
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Appointment statuses
                  </h3>
                </div>
                <AppointmentsStatusPie />
              </div>
            </section>

            {/* DOCTORS */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Doctors overview
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Active doctors
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Browse currently loaded doctor records.
                  </p>
                </div>

                <div className="relative xl:min-w-[320px]">
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Search doctor..."
                    className="w-full rounded-2xl border border-white/10 bg-[#081423] px-4 py-3 pl-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                  />
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    ⌕
                  </span>
                </div>
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-12 text-center">
                  <p className="text-sm font-medium text-slate-200">
                    No doctors found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try another search term.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-[24px] border border-white/10 bg-[#081423]/85 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/15 hover:bg-[#0a1727]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-sm font-bold text-slate-950">
                          {getInitials(doc.full_name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {doc.full_name}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {doc.email}
                          </p>
                        </div>

                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {!loading && !stats && (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-slate-300">
              ✕
            </div>
            <p className="text-sm font-medium text-slate-200">
              Failed to load dashboard data
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Please refresh the page and try again.
            </p>
          </section>
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
  accent: "cyan" | "sky" | "amber" | "violet";
}) {
  const accentClass =
    accent === "cyan"
      ? "from-cyan-400/20 to-cyan-500/5 text-cyan-300 border-cyan-400/15"
      : accent === "sky"
        ? "from-sky-400/20 to-sky-500/5 text-sky-300 border-sky-400/15"
        : accent === "amber"
          ? "from-amber-400/20 to-amber-500/5 text-amber-300 border-amber-400/15"
          : "from-violet-400/20 to-violet-500/5 text-violet-300 border-violet-400/15";

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
