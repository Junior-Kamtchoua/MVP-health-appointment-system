import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type AppointmentWeekRow = {
  dow: number;
  total: number;
};

export async function GET() {
  const { data, error } = await supabase.rpc("appointments_this_week");

  if (error || !data) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  const rows = data as AppointmentWeekRow[];

  const result = DAYS.map((day, index) => {
    const row = rows.find((d) => d.dow === index);

    return {
      day,
      count: row ? Number(row.total) : 0,
    };
  });

  return NextResponse.json(result);
}
