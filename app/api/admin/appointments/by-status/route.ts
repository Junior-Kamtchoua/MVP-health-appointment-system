import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/* ================= GET ================= */

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    /* 🔐 (OPTIONNEL MAIS RECOMMANDÉ)
       Vérifier que l'utilisateur est admin */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* 📊 RPC CALL */
    const { data, error } = await supabase.rpc("appointments_by_status");

    if (error) {
      console.error("RPC appointments_by_status error:", error);

      return NextResponse.json(
        { error: "Failed to fetch appointments by status" },
        { status: 500 },
      );
    }

    /* ✅ SUCCESS */
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("API /admin/appointments/by-status error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
