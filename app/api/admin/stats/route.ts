import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  // Total doctors
  const { count: totalDoctors } = await supabase
    .from("doctors")
    .select("*", { count: "exact", head: true });

  // Total patients (distinct)
  const { data: patients } = await supabase
    .from("appointments")
    .select("patient_email");

  const totalPatients = new Set((patients || []).map((p) => p.patient_email))
    .size;

  // Appointments today
  const today = new Date().toISOString().split("T")[0];

  const { count: appointmentsToday } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("appointment_date", today);

  return NextResponse.json({
    totalDoctors: totalDoctors || 0,
    totalPatients,
    appointmentsToday: appointmentsToday || 0,
  });
}
