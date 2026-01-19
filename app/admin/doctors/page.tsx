"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Doctor = {
  email: string;
  appointments_count: number;
  first_appointment: string;
};

/* ================= PAGE ================= */

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          doctor_email,
          created_at
        `
        )
        .order("created_at", { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      // 🔁 GROUP BY doctor_email
      const map = new Map<string, Doctor>();

      data.forEach((row) => {
        if (!row.doctor_email) return;

        if (!map.has(row.doctor_email)) {
          map.set(row.doctor_email, {
            email: row.doctor_email,
            appointments_count: 1,
            first_appointment: row.created_at,
          });
        } else {
          map.get(row.doctor_email)!.appointments_count += 1;
        }
      });

      setDoctors(Array.from(map.values()));
      setLoading(false);
    };

    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((d) =>
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Doctors</h1>
          <p className="text-sm text-gray-500">
            Doctors extracted from appointments
          </p>
        </div>

        <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
          Total: {doctors.length}
        </span>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Search doctor by email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-1/2"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-500 py-20">Loading doctors...</p>
        ) : (
          <table className="w-full min-w-175">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 text-left">Doctor</th>
                <th className="px-6 py-4 text-left">Appointments</th>
                <th className="px-6 py-4 text-left">First appointment</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y text-sm">
              {filteredDoctors.map((d) => (
                <tr key={d.email} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium">{d.email}</td>

                  <td className="px-6 py-4">{d.appointments_count}</td>

                  <td className="px-6 py-4 text-gray-500">
                    {new Date(d.first_appointment).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      active
                    </span>
                  </td>
                </tr>
              ))}

              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    No doctors found
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
