"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Doctor = {
  id: string;
  full_name: string;
  email: string;
};

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string | null;
  patient_name: string | null;
};

/* ================= PAGE ================= */

export default function DoctorPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<
    "today" | "pending" | "completed" | "all"
  >("today");

  const [todayCount, setTodayCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  /* ================= HELPERS ================= */

  const today = new Date().toISOString().split("T")[0];

  const recalcStats = (list: Appointment[]) => {
    setTodayCount(list.filter((a) => a.appointment_date === today).length);
    setCompletedCount(list.filter((a) => a.status === "completed").length);
    setPendingCount(
      list.filter((a) => a.status !== "completed" && a.status !== "rejected")
        .length
    );
  };

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
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, patient_name")
        .eq("doctor_email", doctorData.email)
        .order("appointment_date");

      const list = data || [];
      setAppointments(list);
      recalcStats(list);

      setLoading(false);
    };

    fetchData();
  }, []);

  /* ================= COMPLETE ACTION ================= */

  const markAsCompleted = async (id: string) => {
    const ok = window.confirm(
      "Are you sure you want to mark this appointment as completed?"
    );
    if (!ok) return;

    const { error } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      alert("Failed to update appointment");
      return;
    }

    const updated = appointments.map((a) =>
      a.id === id ? { ...a, status: "completed" } : a
    );

    setAppointments(updated);
    recalcStats(updated);
  };

  /* ================= FILTER ================= */

  const filteredAppointments = appointments.filter((a) => {
    if (filter === "today") return a.appointment_date === today;
    if (filter === "pending")
      return a.status === "pending" || a.status === "paid";
    if (filter === "completed") return a.status === "completed";
    return true;
  });

  /* ================= UI ================= */

  if (loading) {
    return <p className="text-gray-500">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {doctor?.full_name}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Today Appointments" value={todayCount} icon="📅" />
        <StatCard label="Pending" value={pendingCount} icon="⏳" />
        <StatCard label="Completed" value={completedCount} icon="✅" />
      </div>

      {/* FILTERS */}
      <div className="flex gap-2">
        <FilterButton
          active={filter === "today"}
          onClick={() => setFilter("today")}
        >
          Today
        </FilterButton>
        <FilterButton
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        >
          Pending
        </FilterButton>
        <FilterButton
          active={filter === "completed"}
          onClick={() => setFilter("completed")}
        >
          Completed
        </FilterButton>
      </div>

      {/* TIMELINE */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Agenda</h2>

        {filteredAppointments.length === 0 && (
          <p className="text-gray-500 text-sm">No appointments found.</p>
        )}

        {filteredAppointments
          .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
          .map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-6 border rounded-xl px-5 py-4 bg-gray-50"
            >
              {/* TIME */}
              <div className="w-20 text-center font-semibold text-blue-600">
                {a.appointment_time}
              </div>

              {/* DETAILS */}
              <div className="flex-1">
                <p className="font-medium">
                  {a.patient_name || "Unknown patient"}
                </p>
                <p className="text-xs text-gray-500">{a.appointment_date}</p>
              </div>

              {/* STATUS + ACTION */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium
                    ${
                      a.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : a.status === "accepted"
                        ? "bg-blue-100 text-blue-700"
                        : a.status === "paid"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  `}
                >
                  {a.status ?? "pending"}
                </span>

                {a.status !== "completed" && (
                  <button
                    onClick={() => markAsCompleted(a.id)}
                    className="px-3 py-1 text-xs rounded-full bg-green-600 text-white hover:bg-green-700 transition"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition
        ${
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-600 hover:bg-gray-100"
        }`}
    >
      {children}
    </button>
  );
}
