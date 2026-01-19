"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Appointment = {
  id: string;
  patient_name: string | null;
  patient_email: string | null;
  doctor_email: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
};

/* ================= UTILS ================= */

const statusBadge = (status: string) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-semibold";

  switch (status) {
    case "pending":
      return `${base} bg-yellow-100 text-yellow-800`;
    case "accepted":
      return `${base} bg-green-100 text-green-700`;
    case "rejected":
      return `${base} bg-red-100 text-red-700`;
    case "completed":
      return `${base} bg-gray-200 text-gray-700`;
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
};

/* ================= PAGE ================= */

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data } = await supabase
        .from("appointments")
        .select(
          `
          id,
          patient_name,
          patient_email,
          doctor_email,
          appointment_date,
          appointment_time,
          status
        `
        )
        .order("appointment_date", { ascending: false });

      setAppointments(data || []);
      setLoading(false);
    };

    fetchAppointments();
  }, []);

  const filtered = appointments.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;

    const matchesSearch =
      a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor_email.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-gray-500">
            Manage and monitor all clinic appointments
          </p>
        </div>

        <span className="text-sm px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold">
          Total: {appointments.length}
        </span>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search patient or doctor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-1/2"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-1/4"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-500 py-20">
            Loading appointments...
          </p>
        ) : (
          <table className="w-full min-w-225">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 text-left">Patient</th>
                <th className="px-6 py-4 text-left">Doctor</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Time</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y text-sm">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium">{a.patient_name || "—"}</p>
                    <p className="text-xs text-gray-500">
                      {a.patient_email || ""}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-gray-700">{a.doctor_email}</td>

                  <td className="px-6 py-4">{a.appointment_date}</td>
                  <td className="px-6 py-4">{a.appointment_time}</td>

                  <td className="px-6 py-4">
                    <span className={statusBadge(a.status)}>{a.status}</span>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
