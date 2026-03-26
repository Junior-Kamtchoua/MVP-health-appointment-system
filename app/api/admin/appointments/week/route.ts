import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/*CONST*/

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type AppointmentWeekRow = {
  dow: number;
  total: number;
};

/*GET*/

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    /* AUTH CHECK */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* RPC CALL */
    const { data, error } = await supabase.rpc("appointments_this_week");

    if (error || !data) {
      console.error("appointments_this_week error:", error);

      return NextResponse.json(
        { error: "Failed to fetch weekly appointments" },
        { status: 500 },
      );
    }

    const rows = data as AppointmentWeekRow[];

    /* NORMALIZE (always return 7 days) */
    const result = DAYS.map((day, index) => {
      const row = rows.find((d) => d.dow === index);

      return {
        day,
        count: row ? Number(row.total) : 0,
      };
    });

    /* SUCCESS */
    return NextResponse.json(result);
  } catch (err) {
    console.error("API /admin/appointments/week error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
