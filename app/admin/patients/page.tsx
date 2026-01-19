"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Patient = {
  email: string;
  name: string | null;
  first_appointment: string;
  appointments_count: number;
};

/* ================= PAGE ================= */

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          patient_name,
          patient_email,
          created_at
        `
        )
        .order("created_at", { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      // 🔁 GROUP BY patient_email
      const map = new Map<string, Patient>();

      data.forEach((row) => {
        if (!row.patient_email) return;

        if (!map.has(row.patient_email)) {
          map.set(row.patient_email, {
            email: row.patient_email,
            name: row.patient_name,
            first_appointment: row.created_at,
            appointments_count: 1,
          });
        } else {
          map.get(row.patient_email)!.appointments_count += 1;
        }
      });

      setPatients(Array.from(map.values()));
      setLoading(false);
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-sm text-gray-500">
            Patients extracted from appointments
          </p>
        </div>

        <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
          Total: {patients.length}
        </span>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Search patient by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-1/2"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-500 py-20">Loading patients...</p>
        ) : (
          <table className="w-full min-w-200">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 text-left">Patient</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Appointments</th>
                <th className="px-6 py-4 text-left">First appointment</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y text-sm">
              {filteredPatients.map((p) => (
                <tr key={p.email} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium">{p.name || "—"}</td>

                  <td className="px-6 py-4 text-gray-700">{p.email}</td>

                  <td className="px-6 py-4">{p.appointments_count}</td>

                  <td className="px-6 py-4 text-gray-500">
                    {new Date(p.first_appointment).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      active
                    </span>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    No patients found
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
