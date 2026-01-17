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
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>

      {loading && <p>Loading...</p>}

      {!loading && appointments.length === 0 && (
        <p className="text-gray-500">You have no appointments yet.</p>
      )}

      <ul className="space-y-4">
        {appointments.map((appt) => (
          <li key={appt.id} className="bg-white p-4 rounded-xl shadow">
            <p className="font-semibold">
              {appt.appointment_date} at {appt.appointment_time}
            </p>

            <p className="text-sm text-gray-600">Doctor: {appt.doctor_email}</p>

            <span
              className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                appt.status === "accepted"
                  ? "bg-green-100 text-green-700"
                  : appt.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : appt.status === "completed"
                  ? "bg-gray-200 text-gray-700"
                  : "bg-yellow-100 text-yellow-700"
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
