"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/*TYPES*/

type PaymentStatus = "paid" | "succeeded" | "pending" | "failed" | string;

type Payment = {
  id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
  appointment_id: string | null;
  user_id: string | null;
  stripe_session_id: string;
};

type FilterType = "all" | "paid" | "succeeded" | "pending" | "failed";

type SortType =
  | "date-desc"
  | "date-asc"
  | "amount-desc"
  | "amount-asc"
  | "status-asc"
  | "status-desc";

type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

/*HELPERS*/

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getStatusStyle = (status: PaymentStatus) => {
  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize border";

  switch (status) {
    case "paid":
    case "succeeded":
      return `${base} bg-emerald-500/15 text-emerald-300 border-emerald-400/20`;
    case "pending":
      return `${base} bg-amber-500/15 text-amber-300 border-amber-400/20`;
    case "failed":
      return `${base} bg-rose-500/15 text-rose-300 border-rose-400/20`;
    default:
      return `${base} bg-white/[0.04] text-slate-300 border-white/10`;
  }
};

const formatAmount = (cents: number, currency: string) =>
  `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;

const formatDateTimePretty = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/*PAGE*/

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortType>("date-desc");

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

  const loadPayments = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);

      const { data, error } = await supabase
        .from("payments")
        .select(
          `
            id,
            amount_cents,
            currency,
            status,
            created_at,
            appointment_id,
            user_id,
            stripe_session_id
          `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Payments fetch error:", error);
        addToast("error", "Unable to load payments.");
        return;
      }

      setPayments((data || []) as Payment[]);
    } catch (err) {
      console.error("Unexpected payments error:", err);
      addToast("error", "Unexpected error while loading payments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadPayments(true);
    }, 45000);

    return () => window.clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = payments.length;
    const paid = payments.filter(
      (p) => p.status === "paid" || p.status === "succeeded",
    ).length;
    const pending = payments.filter((p) => p.status === "pending").length;
    const failed = payments.filter((p) => p.status === "failed").length;
    const revenue = payments
      .filter((p) => p.status === "paid" || p.status === "succeeded")
      .reduce((acc, p) => acc + p.amount_cents, 0);

    return { total, paid, pending, failed, revenue };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      const matchesSearch =
        q === "" ||
        (payment.user_id || "").toLowerCase().includes(q) ||
        (payment.appointment_id || "").toLowerCase().includes(q) ||
        payment.stripe_session_id.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });

    switch (sort) {
      case "date-desc":
        list.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case "date-asc":
        list.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case "amount-desc":
        list.sort((a, b) => b.amount_cents - a.amount_cents);
        break;
      case "amount-asc":
        list.sort((a, b) => a.amount_cents - b.amount_cents);
        break;
      case "status-asc":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case "status-desc":
        list.sort((a, b) => b.status.localeCompare(a.status));
        break;
    }

    return list;
  }, [payments, search, sort, statusFilter]);

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
                <span>Admin payments control</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Payments
                </h1>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  Review all payments processed through the platform with a more
                  premium monitoring view.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniTopBadge label="Total" value={stats.total} />
              <MiniTopBadge label="Paid" value={stats.paid} />
              <MiniTopBadge label="Pending" value={stats.pending} />
              <button
                onClick={() => loadPayments(true)}
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
                label="Paid / Succeeded"
                value={stats.paid}
                icon="✓"
                accent="emerald"
                subtitle="Successful payments"
              />
              <StatCard
                label="Pending"
                value={stats.pending}
                icon="◌"
                accent="amber"
                subtitle="Awaiting completion"
              />
              <StatCard
                label="Failed"
                value={stats.failed}
                icon="✕"
                accent="rose"
                subtitle="Unsuccessful payments"
              />
              <StatCard
                label="Revenue"
                value={Number((stats.revenue / 100).toFixed(2))}
                icon="◈"
                accent="violet"
                subtitle="Paid revenue total"
              />
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Filters
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Browse payments
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Search by user ID, appointment ID, or Stripe session and
                    sort your results.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px] xl:min-w-[520px]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by user, appointment, or Stripe session..."
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
                    <option value="date-desc">Sort: Newest</option>
                    <option value="date-asc">Sort: Oldest</option>
                    <option value="amount-desc">Sort: Highest amount</option>
                    <option value="amount-asc">Sort: Lowest amount</option>
                    <option value="status-asc">Sort: Status A-Z</option>
                    <option value="status-desc">Sort: Status Z-A</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <FilterButton
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                >
                  All ({stats.total})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "paid"}
                  onClick={() => setStatusFilter("paid")}
                >
                  Paid
                </FilterButton>
                <FilterButton
                  active={statusFilter === "succeeded"}
                  onClick={() => setStatusFilter("succeeded")}
                >
                  Succeeded
                </FilterButton>
                <FilterButton
                  active={statusFilter === "pending"}
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending ({stats.pending})
                </FilterButton>
                <FilterButton
                  active={statusFilter === "failed"}
                  onClick={() => setStatusFilter("failed")}
                >
                  Failed ({stats.failed})
                </FilterButton>
              </div>
            </section>

            {filteredPayments.length === 0 ? (
              <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-slate-300">
                  ◌
                </div>
                <p className="text-sm font-medium text-slate-200">
                  No payments found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try another filter or search query.
                </p>
              </section>
            ) : (
              <div className="grid gap-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-2xl font-bold text-white">
                            {formatAmount(
                              payment.amount_cents,
                              payment.currency,
                            )}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {formatDateTimePretty(payment.created_at)}
                          </p>
                        </div>

                        <span className={getStatusStyle(payment.status)}>
                          {payment.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 md:grid-cols-2">
                        <InfoPill label="Payment ID" value={payment.id} />
                        <InfoPill
                          label="User ID"
                          value={payment.user_id || "—"}
                        />
                        <InfoPill
                          label="Appointment ID"
                          value={payment.appointment_id || "—"}
                        />
                        <InfoPill
                          label="Currency"
                          value={payment.currency.toUpperCase()}
                        />
                        <InfoPill
                          label="Stripe Session"
                          value={payment.stripe_session_id}
                          full
                        />
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          disabled
                          className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-500"
                        >
                          View appointment
                        </button>

                        <button
                          disabled
                          className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-500"
                        >
                          View receipt
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  accent: "emerald" | "amber" | "rose" | "violet";
}) {
  const accentClass =
    accent === "emerald"
      ? "from-emerald-400/20 to-emerald-500/5 text-emerald-300 border-emerald-400/15"
      : accent === "amber"
        ? "from-amber-400/20 to-amber-500/5 text-amber-300 border-amber-400/15"
        : accent === "rose"
          ? "from-rose-400/20 to-rose-500/5 text-rose-300 border-rose-400/15"
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

function InfoPill({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#081423]/85 px-4 py-3",
        full && "md:col-span-2",
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm text-slate-200">{value}</p>
    </div>
  );
}
