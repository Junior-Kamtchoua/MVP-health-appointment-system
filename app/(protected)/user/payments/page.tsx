"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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

  /*FETCH*/

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("payments")
          .select(
            "id, amount_cents, currency, status, created_at, appointment_id, user_id",
          )
          .eq("user_id", user.id) // ✅ SECURITY FIX
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Fetch payments error:", error);
        }

        setPayments(data || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  /*UI*/

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>

      {/* EMPTY STATE */}
      {payments.length === 0 && (
        <div className="bg-white p-10 rounded-xl shadow text-center">
          <p className="text-gray-500">No payments found.</p>
        </div>
      )}

      {/* LIST */}
      {payments.length > 0 && (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white p-5 rounded-xl shadow border border-gray-200 hover:shadow-md transition"
            >
              <p className="font-semibold text-gray-900 text-lg">
                ${(payment.amount_cents / 100).toFixed(2)}{" "}
                {payment.currency.toUpperCase()}
              </p>

              <p className="text-sm text-gray-600 mt-1">
                Status:{" "}
                <span
                  className={`font-medium capitalize ${
                    payment.status === "succeeded"
                      ? "text-green-600"
                      : payment.status === "failed"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {payment.status}
                </span>
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {new Date(payment.created_at).toLocaleString()}
              </p>

              <p className="text-xs text-gray-400 mt-1 break-all">
                Appointment ID: {payment.appointment_id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
