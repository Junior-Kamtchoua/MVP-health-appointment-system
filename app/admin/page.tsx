"use client";

import { useEffect, useState } from "react";

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
      return `${base} bg-gray-100 text-gray-700`;
  }
};

/* ================= PAGE ================= */

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");

  /* ================= FETCH ================= */

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
    setToday(new Date().toLocaleDateString());
  }, []);

  const filteredAppointments =
    statusFilter === "all"
      ? recentAppointments
      : recentAppointments.filter((a) => a.status === statusFilter);

  /* ================= UI ================= */

  return (
    <div className="space-y-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-700 mt-1">
            Welcome back,{" "}
            <span className="font-medium text-blue-600">Admin</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
            Administrator
          </span>
          <span className="text-sm text-gray-600">{today}</span>
        </div>
      </div>

      {loading && (
        <p className="text-gray-600 text-center py-20">Loading dashboard…</p>
      )}

      {!loading && stats && (
        <>
          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="Total Patients"
              value={stats.totalPatients}
              icon="👤"
            />
            <StatCard
              label="Total Doctors"
              value={stats.totalDoctors}
              icon="🩺"
            />
            <StatCard
              label="Appointments Today"
              value={stats.appointmentsToday}
              icon="📅"
            />
          </div>

          {/* FILTER */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-medium text-gray-800">
              Filter by status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white text-gray-800"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left">Patient</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Doctor</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Time</th>
                    <th className="px-6 py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredAppointments.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {a.patient_name || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {a.patient_email || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        {a.doctor_email}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {a.appointment_date}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {a.appointment_time}
                      </td>
                      <td className="px-6 py-4">
                        <span className={statusBadge(a.status)}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-10 text-gray-600"
                      >
                        No appointments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow p-4">
              <AppointmentsChart />
            </div>
            <div className="bg-white rounded-2xl shadow p-4">
              <AppointmentsStatusPie />
            </div>
          </div>

          {/* DOCTORS */}
          <div className="bg-white rounded-2xl shadow border p-6">
            <h3 className="text-sm font-semibold mb-4 text-gray-800">
              Doctors Overview
            </h3>
            <div className="space-y-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.full_name}
                    </p>
                    <p className="text-xs text-gray-600">{doc.email}</p>
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
    </div>
  );
}

/* ================= COMPONENT ================= */

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
    <div className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-lg">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
