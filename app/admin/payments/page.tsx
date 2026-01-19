"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Payment = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  appointment_id: string | null;
  user_id: string | null;
  stripe_session_id: string;
};

/* ================= UTILS ================= */

const statusBadge = (status: string) => {
  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

  switch (status) {
    case "paid":
      return `${base} bg-green-100 text-green-700`;
    case "pending":
      return `${base} bg-yellow-100 text-yellow-700`;
    case "failed":
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
};

const formatAmount = (cents: number, currency: string) =>
  `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;

/* ================= PAGE ================= */

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
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
        `
        )
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPayments(data);
      }

      setLoading(false);
    };

    fetchPayments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payments — Admin</h1>
          <p className="text-sm text-gray-500">
            All payments processed through the platform
          </p>
        </div>

        <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
          Total: {payments.length}
        </span>
      </div>

      {/* CONTENT */}
      {loading && (
        <p className="text-center text-gray-500 py-20">Loading payments...</p>
      )}

      {!loading && payments.length === 0 && (
        <p className="text-center text-gray-500 py-20">No payments found.</p>
      )}

      {/* PAYMENTS LIST */}
      <div className="grid gap-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white rounded-xl shadow p-5 flex flex-col gap-4"
          >
            {/* TOP */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xl font-bold">
                  {formatAmount(payment.amount_cents, payment.currency)}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(payment.created_at).toLocaleString()}
                </p>
              </div>

              <span className={statusBadge(payment.status)}>
                {payment.status}
              </span>
            </div>

            {/* DETAILS */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-800">User ID:</span>{" "}
                {payment.user_id || "—"}
              </p>

              <p>
                <span className="font-medium text-gray-800">
                  Appointment ID:
                </span>{" "}
                {payment.appointment_id || "—"}
              </p>

              <p className="md:col-span-2 truncate">
                <span className="font-medium text-gray-800">
                  Stripe Session:
                </span>{" "}
                {payment.stripe_session_id}
              </p>
            </div>

            {/* ACTIONS (READY FOR FUTURE) */}
            <div className="flex gap-3 pt-2">
              <button
                disabled
                className="text-sm px-4 py-2 rounded-md border text-gray-400 cursor-not-allowed"
              >
                View appointment
              </button>

              <button
                disabled
                className="text-sm px-4 py-2 rounded-md border text-gray-400 cursor-not-allowed"
              >
                View receipt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
