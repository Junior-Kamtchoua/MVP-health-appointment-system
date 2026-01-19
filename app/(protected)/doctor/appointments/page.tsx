"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patient_name: string | null;
};

/* ================= PAGE ================= */

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, patient_name")
        .eq("doctor_email", user.email)
        .order("appointment_date");

      setAppointments(data || []);
      setLoading(false);
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <p className="text-gray-700 sm:text-gray-500">Loading appointments...</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-700 sm:text-gray-500">
          All your scheduled appointments
        </p>
      </div>

      {appointments.length === 0 && (
        <p className="text-gray-700 sm:text-gray-500">No appointments found.</p>
      )}

      <div className="bg-white rounded-xl shadow divide-y">
        {appointments.map((a) => (
          <div
            key={a.id}
            className="flex justify-between items-center p-4 transition cursor-pointer hover:bg-gray-50"
          >
            <div>
              <p className="font-semibold text-gray-900">
                {a.patient_name || "Unknown patient"}
              </p>
              <p className="text-sm text-gray-700 sm:text-gray-500">
                {a.appointment_date} at {a.appointment_time}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                a.status === "completed"
                  ? "bg-gray-200 text-gray-800"
                  : a.status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : a.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
