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
};

export default function UserPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          "id, amount_cents, currency, status, created_at, appointment_id"
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
    <div className="min-h-screen bg-gray-100 px-4 sm:px-8 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">My Payments</h1>

      {loading && <p className="text-gray-700 font-medium">Loading...</p>}

      {!loading && payments.length === 0 && (
        <p className="text-gray-700">No payments found.</p>
      )}

      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white p-4 rounded-xl shadow border border-gray-200"
          >
            <p className="font-semibold text-gray-900 text-lg">
              ${(payment.amount_cents / 100).toFixed(2)}{" "}
              {payment.currency.toUpperCase()}
            </p>

            <p className="text-sm text-gray-700 font-medium">
              Status: <span className="capitalize">{payment.status}</span>
            </p>

            <p className="text-xs text-gray-600 mt-1">
              Date: {new Date(payment.created_at).toLocaleString()}
            </p>

            <p className="text-xs text-gray-600 break-all">
              Appointment ID: {payment.appointment_id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
