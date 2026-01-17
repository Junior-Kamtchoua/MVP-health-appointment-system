import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data, error } = await supabase
    .from("doctors")
    .select("id, full_name, email")
    .order("full_name");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
