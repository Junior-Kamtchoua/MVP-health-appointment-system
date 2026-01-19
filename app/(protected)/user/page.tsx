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
  day_of_week: number;
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
    if (d.getDay() === dayOfWeek) dates.push(d);
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

  /* 🔍 UI search (DESIGN ONLY) */
  const [doctorSearch, setDoctorSearch] = useState("");

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

  /* ================= FILTER DOCTORS (UI ONLY) ================= */

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.full_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (doc.specialty ?? "").toLowerCase().includes(doctorSearch.toLowerCase())
  );

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

  /* ================= LOAD + REFRESH SLOTS ================= */

  const loadBookedSlots = async (date: Date) => {
    if (!selectedDoctor) return;

    const dateStr = formatDateValue(date);

    const { data: booked } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_email", selectedDoctor.email)
      .eq("appointment_date", dateStr)
      .in("status", ["pending", "paid"]);

    const bookedSlots =
      booked?.map((b) => b.appointment_time.slice(0, 5)) || [];

    setAvailableTimes((prev) =>
      prev.map((slot) => ({
        ...slot,
        isBooked: bookedSlots.includes(slot.time),
      }))
    );

    setSelectedTime(null);
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

    const bookedSlots =
      booked?.map((b) => b.appointment_time.slice(0, 5)) || [];

    setAvailableTimes(
      slots.map((time) => ({
        time,
        isBooked: bookedSlots.includes(time),
      }))
    );

    setSelectedTime(null);
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

    await loadBookedSlots(selectedDate);

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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Book an Appointment</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center gap-3 text-sm text-gray-600">
        <span className="font-semibold text-blue-600">1. Doctor</span>
        <span>→</span>
        <span className={selectedDate ? "font-semibold text-blue-600" : ""}>
          2. Date & Time
        </span>
        <span>→</span>
        <span className={selectedTime ? "font-semibold text-blue-600" : ""}>
          3. Confirm
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doctors */}
        <div className="bg-white p-6 rounded-xl shadow ring-2 ring-blue-100">
          <h2 className="font-semibold mb-4">Select a Doctor</h2>

          {/* Search */}
          <input
            type="text"
            placeholder="Search doctor..."
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
            className="w-full mb-4 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-300"
          />

          <div className="space-y-3">
            {filteredDoctors.map((doc) => {
              const isSelected = selectedDoctor?.id === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-50 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    👨‍⚕️
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-sm">{doc.full_name}</p>
                    <p className="text-xs text-gray-500">{doc.specialty}</p>
                  </div>

                  {isSelected && (
                    <span className="text-blue-600 font-bold">✔</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Date & Time */}
        <div
          className={`bg-white p-6 rounded-xl shadow transition ${
            selectedDoctor
              ? "ring-2 ring-blue-100"
              : "opacity-50 pointer-events-none"
          }`}
        >
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            📅 Choose Date
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Select an available date for your appointment
          </p>

          {/* Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {calendarDates.map((d) => {
              const isSelected =
                selectedDate &&
                formatDateValue(selectedDate) === formatDateValue(d.date);

              return (
                <button
                  key={formatDateValue(d.date)}
                  onClick={() => handleSelectDate(d)}
                  className={`px-3 py-2 rounded-lg border text-center transition font-medium
            ${
              isSelected
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white hover:bg-blue-50 border-gray-300"
            }`}
                >
                  {formatDateLabel(d.date)}
                </button>
              );
            })}
          </div>

          {/* Time */}
          {selectedDate && (
            <>
              <h2 className="font-semibold mt-8 mb-1 flex items-center gap-2">
                ⏰ Select Time
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Gray slots are already booked
              </p>

              <div className="flex flex-wrap gap-3">
                {availableTimes.map(({ time, isBooked }) => (
                  <button
                    key={time}
                    disabled={isBooked}
                    onClick={() => !isBooked && setSelectedTime(time)}
                    className={`min-w-20 px-4 py-2 rounded-lg text-sm font-semibold border transition
              ${
                isBooked
                  ? "bg-gray-200 text-gray-400 line-through cursor-not-allowed"
                  : selectedTime === time
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white hover:bg-blue-50 border-gray-300"
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
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            value={patient.fullName}
            onChange={(e) =>
              setPatient({ ...patient, fullName: e.target.value })
            }
          />
          <input
            placeholder="Email"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            value={patient.email}
            onChange={(e) => setPatient({ ...patient, email: e.target.value })}
          />
          <input
            placeholder="Phone"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            value={patient.phone}
            onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
          />
          <textarea
            placeholder="Notes"
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            value={patient.notes}
            onChange={(e) => setPatient({ ...patient, notes: e.target.value })}
          />

          <button
            onClick={createAppointment}
            disabled={!selectedDate || !selectedTime}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-40 transition"
          >
            Confirm Appointment
          </button>
        </div>
      </div>

      {/* 🔹 Trust / Features section */}
      <div className="mt-10 bg-white rounded-xl shadow-sm border px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {/* Secure */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              🔒
            </div>
            <span className="font-medium text-gray-700">
              Secure & Confidential
            </span>
          </div>

          {/* Quick */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              ⚡
            </div>
            <span className="font-medium text-gray-700">Quick & Easy</span>
          </div>

          {/* Reschedule */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              📅
            </div>
            <span className="font-medium text-gray-700">
              Reschedule Anytime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
