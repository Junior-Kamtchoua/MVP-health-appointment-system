"use client";

import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= NAV COMPONENT ================= */

type AdminNavProps = {
  router: ReturnType<typeof useRouter>;
  pathname: string;
  onNavigate?: () => void;
};

function AdminNav({ router, pathname, onNavigate }: AdminNavProps) {
  const navItemClass = (path: string) => {
    const isActive = pathname === path;
    return `
      flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition
      ${
        isActive
          ? "bg-blue-100 text-blue-700 font-semibold"
          : "text-gray-600 hover:bg-gray-100"
      }
    `;
  };

  const go = (path: string) => {
    router.push(path);
    onNavigate?.();
  };

  return (
    <nav className="space-y-1 text-sm">
      <div onClick={() => go("/admin")} className={navItemClass("/admin")}>
        📊 Dashboard
      </div>
      <div
        onClick={() => go("/admin/appointments")}
        className={navItemClass("/admin/appointments")}
      >
        📅 Appointments
      </div>
      <div
        onClick={() => go("/admin/doctors")}
        className={navItemClass("/admin/doctors")}
      >
        🩺 Doctors
      </div>
      <div
        onClick={() => go("/admin/patients")}
        className={navItemClass("/admin/patients")}
      >
        👤 Patients
      </div>
      <div
        onClick={() => go("/admin/payments")}
        className={navItemClass("/admin/payments")}
      >
        💳 Payments
      </div>
    </nav>
  );
}

/* ================= LAYOUT ================= */

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* ================= TOP BAR (MOBILE) ================= */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b px-4 py-3">
        <h2 className="font-bold">Clinic Admin</h2>
        <button onClick={() => setOpen(true)} className="text-2xl">
          ☰
        </button>
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-64 h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold">Clinic Admin</h2>
              <button onClick={() => setOpen(false)} className="text-xl">
                ✕
              </button>
            </div>

            <AdminNav
              router={router}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />

            <button
              onClick={handleLogout}
              className="text-red-600 text-sm mt-6"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* ================= SIDEBAR DESKTOP ================= */}
        <aside className="hidden lg:flex w-64 bg-white border-r flex-col">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Clinic Admin</h2>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>

          <div className="p-6 flex items-center gap-3 border-b">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-semibold">Administrator</p>
              <p className="text-xs text-gray-500">admin</p>
            </div>
          </div>

          <div className="flex-1 p-4">
            <AdminNav router={router} pathname={pathname} />
          </div>

          <div className="p-6 border-t">
            <button onClick={handleLogout} className="text-red-600 text-sm">
              Logout
            </button>
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
