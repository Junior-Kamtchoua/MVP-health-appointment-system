"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Doctor = {
  id: string;
  full_name: string;
  email: string;
};

type Availability = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

/* ================= HELPERS ================= */

const dayLabel = (day: number) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day];
};

const weekDays = [1, 2, 3, 4, 5, 6, 0]; // Monday → Sunday

const isMorning = (time: string) => {
  const hour = parseInt(time.split(":")[0], 10);
  return hour < 12;
};

/* ================= PAGE ================= */

export default function DoctorAvailabilityPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data: doctorData } = await supabase
        .from("doctors")
        .select("id, full_name, email")
        .eq("email", user.email)
        .single();

      if (!doctorData) {
        setLoading(false);
        return;
      }

      setDoctor(doctorData);

      const { data } = await supabase
        .from("doctor_availabilities")
        .select("id, day_of_week, start_time, end_time")
        .eq("doctor_id", doctorData.id)
        .order("day_of_week");

      setAvailabilities(data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  /* ================= ADD ================= */

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

  /* ================= DELETE ================= */

  const deleteAvailability = async (id: string) => {
    const { error } = await supabase
      .from("doctor_availabilities")
      .delete()
      .eq("id", id);

    if (!error) {
      setAvailabilities((prev) => prev.filter((a) => a.id !== id));
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <p className="text-gray-500">Loading availability...</p>;
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">My Availability</h1>
        <p className="text-sm text-gray-500">
          Set your consultation hours for patients
        </p>
      </div>

      {/* ADD FORM */}
      <div className="bg-white p-6 rounded-2xl shadow border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          ➕ Add Availability
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 hover:border-blue-500"
          >
            <option value={1}>Monday</option>
            <option value={2}>Tuesday</option>
            <option value={3}>Wednesday</option>
            <option value={4}>Thursday</option>
            <option value={5}>Friday</option>
            <option value={6}>Saturday</option>
            <option value={0}>Sunday</option>
          </select>

          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border rounded-lg px-3 py-2 hover:border-blue-500"
          />

          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border rounded-lg px-3 py-2 hover:border-blue-500"
          />

          <button
            onClick={addAvailability}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* EXISTING LIST */}
      <div className="bg-white p-6 rounded-2xl shadow border">
        <h2 className="text-lg font-semibold mb-4">Existing Availability</h2>

        {availabilities.length === 0 && (
          <p className="text-sm text-gray-500">No availability defined yet.</p>
        )}

        <ul className="space-y-3 text-sm">
          {availabilities.map((a) => (
            <li
              key={a.id}
              className="flex justify-between items-center bg-gray-50 border rounded-xl px-4 py-3 hover:bg-gray-100"
            >
              <span className="font-medium">
                {dayLabel(a.day_of_week)} — {a.start_time} → {a.end_time}
              </span>

              <button
                onClick={() => deleteAvailability(a.id)}
                className="text-red-500 text-xs font-semibold hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* WEEKLY CALENDAR */}
      <div className="bg-white p-6 rounded-2xl shadow border">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          📅 Weekly Availability
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const daySlots = availabilities.filter(
              (a) => a.day_of_week === day
            );

            const morningSlots = daySlots.filter((s) =>
              isMorning(s.start_time)
            );

            const afternoonSlots = daySlots.filter(
              (s) => !isMorning(s.start_time)
            );

            return (
              <div key={day} className="bg-gray-50 rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-center">
                  {dayLabel(day)}
                </p>

                {/* MORNING */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    ☀️ Morning
                  </p>

                  {morningSlots.length === 0 && (
                    <p className="text-xs text-gray-400">No slots</p>
                  )}

                  <div className="space-y-1">
                    {morningSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="bg-blue-600/10 text-blue-700 text-xs font-medium rounded-lg px-2 py-1 text-center"
                      >
                        {slot.start_time} → {slot.end_time}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AFTERNOON */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    🌙 Afternoon
                  </p>

                  {afternoonSlots.length === 0 && (
                    <p className="text-xs text-gray-400">No slots</p>
                  )}

                  <div className="space-y-1">
                    {afternoonSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="bg-purple-600/10 text-purple-700 text-xs font-medium rounded-lg px-2 py-1 text-center"
                      >
                        {slot.start_time} → {slot.end_time}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
