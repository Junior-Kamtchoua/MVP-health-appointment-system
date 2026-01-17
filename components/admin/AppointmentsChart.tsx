"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";

type ChartData = {
  day: string;
  thisWeek: number;
  lastWeek: number;
};

export default function AppointmentsChart() {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/admin/appointments/week-comparison");
      const json = await res.json();
      setData(json);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Appointments This Week
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6} barSize={20}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E5E7EB"
            />
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />

            <Bar
              dataKey="thisWeek"
              name="This Week"
              fill="#3B82F6"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="lastWeek"
              name="Last Week"
              fill="#CBD5E1"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
