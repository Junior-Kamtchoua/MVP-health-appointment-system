"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* ================= TYPES ================= */

type Doctor = {
  id: string;
  full_name: string;
  email: string;
};

type Availability = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

type FilterType = "all" | "morning" | "afternoon" | "evening";

/* ================= HELPERS ================= */

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const weekDays = [1, 2, 3, 4, 5, 6, 0];

const dayLabel = (day: number) => DAYS[day] || "Unknown";

const formatTimePretty = (value: string) => {
  const [h, m] = value.slice(0, 5).split(":").map(Number);

  if (Number.isNaN(h) || Number.isNaN(m)) return value;

  const d = new Date();
  d.setHours(h, m, 0, 0);

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getTimePeriod = (time: string) => {
  const hour = parseInt(time.split(":")[0], 10);

  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

const getDurationMinutes = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  return Math.max(0, endMinutes - startMinutes);
};

const sortAvailabilities = (list: Availability[]) =>
  [...list].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });

/* ================= PAGE ================= */

export default function DoctorAvailabilityPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [formError, setFormError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id: string | null;
    label: string;
  }>({
    open: false,
    id: null,
    label: "",
  });

  /* ================= TOAST ================= */

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

  /* ================= LOAD DATA ================= */

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("id, full_name, email")
        .eq("email", user.email)
        .single();

      if (doctorError || !doctorData) {
        console.error("Doctor fetch error:", doctorError);
        addToast("error", "Unable to load doctor profile.");
        setLoading(false);
        return;
      }

      setDoctor(doctorData);

      const { data, error } = await supabase
        .from("doctor_availabilities")
        .select("id, day_of_week, start_time, end_time")
        .eq("doctor_id", doctorData.id)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Availability fetch error:", error);
        addToast("error", "Unable to load availability.");
      }

      setAvailabilities(sortAvailabilities((data || []) as Availability[]));
    } catch (err) {
      console.error("Unexpected error:", err);
      addToast("error", "Unexpected error while loading availability.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    const totalSlots = availabilities.length;
    const activeDays = new Set(availabilities.map((a) => a.day_of_week)).size;

    const totalMinutes = availabilities.reduce(
      (acc, item) => acc + getDurationMinutes(item.start_time, item.end_time),
      0,
    );

    const morning = availabilities.filter(
      (a) => getTimePeriod(a.start_time) === "morning",
    ).length;

    const afternoon = availabilities.filter(
      (a) => getTimePeriod(a.start_time) === "afternoon",
    ).length;

    const evening = availabilities.filter(
      (a) => getTimePeriod(a.start_time) === "evening",
    ).length;

    return {
      totalSlots,
      activeDays,
      totalHours: (totalMinutes / 60).toFixed(1),
      morning,
      afternoon,
      evening,
    };
  }, [availabilities]);

  /* ================= FILTERED LIST ================= */

  const filteredAvailabilities = useMemo(() => {
    let list = [...availabilities];

    if (filter !== "all") {
      list = list.filter((a) => getTimePeriod(a.start_time) === filter);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((a) =>
        dayLabel(a.day_of_week).toLowerCase().includes(term),
      );
    }

    return sortAvailabilities(list);
  }, [availabilities, filter, search]);

  /* ================= ADD ================= */

  const addAvailability = async () => {
    if (!doctor || submitting) return;

    setFormError("");

    if (startTime >= endTime) {
      setFormError("End time must be after start time.");
      addToast("error", "End time must be after start time.");
      return;
    }

    const hasOverlap = availabilities.some((item) => {
      if (item.day_of_week !== dayOfWeek) return false;
      return startTime < item.end_time && endTime > item.start_time;
    });

    if (hasOverlap) {
      setFormError("This time range overlaps with an existing slot.");
      addToast("error", "Overlapping time range detected.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("doctor_availabilities")
        .insert({
          doctor_id: doctor.id,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        addToast("error", "Failed to add availability.");
        return;
      }

      if (data) {
        setAvailabilities((prev) => sortAvailabilities([...prev, data]));
        setFormError("");
        addToast("success", "Availability added successfully.");
      }
    } catch (err) {
      console.error("Add error:", err);
      addToast("error", "Unexpected error while adding availability.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= DELETE ================= */

  const openDeleteConfirm = (item: Availability) => {
    setConfirmDelete({
      open: true,
      id: item.id,
      label: `${dayLabel(item.day_of_week)} · ${formatTimePretty(
        item.start_time,
      )} → ${formatTimePretty(item.end_time)}`,
    });
  };

  const closeDeleteConfirm = () => {
    setConfirmDelete({
      open: false,
      id: null,
      label: "",
    });
  };

  const deleteAvailability = async (id: string) => {
    setDeletingId(id);

    try {
      const { error } = await supabase
        .from("doctor_availabilities")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(error);
        addToast("error", "Failed to remove availability.");
        return;
      }

      setAvailabilities((prev) => prev.filter((a) => a.id !== id));
      addToast("success", "Availability removed.");
    } catch (err) {
      console.error("Delete error:", err);
      addToast("error", "Unexpected error while removing availability.");
    } finally {
      setDeletingId(null);
      closeDeleteConfirm();
    }
  };

  /* ================= UI ================= */

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
        <div className="h-80 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />
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

      {/* DELETE MODAL */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#07111f] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <p className="text-lg font-semibold text-white">
              Remove availability
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Are you sure you want to remove this slot?
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
              {confirmDelete.label}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeDeleteConfirm}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (confirmDelete.id) {
                    deleteAvailability(confirmDelete.id);
                  }
                }}
                className="flex-1 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"
              >
                {deletingId ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.15),rgba(255,255,255,0.02))]" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <span>Doctor availability manager</span>
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  My Availability
                </h1>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  Configure your consultation hours and keep your weekly
                  schedule clean, clear, and premium.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniTopBadge label="Doctor" value={doctor?.full_name || "—"} />
              <MiniTopBadge label="Slots" value={stats.totalSlots} />
              <MiniTopBadge label="Days" value={stats.activeDays} />
              <MiniTopBadge label="Hours / week" value={stats.totalHours} />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            label="Total Slots"
            value={stats.totalSlots}
            icon="◎"
            accent="cyan"
            subtitle="All availability blocks"
          />
          <StatCard
            label="Active Days"
            value={stats.activeDays}
            icon="◷"
            accent="blue"
            subtitle="Days currently open"
          />
          <StatCard
            label="Morning"
            value={stats.morning}
            icon="☼"
            accent="amber"
            subtitle="Morning slots"
          />
          <StatCard
            label="Afternoon"
            value={stats.afternoon}
            icon="◐"
            accent="sky"
            subtitle="Afternoon slots"
          />
          <StatCard
            label="Evening"
            value={stats.evening}
            icon="☾"
            accent="violet"
            subtitle="Evening slots"
          />
          <StatCard
            label="Hours / Week"
            value={Number(stats.totalHours)}
            icon="◆"
            accent="emerald"
            subtitle="Estimated total weekly hours"
          />
        </section>

        {/* ADD FORM */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                New slot
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Add Availability
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Create clean, non-overlapping consultation windows.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="rounded-2xl border border-white/10 bg-[#081423] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
            >
              {weekDays.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(d)}
                </option>
              ))}
            </select>

            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#081423] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
            />

            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#081423] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
            />

            <button
              onClick={addAvailability}
              disabled={submitting}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Availability"}
            </button>
          </div>

          {formError && (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {formError}
            </div>
          )}
        </section>

        {/* EXISTING */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Existing slots
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Availability List
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Search, filter, and manage every configured slot.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by day..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#081423] px-4 py-3 pl-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                />
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  ⌕
                </span>
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="rounded-2xl border border-white/10 bg-[#081423] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
              >
                <option value="all">All periods</option>
                <option value="morning">Morning only</option>
                <option value="afternoon">Afternoon only</option>
                <option value="evening">Evening only</option>
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredAvailabilities.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-slate-300">
                  ◌
                </div>
                <p className="text-sm font-medium text-slate-200">
                  No availability found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try another search or filter, or add a new slot.
                </p>
              </div>
            )}

            {filteredAvailabilities.map((a) => {
              const period = getTimePeriod(a.start_time);
              const duration = getDurationMinutes(a.start_time, a.end_time);

              return (
                <div
                  key={a.id}
                  className="rounded-[24px] border border-white/10 bg-[#081423]/85 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/15 hover:bg-[#0a1727]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold shadow-lg",
                          period === "morning" &&
                            "bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950",
                          period === "afternoon" &&
                            "bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950",
                          period === "evening" &&
                            "bg-gradient-to-br from-violet-400 to-indigo-500 text-white",
                        )}
                      >
                        {dayLabel(a.day_of_week).slice(0, 3).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-white">
                            {dayLabel(a.day_of_week)}
                          </p>

                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                            {period}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-300">
                          {formatTimePretty(a.start_time)} →{" "}
                          {formatTimePretty(a.end_time)}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Duration: {duration} min
                        </p>
                      </div>
                    </div>

                    <div className="lg:ml-auto">
                      <button
                        onClick={() => openDeleteConfirm(a)}
                        disabled={deletingId === a.id}
                        className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-500/15 disabled:opacity-50"
                      >
                        {deletingId === a.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* WEEK VIEW */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Weekly overview
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Weekly Availability
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              A cleaner weekly view grouped by morning, afternoon, and evening.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            {weekDays.map((day) => {
              const slots = availabilities.filter((a) => a.day_of_week === day);

              const morning = slots.filter(
                (s) => getTimePeriod(s.start_time) === "morning",
              );
              const afternoon = slots.filter(
                (s) => getTimePeriod(s.start_time) === "afternoon",
              );
              const evening = slots.filter(
                (s) => getTimePeriod(s.start_time) === "evening",
              );

              return (
                <div
                  key={day}
                  className="rounded-[24px] border border-white/10 bg-[#081423]/70 p-4"
                >
                  <p className="text-center text-sm font-semibold text-white">
                    {dayLabel(day)}
                  </p>

                  <div className="mt-4 space-y-4">
                    <WeekSection
                      title="Morning"
                      emptyLabel="No slots"
                      colorClass="bg-amber-500/12 text-amber-200 border border-amber-400/15"
                      slots={morning}
                    />

                    <WeekSection
                      title="Afternoon"
                      emptyLabel="No slots"
                      colorClass="bg-cyan-500/12 text-cyan-200 border border-cyan-400/15"
                      slots={afternoon}
                    />

                    <WeekSection
                      title="Evening"
                      emptyLabel="No slots"
                      colorClass="bg-violet-500/12 text-violet-200 border border-violet-400/15"
                      slots={evening}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
  accent: "cyan" | "blue" | "amber" | "sky" | "violet" | "emerald";
}) {
  const accentClass =
    accent === "cyan"
      ? "from-cyan-400/20 to-cyan-500/5 text-cyan-300 border-cyan-400/15"
      : accent === "blue"
        ? "from-blue-400/20 to-blue-500/5 text-blue-300 border-blue-400/15"
        : accent === "amber"
          ? "from-amber-400/20 to-amber-500/5 text-amber-300 border-amber-400/15"
          : accent === "sky"
            ? "from-sky-400/20 to-sky-500/5 text-sky-300 border-sky-400/15"
            : accent === "violet"
              ? "from-violet-400/20 to-violet-500/5 text-violet-300 border-violet-400/15"
              : "from-emerald-400/20 to-emerald-500/5 text-emerald-300 border-emerald-400/15";

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

function WeekSection({
  title,
  slots,
  emptyLabel,
  colorClass,
}: {
  title: string;
  slots: Availability[];
  emptyLabel: string;
  colorClass: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>

      {slots.length === 0 ? (
        <p className="text-xs text-slate-600">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {slots.map((s) => (
            <div
              key={s.id}
              className={cn(
                "rounded-xl px-2.5 py-2 text-center text-xs font-medium",
                colorClass,
              )}
            >
              {formatTimePretty(s.start_time)} → {formatTimePretty(s.end_time)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
