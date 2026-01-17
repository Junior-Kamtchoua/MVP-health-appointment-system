import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type WeekComparisonRow = {
  dow: number; // 0 = Sun ... 6 = Sat
  this_week: number;
  last_week: number;
};

type ChartRow = {
  day: string;
  thisWeek: number;
  lastWeek: number;
};

/* ================= CONST ================= */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ================= ROUTE ================= */

export async function GET() {
  const { data, error } = await supabase.rpc("appointments_week_comparison");

  if (error || !data) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  // ✅ CAST PROPRE (Supabase v2 compatible)
  const rows = data as WeekComparisonRow[];

  const formatted: ChartRow[] = DAYS.map((day, index) => {
    const row = rows.find((r: WeekComparisonRow) => r.dow === index);

    return {
      day,
      thisWeek: row?.this_week ?? 0,
      lastWeek: row?.last_week ?? 0,
    };
  });

  return NextResponse.json(formatted);
}
