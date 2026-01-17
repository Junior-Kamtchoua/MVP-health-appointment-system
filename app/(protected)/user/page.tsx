"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* ================= TYPES ================= */

type Doctor = {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
};

type Availability = {
  id: string;
  day_of_week: number; // 0 = Sunday ... 6 = Saturday
  start_time: string;
  end_time: string;
};

type CalendarDate = {
  date: Date;
  dayOfWeek: number;
};

type TimeSlot = {
  time: string;
  isBooked: boolean;
};

/* ================= UTILS ================= */

const getNextDatesForDay = (dayOfWeek: number, weeksAhead = 4): Date[] => {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 0; i < weeksAhead * 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    if (d.getDay() === dayOfWeek) {
      dates.push(d);
    }
  }

  return dates;
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const formatDateValue = (date: Date) => date.toISOString().split("T")[0];

/* ================= PAGE ================= */

export default function UserPage() {
  const router = useRouter();

  /* 🧍 Patient */
  const [patient, setPatient] = useState({
    fullName: "",
    email: "",
    phone: "",
    notes: "",
  });

  /* 👨‍⚕️ Doctors */
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  /* 📅 Availability */
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);

  /* 📅 Selected */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  /* ================= FETCH DOCTORS ================= */

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from("doctors")
        .select("id, full_name, email, specialty");

      setDoctors(data || []);
      setSelectedDoctor(data?.[0] || null);
    };

    fetchDoctors();
  }, []);

  /* ================= FETCH AVAILABILITIES ================= */

  useEffect(() => {
    if (!selectedDoctor) return;

    const fetchAvailabilities = async () => {
      const { data } = await supabase
        .from("doctor_availabilities")
        .select("id, day_of_week, start_time, end_time")
        .eq("doctor_id", selectedDoctor.id);

      setAvailabilities(data || []);

      const dates: CalendarDate[] = [];

      (data || []).forEach((a) => {
        getNextDatesForDay(a.day_of_week).forEach((d) => {
          dates.push({ date: d, dayOfWeek: a.day_of_week });
        });
      });

      const uniqueDates = Array.from(
        new Map(dates.map((d) => [formatDateValue(d.date), d])).values()
      ).sort((a, b) => a.date.getTime() - b.date.getTime());

      setCalendarDates(uniqueDates);
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableTimes([]);
    };

    fetchAvailabilities();
  }, [selectedDoctor]);

  /* ================= TIME GENERATOR ================= */

  const generateTimeSlots = (start: string, end: string) => {
    const slots: string[] = [];
    let [h, m] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    while (h < endH || (h === endH && m < endM)) {
      slots.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
      m += 30;
      if (m >= 60) {
        h++;
        m = 0;
      }
    }

    return slots;
  };

  /* ================= SELECT DATE ================= */

  const handleSelectDate = async (calDate: CalendarDate) => {
    if (!selectedDoctor) return;

    setSelectedDate(calDate.date);
    setSelectedTime(null);

    const slots = availabilities
      .filter((a) => a.day_of_week === calDate.dayOfWeek)
      .flatMap((a) => generateTimeSlots(a.start_time, a.end_time));

    const dateStr = formatDateValue(calDate.date);

    const { data: booked } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_email", selectedDoctor.email)
      .eq("appointment_date", dateStr)
      .in("status", ["pending", "paid"]);

    const bookedSlots = booked?.map((b) => b.appointment_time) || [];

    const timesWithStatus: TimeSlot[] = slots.map((time) => ({
      time,
      isBooked: bookedSlots.includes(time),
    }));

    setAvailableTimes(timesWithStatus);
  };

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ================= CREATE APPOINTMENT ================= */

  const createAppointment = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !selectedDoctor || !selectedDate || !selectedTime) {
      alert("Please complete all steps before confirming.");
      return;
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: user.id,
        doctor_email: selectedDoctor.email,
        appointment_date: formatDateValue(selectedDate),
        appointment_time: selectedTime,
        status: "pending",
        patient_name: patient.fullName,
        patient_email: patient.email,
        patient_phone: patient.phone,
        patient_notes: patient.notes,
      })
      .select()
      .single();

    if (error) {
      alert("This time slot is already booked.");
      return;
    }

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: appointment.id }),
    });

    const stripeData = await res.json();
    if (stripeData.url) window.location.href = stripeData.url;
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Book an Appointment</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doctors */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Select a Doctor</h2>
          {doctors.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoctor(doc)}
              className={`border rounded-lg p-3 cursor-pointer ${
                selectedDoctor?.id === doc.id
                  ? "bg-blue-50 border-blue-400"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="font-semibold text-sm">{doc.full_name}</p>
              <p className="text-xs text-gray-500">{doc.specialty}</p>
            </div>
          ))}
        </div>

        {/* Date & Time */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Choose Date & Time</h2>

          <div className="grid grid-cols-3 gap-2 text-sm">
            {calendarDates.map((d) => (
              <div
                key={formatDateValue(d.date)}
                onClick={() => handleSelectDate(d)}
                className={`p-2 border rounded cursor-pointer text-center ${
                  selectedDate &&
                  formatDateValue(selectedDate) === formatDateValue(d.date)
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {formatDateLabel(d.date)}
              </div>
            ))}
          </div>

          {selectedDate && (
            <>
              <p className="text-sm font-semibold mt-6 mb-2">Select Time</p>
              <div className="flex flex-wrap gap-2">
                {availableTimes.map(({ time, isBooked }) => (
                  <button
                    key={time}
                    disabled={isBooked}
                    onClick={() => !isBooked && setSelectedTime(time)}
                    className={`px-3 py-1 rounded-md text-sm border
                      ${
                        isBooked
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : selectedTime === time
                          ? "bg-blue-600 text-white border-blue-600"
                          : "hover:bg-gray-100"
                      }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Patient */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Patient Information</h2>

          <input
            placeholder="Full Name"
            className="w-full border rounded-md px-3 py-2 text-sm mb-3"
            value={patient.fullName}
            onChange={(e) =>
              setPatient({ ...patient, fullName: e.target.value })
            }
          />
          <input
            placeholder="Email"
            className="w-full border rounded-md px-3 py-2 text-sm mb-3"
            value={patient.email}
            onChange={(e) => setPatient({ ...patient, email: e.target.value })}
          />
          <input
            placeholder="Phone"
            className="w-full border rounded-md px-3 py-2 text-sm mb-3"
            value={patient.phone}
            onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
          />

          <textarea
            placeholder="Notes"
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm mb-4"
            value={patient.notes}
            onChange={(e) => setPatient({ ...patient, notes: e.target.value })}
          />

          <button
            onClick={createAppointment}
            disabled={!selectedDate || !selectedTime}
            className="w-full bg-blue-600 text-white py-2 rounded-md disabled:opacity-50"
          >
            Confirm Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
