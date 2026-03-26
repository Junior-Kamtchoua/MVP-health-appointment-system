"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor_email: string;
};

export default function UserAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  /*FETCH*/

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("appointments")
          .select(
            "id, appointment_date, appointment_time, status, doctor_email",
          )
          .eq("patient_id", user.id) // ✅ SECURITY FIX
          .order("appointment_date", { ascending: true });

        if (error) {
          console.error("Fetch error:", error);
        }

        setAppointments(data || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  /*UI*/

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>

      {/* EMPTY STATE */}
      {appointments.length === 0 && (
        <div className="bg-white p-10 rounded-xl shadow text-center">
          <p className="text-gray-500">You have no appointments yet.</p>
        </div>
      )}

      {/* LIST */}
      {appointments.length > 0 && (
        <ul className="space-y-4">
          {appointments.map((appt) => (
            <li
              key={appt.id}
              className="bg-white p-5 rounded-xl shadow border border-gray-200 hover:shadow-md transition"
            >
              <p className="font-semibold text-gray-900">
                {appt.appointment_date} at {appt.appointment_time}
              </p>

              <p className="text-sm text-gray-600">
                Doctor: {appt.doctor_email}
              </p>

              <span
                className={`inline-block mt-3 px-3 py-1 text-xs rounded-full font-semibold capitalize ${
                  appt.status === "accepted"
                    ? "bg-green-100 text-green-800"
                    : appt.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : appt.status === "completed"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {appt.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
