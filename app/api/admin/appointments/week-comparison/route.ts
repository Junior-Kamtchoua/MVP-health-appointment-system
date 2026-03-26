import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/* ================= TYPES ================= */

type WeekComparisonRow = {
  dow: number;
  this_week: number;
  last_week: number;
};

type ChartRow = {
  day: string;
  thisWeek: number;
  lastWeek: number;
};

/* ================= CONST ================= */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/* ================= GET ================= */

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("appointments_week_comparison");

    if (error) {
      console.error("appointments_week_comparison error:", error);

      return NextResponse.json(
        { error: "Failed to fetch week comparison data" },
        { status: 500 },
      );
    }

    const rows = (data || []) as WeekComparisonRow[];

    const formatted: ChartRow[] = DAYS.map((day, index) => {
      const row = rows.find((r) => r.dow === index);

      return {
        day,
        thisWeek: row ? Number(row.this_week) : 0,
        lastWeek: row ? Number(row.last_week) : 0,
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("API /admin/appointments/week-comparison error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
