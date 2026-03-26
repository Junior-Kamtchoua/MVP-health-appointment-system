"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* ================= TYPES ================= */

type ThemeMode = "dark" | "soft-dark";

type AdminNavProps = {
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

/* ================= CONSTANTS ================= */

const THEME_KEY = "admin-layout-theme-v1";
const SIDEBAR_KEY = "admin-layout-sidebar-collapsed-v1";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "◫", exact: true },
  { href: "/admin/appointments", label: "Appointments", icon: "◷" },
  { href: "/admin/doctors", label: "Doctors", icon: "✚" },
  { href: "/admin/patients", label: "Patients", icon: "◎" },
  { href: "/admin/payments", label: "Payments", icon: "◈" },
];

/* ================= HELPERS ================= */

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const isActivePath = (pathname: string, item: NavItem) => {
  if (item.exact) return pathname === item.href;
  return pathname.startsWith(item.href);
};

/* ================= NAV COMPONENT ================= */

function AdminNav({ pathname, onNavigate, collapsed = false }: AdminNavProps) {
  return (
    <nav className="space-y-2 text-sm">
      {navItems.map((item) => {
        const active = isActivePath(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
              active
                ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100 shadow-[0_10px_24px_rgba(34,211,238,0.08)]"
                : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-sm">
              {item.icon}
            </span>

            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/* ================= LAYOUT ================= */

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const savedSidebar = localStorage.getItem(SIDEBAR_KEY);

    if (savedTheme === "dark" || savedTheme === "soft-dark") {
      setTheme(savedTheme);
    }

    if (savedSidebar === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const themeClasses = useMemo(() => {
    if (theme === "soft-dark") {
      return {
        page: "min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),rgba(15,23,42,1)_20%,rgba(10,15,28,1)_62%,rgba(7,11,20,1)_100%)] text-slate-100",
        sidebar:
          "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(9,16,28,0.95))]",
        topbar: "border-white/10 bg-white/[0.05]",
        panel: "border-white/10 bg-white/[0.05]",
      };
    }

    return {
      page: "min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),rgba(2,6,23,1)_18%,rgba(1,3,10,1)_60%,rgba(0,1,6,1)_100%)] text-slate-100",
      sidebar:
        "border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(3,7,18,0.98))]",
      topbar: "border-white/10 bg-white/[0.04]",
      panel: "border-white/10 bg-white/[0.04]",
    };
  }, [theme]);

  const currentPageTitle = useMemo(() => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname.startsWith("/admin/appointments")) return "Appointments";
    if (pathname.startsWith("/admin/doctors")) return "Doctors";
    if (pathname.startsWith("/admin/patients")) return "Patients";
    if (pathname.startsWith("/admin/payments")) return "Payments";
    return "Admin";
  }, [pathname]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className={cn(themeClasses.page, "overflow-x-hidden")}>
      <div className="flex min-h-screen">
        {/* MOBILE OVERLAY */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* MOBILE DRAWER */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[300px] -translate-x-full border-r p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-transform duration-300 lg:hidden",
            themeClasses.sidebar,
            open && "translate-x-0",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-base font-bold text-slate-950">
                  A
                </div>
                <div>
                  <p className="font-semibold text-white">Clinic Admin</p>
                  <p className="text-xs text-slate-400">Control Center</p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200"
                aria-label="Close menu"
              >
                Close
              </button>
            </div>

            <div
              className={cn(
                "mb-4 rounded-[24px] border p-4",
                themeClasses.panel,
              )}
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Theme mode
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    theme === "dark"
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/10 bg-white/[0.03] text-slate-200",
                  )}
                >
                  Dark
                </button>

                <button
                  onClick={() => setTheme("soft-dark")}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    theme === "soft-dark"
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/10 bg-white/[0.03] text-slate-200",
                  )}
                >
                  Softer
                </button>
              </div>
            </div>

            <div className="flex-1">
              <AdminNav pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-4 w-full rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15 disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        {/* DESKTOP SIDEBAR */}
        <aside
          className={cn(
            "hidden border-r shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col",
            themeClasses.sidebar,
            sidebarCollapsed ? "w-[96px]" : "w-[290px]",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-base font-bold text-slate-950 shadow-lg">
                    A
                  </div>

                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        Clinic Admin
                      </p>
                      <p className="text-xs text-slate-400">Control Center</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                  aria-label="Toggle sidebar"
                >
                  {sidebarCollapsed ? "→" : "←"}
                </button>
              </div>
            </div>

            <div className="p-4">
              <div
                className={cn("rounded-[24px] border p-4", themeClasses.panel)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-base font-bold text-slate-950">
                    A
                  </div>

                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        Administrator
                      </p>
                      <p className="text-xs text-slate-400">admin</p>
                      <div className="mt-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
                        Full access
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 px-3 py-2">
              <AdminNav pathname={pathname} collapsed={sidebarCollapsed} />
            </div>

            <div className="border-t border-white/10 p-4 space-y-3">
              {!sidebarCollapsed && (
                <div
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    themeClasses.panel,
                  )}
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Theme mode
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                        theme === "dark"
                          ? "bg-cyan-400 text-slate-950"
                          : "border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]",
                      )}
                    >
                      Dark
                    </button>

                    <button
                      onClick={() => setTheme("soft-dark")}
                      className={cn(
                        "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                        theme === "soft-dark"
                          ? "bg-cyan-400 text-slate-950"
                          : "border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]",
                      )}
                    >
                      Softer
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-500/15 disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header
            className={cn(
              "sticky top-0 z-30 border-b px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8",
              themeClasses.topbar,
            )}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOpen(true)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] lg:hidden"
                  aria-label="Open menu"
                >
                  Menu
                </button>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Admin portal
                  </p>
                  <h1 className="mt-1 text-xl font-semibold text-white">
                    {currentPageTitle}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300">
                  {theme === "dark" ? "Dark mode" : "Soft dark mode"}
                </div>

                <button
                  onClick={() =>
                    setTheme((prev) => (prev === "dark" ? "soft-dark" : "dark"))
                  }
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-500/15"
                >
                  Switch to {theme === "dark" ? "softer" : "darker"} design
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
