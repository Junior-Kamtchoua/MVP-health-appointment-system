"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Doctor = {
  id: string;
  full_name: string;
  email: string;
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DOCTOR ================= */

  useEffect(() => {
    const loadDoctor = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("doctors")
        .select("id, full_name, email")
        .eq("email", user.email)
        .single();

      if (!data) {
        router.push("/login");
        return;
      }

      setDoctor(data);
      setLoading(false);
    };

    loadDoctor();
  }, [router]);

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded transition ${
      pathname === path
        ? "bg-blue-100 text-blue-700 font-semibold"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col">
        {/* Doctor info */}
        <div className="p-6 border-b">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
            {doctor?.full_name?.charAt(0)}
          </div>
          <p className="mt-3 font-semibold">{doctor?.full_name}</p>
          <p className="text-xs text-gray-500">Doctor</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 text-sm">
          <Link href="/doctor" className={linkClass("/doctor")}>
            Dashboard
          </Link>

          <Link
            href="/doctor/appointments"
            className={linkClass("/doctor/appointments")}
          >
            Appointments
          </Link>

          <Link
            href="/doctor/availability"
            className={linkClass("/doctor/availability")}
          >
            Availability
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-6 border-t">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-red-600 text-sm hover:underline"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
