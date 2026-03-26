import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/*GET*/

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

    const today = new Date().toISOString().split("T")[0];

    const [doctorsRes, patientsRes, todayRes] = await Promise.all([
      supabase.from("doctors").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("patient_email"),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("appointment_date", today),
    ]);

    if (doctorsRes.error) {
      console.error("Doctors stats error:", doctorsRes.error);
      return NextResponse.json(
        { error: "Failed to fetch doctors count" },
        { status: 500 },
      );
    }

    if (patientsRes.error) {
      console.error("Patients stats error:", patientsRes.error);
      return NextResponse.json(
        { error: "Failed to fetch patients count" },
        { status: 500 },
      );
    }

    if (todayRes.error) {
      console.error("Appointments today stats error:", todayRes.error);
      return NextResponse.json(
        { error: "Failed to fetch appointments today count" },
        { status: 500 },
      );
    }

    const totalDoctors = doctorsRes.count ?? 0;

    const totalPatients = new Set(
      (patientsRes.data || []).map((p) => p.patient_email).filter(Boolean),
    ).size;

    const appointmentsToday = todayRes.count ?? 0;

    return NextResponse.json({
      totalDoctors,
      totalPatients,
      appointmentsToday,
    });
  } catch (error) {
    console.error("API /admin/stats error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
