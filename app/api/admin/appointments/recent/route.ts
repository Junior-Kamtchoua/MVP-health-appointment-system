import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

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

    /* FETCH RECENT APPOINTMENTS */
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        patient_name,
        patient_email,
        doctor_email,
        appointment_date,
        appointment_time,
        status,
        created_at
      `,
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("RECENT APPOINTMENTS ERROR:", error);

      return NextResponse.json(
        { error: "Failed to fetch recent appointments" },
        { status: 500 },
      );
    }

    /* SUCCESS */
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("API /admin/appointments/recent error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
