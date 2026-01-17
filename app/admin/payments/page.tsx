"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Payment = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  appointment_id: string;
  user_id: string;
  stripe_session_id: string;
};

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
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Payments — Admin</h1>

      {loading && <p>Loading...</p>}

      {!loading && payments.length === 0 && (
        <p className="text-gray-500">No payments found.</p>
      )}

      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white p-4 rounded-xl shadow">
            <p className="font-semibold">
              ${(payment.amount_cents / 100).toFixed(2)}{" "}
              {payment.currency.toUpperCase()}
            </p>

            <p className="text-sm text-gray-600">Status: {payment.status}</p>

            <p className="text-xs text-gray-500">
              Date: {new Date(payment.created_at).toLocaleString()}
            </p>

            <p className="text-xs text-gray-400">User ID: {payment.user_id}</p>

            <p className="text-xs text-gray-400">
              Appointment ID: {payment.appointment_id}
            </p>

            <p className="text-xs text-gray-400">
              Stripe Session: {payment.stripe_session_id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
