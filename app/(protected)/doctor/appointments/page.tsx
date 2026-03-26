"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/*TYPES*/

type AppointmentStatus =
  | "pending"
  | "paid"
  | "accepted"
  | "completed"
  | "rejected"
  | string;

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  patient_name: string | null;
};

type FilterType =
  | "all"
  | "today"
  | "upcoming"
  | "pending"
  | "paid"
  | "accepted"
  | "completed"
  | "rejected";

type SortType =
  | "date-asc"
  | "date-desc"
  | "time-asc"
  | "time-desc"
  | "patient-asc"
  | "patient-desc";

type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

/*HELPERS*/

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  if (!value) return "—";

  const raw = value.slice(0, 5);
  const [h, m] = raw.split(":").map(Number);

  if (Number.isNaN(h) || Number.isNaN(m)) return value;

  const d = new Date();
  d.setHours(h, m, 0, 0);

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getPatientInitials = (name: string | null) => {
  const safe = (name || "Unknown Patient").trim();
  const parts = safe.split(" ").filter(Boolean).slice(0, 2);

  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "UP";
};

const getTimeOfDay = (time: string) => {
  const hour = Number(time?.slice(0, 2));

  if (Number.isNaN(hour)) return "Unknown";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
};

const compareDateTimeAsc = (a: Appointment, b: Appointment) => {
  const left = `${a.appointment_date} ${a.appointment_time}`;
  const right = `${b.appointment_date} ${b.appointment_time}`;
  return left.localeCompare(right);
};

const compareDateTimeDesc = (a: Appointment, b: Appointment) => {
  const left = `${a.appointment_date} ${a.appointment_time}`;
  const right = `${b.appointment_date} ${b.appointment_time}`;
  return right.localeCompare(left);
};

const getStatusStyle = (status: AppointmentStatus) => {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20";
    case "accepted":
      return "bg-cyan-500/15 text-cyan-300 border border-cyan-400/20";
    case "paid":
      return "bg-violet-500/15 text-violet-300 border border-violet-400/20";
    case "rejected":
      return "bg-rose-500/15 text-rose-300 border border-rose-400/20";
    case "pending":
    default:
      return "bg-amber-500/15 text-amber-300 border border-amber-400/20";
  }
};

const isUpcoming = (appointment: Appointment, today: string) =>
  appointment.appointment_date > today ||
  (appointment.appointment_date === today &&
    appointment.status !== "completed" &&
    appointment.status !== "rejected");

const getPriorityBadge = (appointment: Appointment, today: string) => {
  if (appointment.appointment_date === today) return "Today";
  if (appointment.appointment_date > today) return "Upcoming";
  if (
    appointment.appointment_date < today &&
    appointment.status !== "completed" &&
    appointment.status !== "rejected"
  ) {
    return "Past";
  }
  return null;
};

