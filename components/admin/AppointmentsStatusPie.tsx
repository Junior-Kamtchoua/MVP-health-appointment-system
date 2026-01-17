"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";

type PieData = {
  status: string;
  total: number;
};

const COLORS: Record<string, string> = {
  pending: "#FACC15",
  accepted: "#22C55E",
  rejected: "#EF4444",
  completed: "#9CA3AF",
};

export default function AppointmentsStatusPie() {
  const [data, setData] = useState<PieData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/admin/appointments/by-status");
      const json = await res.json();
      setData(json);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Appointments by Status
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="status"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[entry.status] || "#CBD5E1"} />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
