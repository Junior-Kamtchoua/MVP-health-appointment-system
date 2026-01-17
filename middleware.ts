import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /* ================= SESSION ================= */

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  // 🔐 Pas connecté → login
  if (
    !user &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/doctor") ||
      pathname.startsWith("/user"))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!user) return res;

  const email = user.email!;

  /* ================= ADMIN (PRIORITÉ MAX) ================= */

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (adminError) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (admin) {
    // admin ne peut accéder qu'à /admin
    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return res;
  }

  /* ================= DOCTOR ================= */

  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (doctorError) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // docteur qui tente /user → /doctor
  if (doctor && pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL("/doctor", req.url));
  }

  // patient qui tente /doctor → /user
  if (!doctor && pathname.startsWith("/doctor")) {
    return NextResponse.redirect(new URL("/user", req.url));
  }

  // patient qui tente /admin → /user
  if (!doctor && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/user", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/user/:path*"],
};