/*PAGE*/

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("date-asc");
  const [search, setSearch] = useState("");

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const today = getTodayString();

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

  /*LOAD DATA */

  const loadAppointments = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, patient_name")
        .eq("doctor_email", user.email)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) {
        console.error("Fetch error:", error);
        addToast("error", "Unable to load appointments.");
      }

      setAppointments((data || []) as Appointment[]);
    } catch (err) {
      console.error("Unexpected error:", err);
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

  /*STATS*/

  const stats = useMemo(() => {
    const total = appointments.length;
    const todayCount = appointments.filter(
      (a) => a.appointment_date === today,
    ).length;
    const upcoming = appointments.filter((a) => isUpcoming(a, today)).length;
    const pending = appointments.filter(
      (a) => a.status === "pending" || a.status === "paid",
    ).length;
    const accepted = appointments.filter((a) => a.status === "accepted").length;
    const paid = appointments.filter((a) => a.status === "paid").length;
    const completed = appointments.filter(
      (a) => a.status === "completed",
    ).length;
    const rejected = appointments.filter((a) => a.status === "rejected").length;

    return {
      total,
      today: todayCount,
      upcoming,
      pending,
      accepted,
      paid,
      completed,
      rejected,
    };
  }, [appointments, today]);

  /* FILTER + SORT + SEARCH */

  const filteredAppointments = useMemo(() => {
    let list = [...appointments];

    if (filter === "today") {
      list = list.filter((a) => a.appointment_date === today);
    } else if (filter === "upcoming") {
      list = list.filter((a) => isUpcoming(a, today));
    } else if (filter === "pending") {
      list = list.filter((a) => a.status === "pending");
    } else if (filter === "paid") {
      list = list.filter((a) => a.status === "paid");
    } else if (filter === "accepted") {
      list = list.filter((a) => a.status === "accepted");
    } else if (filter === "completed") {
      list = list.filter((a) => a.status === "completed");
    } else if (filter === "rejected") {
      list = list.filter((a) => a.status === "rejected");
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((a) =>
        (a.patient_name || "Unknown patient").toLowerCase().includes(term),
      );
    }

    switch (sort) {
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
      case "date-asc":
      default:
        list.sort(compareDateTimeAsc);
        break;
    }

    return list;
  }, [appointments, filter, search, sort, today]);

  const groupedAppointments = useMemo(() => {
    const groups = new Map<string, Appointment[]>();

    filteredAppointments.forEach((item) => {
      const key = item.appointment_date;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(item);
    });

    return Array.from(groups.entries());
  }, [filteredAppointments]);

  /* UI */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
      </div>
    );
  }

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
                <span>Doctor appointments manager</span>
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Appointments
                </h1>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  View every scheduled appointment with a cleaner, darker, more
                  premium experience.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniTopBadge label="Total" value={stats.total} />
              <MiniTopBadge label="Today" value={stats.today} />
              <MiniTopBadge label="Upcoming" value={stats.upcoming} />
              <MiniTopBadge
                label="Live"
                value={refreshing ? "Refreshing" : "Active"}
              />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
          <StatCard
            label="Total"
            value={stats.total}
            icon="◎"
            accent="cyan"
            subtitle="All appointments"
          />
          <StatCard
            label="Today"
            value={stats.today}
            icon="◷"
            accent="blue"
            subtitle="Scheduled today"
          />
          <StatCard
            label="Upcoming"
            value={stats.upcoming}
            icon="→"
            accent="sky"
            subtitle="Future or open"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon="◌"
            accent="amber"
            subtitle="Waiting action"
          />
          <StatCard
            label="Paid"
            value={stats.paid}
            icon="◈"
            accent="violet"
            subtitle="Payment received"
          />
          <StatCard
            label="Accepted"
            value={stats.accepted}
            icon="✓"
            accent="emerald"
            subtitle="Confirmed"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon="◆"
            accent="slate"
            subtitle="Finished visits"
          />
        </section>

        {/* FILTERS */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Filters
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Browse appointments
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Search by patient, filter by status, and sort however you want.
              </p>
            </div>

            <button
              onClick={() => loadAppointments(true)}
              disabled={refreshing}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-500/15 disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh now"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient..."
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
              <option value="date-asc">Sort: Date ascending</option>
              <option value="date-desc">Sort: Date descending</option>
              <option value="time-asc">Sort: Time ascending</option>
              <option value="time-desc">Sort: Time descending</option>
              <option value="patient-asc">Sort: Patient A-Z</option>
              <option value="patient-desc">Sort: Patient Z-A</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All ({stats.total})
            </FilterButton>
            <FilterButton
              active={filter === "today"}
              onClick={() => setFilter("today")}
            >
              Today ({stats.today})
            </FilterButton>
            <FilterButton
              active={filter === "upcoming"}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming ({stats.upcoming})
            </FilterButton>
            <FilterButton
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
            >
              Pending
            </FilterButton>
            <FilterButton
              active={filter === "paid"}
              onClick={() => setFilter("paid")}
            >
              Paid ({stats.paid})
            </FilterButton>
            <FilterButton
              active={filter === "accepted"}
              onClick={() => setFilter("accepted")}
            >
              Accepted ({stats.accepted})
            </FilterButton>
            <FilterButton
              active={filter === "completed"}
              onClick={() => setFilter("completed")}
            >
              Completed ({stats.completed})
            </FilterButton>
            <FilterButton
              active={filter === "rejected"}
              onClick={() => setFilter("rejected")}
            >
              Rejected ({stats.rejected})
            </FilterButton>
          </div>
        </section>

        {/* EMPTY STATE */}
        {filteredAppointments.length === 0 && (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-14 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-slate-300">
              ◌
            </div>
            <p className="text-sm font-medium text-slate-200">
              No appointments found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try another filter, search keyword, or refresh the list.
            </p>
          </section>
        )}

        {/* LIST */}
        {groupedAppointments.length > 0 && (
          <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Appointment list
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Scheduled visits
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Grouped by date with a cleaner premium layout.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-300">
                {filteredAppointments.length} result
                {filteredAppointments.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="space-y-6">
              {groupedAppointments.map(([date, items]) => (
                <div key={date} className="space-y-3">
                  <div className="sticky top-0 z-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#07111f]/90 px-4 py-3 backdrop-blur-xl">
                    <div className="h-px flex-1 bg-white/10" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                      {formatDatePretty(date)}
                    </p>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="space-y-3">
                    {items.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        priority={getPriorityBadge(a, today)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* COMPONENTS */

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
  accent: "cyan" | "blue" | "sky" | "amber" | "violet" | "emerald" | "slate";
}) {
  const accentClass =
    accent === "cyan"
      ? "from-cyan-400/20 to-cyan-500/5 text-cyan-300 border-cyan-400/15"
      : accent === "blue"
        ? "from-blue-400/20 to-blue-500/5 text-blue-300 border-blue-400/15"
        : accent === "sky"
          ? "from-sky-400/20 to-sky-500/5 text-sky-300 border-sky-400/15"
          : accent === "amber"
            ? "from-amber-400/20 to-amber-500/5 text-amber-300 border-amber-400/15"
            : accent === "violet"
              ? "from-violet-400/20 to-violet-500/5 text-violet-300 border-violet-400/15"
              : accent === "emerald"
                ? "from-emerald-400/20 to-emerald-500/5 text-emerald-300 border-emerald-400/15"
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

function AppointmentCard({
  appointment,
  priority,
}: {
  appointment: Appointment;
  priority: string | null;
}) {
  return (
    <div className="group rounded-[24px] border border-white/10 bg-[#081423]/85 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/15 hover:bg-[#0a1727]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-sm font-bold text-slate-950 shadow-lg">
            {getPatientInitials(appointment.patient_name)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-white">
                {appointment.patient_name || "Unknown patient"}
              </p>

              {priority && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                  {priority}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-400">
              {formatDatePretty(appointment.appointment_date)} ·{" "}
              {formatTimePretty(appointment.appointment_time)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">
                {getTimeOfDay(appointment.appointment_time)}
              </span>

              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                  getStatusStyle(appointment.status),
                )}
              >
                {appointment.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
