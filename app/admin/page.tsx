"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import AppointmentsChart from "@/components/admin/AppointmentsChart";
import AppointmentsStatusPie from "@/components/admin/AppointmentsStatusPie";

/* ================= TYPES ================= */

type Stats = {
  totalDoctors: number;
  totalPatients: number;
  appointmentsToday: number;
};

type RecentAppointment = {
  patient_name: string | null;
  patient_email: string | null;
  doctor_email: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
};

type Doctor = {
  id: string;
  full_name: string;
  email: string;
};

/* ================= UTILS ================= */

const statusBadge = (status: string) => {
  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

  switch (status) {
    case "pending":
      return `${base} bg-yellow-100 text-yellow-800`;
    case "accepted":
      return `${base} bg-green-100 text-green-800`;
    case "rejected":
      return `${base} bg-red-100 text-red-800`;
    case "completed":
      return `${base} bg-gray-200 text-gray-700`;
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
};

/* ================= PAGE ================= */

export default function AdminPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, apptsRes, doctorsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/appointments/recent"),
          fetch("/api/admin/doctors"),
        ]);

        setStats(await statsRes.json());
        setRecentAppointments(await apptsRes.json());
        setDoctors(await doctorsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredAppointments =
    statusFilter === "all"
      ? recentAppointments
      : recentAppointments.filter((a) => a.status === statusFilter);

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* ================= SIDEBAR ================= */}
      {/* ❗ Cachée sur mobile */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Clinic Admin</h2>
          <p className="text-xs text-gray-500">Dashboard</p>
        </div>

        <div className="p-6 flex items-center gap-3 border-b">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-semibold">Administrator</p>
            <p className="text-xs text-gray-500">admin</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3 text-sm">
          <p className="font-semibold text-blue-600">Dashboard</p>
          <p className="text-gray-600">Appointments</p>
          <p className="text-gray-600">Doctors</p>
          <p className="text-gray-600">Patients</p>
        </nav>

        <div className="p-6 border-t">
          <button onClick={handleLogout} className="text-red-600 text-sm">
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      {/* ❗ Padding responsive */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Welcome back, <span className="text-blue-600">Admin</span> 👋
          </h1>
          <p className="text-sm text-gray-500">
            Here’s the latest overview of your clinic.
          </p>
        </div>

        {loading && (
          <p className="text-gray-500 text-center mt-20">Loading dashboard…</p>
        )}

        {!loading && stats && (
          <>
            {/* ================= STATS CARDS ================= */}
            {/* ❗ Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <div className="rounded-2xl p-6 text-white bg-linear-to-r from-blue-400 to-blue-600">
                <p className="text-sm opacity-90">Total Patients</p>
                <p className="text-3xl font-bold">{stats.totalPatients}</p>
              </div>

              <div className="rounded-2xl p-6 text-white bg-linear-to-r from-emerald-400 to-emerald-600">
                <p className="text-sm opacity-90">Total Doctors</p>
                <p className="text-3xl font-bold">{stats.totalDoctors}</p>
              </div>

              <div className="rounded-2xl p-6 text-white bg-linear-to-r from-purple-400 to-purple-600">
                <p className="text-sm opacity-90">Appointments Today</p>
                <p className="text-3xl font-bold">{stats.appointmentsToday}</p>
              </div>
            </div>

            {/* ================= FILTER ================= */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <label className="text-sm font-medium">Filter by status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* ================= TABLE ================= */}
            {/* ❗ Scroll horizontal sur mobile */}
            <div className="bg-white rounded-2xl shadow border mb-10 overflow-x-auto">
              <table className="min-w-225 w-full">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Patient</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Doctor</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Time</th>
                    <th className="px-6 py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAppointments.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">
                        {a.patient_name || "—"}
                      </td>
                      <td className="px-6 py-4">{a.patient_email || "—"}</td>
                      <td className="px-6 py-4">{a.doctor_email}</td>
                      <td className="px-6 py-4">{a.appointment_date}</td>
                      <td className="px-6 py-4">{a.appointment_time}</td>
                      <td className="px-6 py-4">
                        <span className={statusBadge(a.status)}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= CHARTS ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <AppointmentsChart />
              <AppointmentsStatusPie />
            </div>

            {/* ================= DOCTORS ================= */}
            <div className="bg-white rounded-2xl shadow border p-6">
              <h3 className="text-sm font-semibold mb-4">Doctors Overview</h3>

              <div className="space-y-4">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{doc.full_name}</p>
                      <p className="text-xs text-gray-500">{doc.email}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
