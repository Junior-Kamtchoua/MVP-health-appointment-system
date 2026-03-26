import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/* ================= GET ================= */

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    /* 🔐 AUTH CHECK */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* 📊 FETCH DOCTORS */
    const { data, error } = await supabase
      .from("doctors")
      .select("id, full_name, email")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("DOCTORS FETCH ERROR:", error);

      return NextResponse.json(
        { error: "Failed to fetch doctors" },
        { status: 500 },
      );
    }

    /* ✅ SUCCESS */
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("API /admin/doctors error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
