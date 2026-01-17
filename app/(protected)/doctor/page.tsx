"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

type Doctor = {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
};

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patient_name: string | null;
  patient_email: string | null;
  patient_phone: string | null;
  patient_notes: string | null;
};

type Availability = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

/* ================= PAGE ================= */

export default function DoctorPage() {
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ================= LOAD DOCTOR + DATA ================= */

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      /* Doctor */
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("id, full_name, email, specialty")
        .eq("email", user.email)
        .single();

      if (doctorError || !doctorData) {
        setLoading(false);
        return;
      }

      setDoctor(doctorData);

      /* Appointments */
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          patient_name,
          patient_email,
          patient_phone,
          patient_notes
        `
        )
        .eq("doctor_email", doctorData.email)
        .order("appointment_date");

      setAppointments(appointmentsData || []);

      /* Availabilities */
      const { data: availabilityData } = await supabase
        .from("doctor_availabilities")
        .select("id, day_of_week, start_time, end_time")
        .eq("doctor_id", doctorData.id)
        .order("day_of_week");

      setAvailabilities(availabilityData || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  /* ================= UPDATE STATUS ================= */

  const updateStatus = async (id: string, status: string) => {
    setMessage(null);

    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage("Failed to update status");
    } else {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      setMessage("Status updated");
    }
  };

  /* ================= ADD AVAILABILITY ================= */

  const addAvailability = async () => {
    if (!doctor) return;

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

    if (!error && data) {
      setAvailabilities((prev) => [...prev, data]);
    }
  };

  /* ================= SAFETY ================= */

  if (!loading && !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Doctor profile not found.
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <p className="font-semibold">{doctor?.full_name}</p>
          <p className="text-xs text-gray-500">
            {doctor?.specialty || "Doctor"}
          </p>
        </div>

        <div className="flex-1 px-6 py-4 text-sm text-blue-600 font-semibold">
          Dashboard
        </div>

        <div className="p-6 border-t">
          <button onClick={handleLogout} className="text-red-600 text-sm">
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 space-y-10">
        <h1 className="text-2xl font-bold">Appointments</h1>

        {/* Appointments */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          {appointments.length === 0 && (
            <p className="text-center text-gray-500">No appointments yet.</p>
          )}

          {appointments.map((a) => (
            <div key={a.id} className="border rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <p className="font-semibold">
                  {a.appointment_date} at {a.appointment_time}
                </p>
                <span className="text-xs">{a.status}</span>
              </div>

              <div className="text-sm text-gray-600">
                <p>Patient: {a.patient_name || "—"}</p>
                <p>Email: {a.patient_email || "—"}</p>
                <p>Phone: {a.patient_phone || "—"}</p>
                {a.patient_notes && <p>Notes: {a.patient_notes}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => updateStatus(a.id, "accepted")}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => updateStatus(a.id, "rejected")}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => updateStatus(a.id, "completed")}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                  Complete
                </button>
              </div>
            </div>
          ))}

          {message && (
            <p className="text-center text-sm text-gray-600">{message}</p>
          )}
        </div>

        {/* Availabilities */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">My Availability</h2>

          <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>

            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border rounded px-2 py-1"
            />

            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border rounded px-2 py-1"
            />

            <button
              onClick={addAvailability}
              className="bg-blue-600 text-white rounded px-3 py-1"
            >
              Add
            </button>
          </div>

          <ul className="text-sm text-gray-700 space-y-1">
            {availabilities.map((a) => (
              <li key={a.id}>
                Day {a.day_of_week} — {a.start_time} → {a.end_time}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
