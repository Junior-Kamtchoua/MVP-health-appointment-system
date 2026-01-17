import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.rpc("appointments_by_status");

  if (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data);
}
