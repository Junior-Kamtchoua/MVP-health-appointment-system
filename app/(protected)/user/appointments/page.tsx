"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, doctor_email")
        .order("appointment_date", { ascending: true });

      if (!error && data) {
        setAppointments(data);
      }

      setLoading(false);
    };

    fetchAppointments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">My Appointments</h1>

      {loading && <p className="text-gray-700">Loading...</p>}

      {!loading && appointments.length === 0 && (
        <p className="text-gray-700">You have no appointments yet.</p>
      )}

      <ul className="space-y-4">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="bg-white p-4 rounded-xl shadow border border-gray-200"
          >
            <p className="font-semibold text-gray-900">
              {appt.appointment_date} at {appt.appointment_time}
            </p>

            <p className="text-sm text-gray-700">Doctor: {appt.doctor_email}</p>

            <span
              className={`inline-block mt-2 px-3 py-1 text-xs rounded-full font-semibold ${
                appt.status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : appt.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : appt.status === "completed"
                  ? "bg-gray-300 text-gray-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {appt.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
