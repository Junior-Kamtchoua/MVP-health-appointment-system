"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Doctor = {
  id: string;
  full_name: string;
  email: string;
};

type ThemeMode = "dark" | "soft-dark";

const THEME_KEY = "doctor-layout-theme-v2";
const SIDEBAR_KEY = "doctor-layout-sidebar-collapsed-v2";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /*PERSISTENCE*/

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

  /*LOAD DOCTOR*/

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("doctors")
          .select("id, full_name, email")
          .eq("email", user.email)
          .single();

        if (error || !data) {
          console.error("Doctor load error:", error);
          router.push("/login");
          return;
        }

        setDoctor(data);
      } catch (err) {
        console.error("Unexpected error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [router]);

  /*THEME*/

  const themeClasses = useMemo(() => {
    if (theme === "soft-dark") {
      return {
        page: "min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),rgba(15,23,42,1)_20%,rgba(10,15,28,1)_62%,rgba(7,11,20,1)_100%)] text-slate-100",
        sidebar:
          "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(9,16,28,0.95))]",
        panel: "border-white/10 bg-white/[0.05]",
        topbar: "border-white/10 bg-white/[0.04]",
        muted: "text-slate-400",
        subtle: "text-slate-500",
      };
    }

    return {
      page: "min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),rgba(2,6,23,1)_18%,rgba(1,3,10,1)_60%,rgba(0,1,6,1)_100%)] text-slate-100",
      sidebar:
        "border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(3,7,18,0.98))]",
      panel: "border-white/10 bg-white/[0.04]",
      topbar: "border-white/10 bg-white/[0.03]",
      muted: "text-slate-400",
      subtle: "text-slate-500",
    };
  }, [theme]);

  /*ACTIVE LINK*/

  const navItems = [
    {
      href: "/doctor",
      label: "Dashboard",
      icon: "◫",
      exact: true,
    },
    {
      href: "/doctor/appointments",
      label: "Appointments",
      icon: "◷",
      exact: false,
    },
    {
      href: "/doctor/availability",
      label: "Availability",
      icon: "◌",
      exact: false,
    },
  ];

  const isActive = (path: string, exact: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const currentPageTitle = useMemo(() => {
    if (pathname === "/doctor") return "Dashboard";
    if (pathname.startsWith("/doctor/appointments")) return "Appointments";
    if (pathname.startsWith("/doctor/availability")) return "Availability";
    return "Doctor Portal";
  }, [pathname]);

  const doctorInitials = useMemo(() => {
    const safe = doctor?.full_name || "Doctor";
    return safe
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  }, [doctor?.full_name]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /*LOADING*/

  if (loading) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center",
          themeClasses.page,
        )}
      >
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-sm text-slate-300">Loading doctor workspace...</p>
        </div>
      </div>
    );
  }

  /*UI*/

  return (
    <div className={cn(themeClasses.page)}>
      <div className="flex min-h-screen">
        {/* MOBILE OVERLAY */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* SIDEBAR DESKTOP */}
        <aside
          className={cn(
            "hidden border-r shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 md:flex md:flex-col",
            themeClasses.sidebar,
            sidebarCollapsed ? "md:w-[96px]" : "md:w-[290px]",
          )}
        >
          <div className="flex h-full flex-col">
            {/* BRAND */}
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-base font-bold text-slate-950 shadow-lg">
                    {doctorInitials || "D"}
                  </div>

                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {doctor?.full_name}
                      </p>
                      <p className="text-xs text-slate-400">Doctor Workspace</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  {sidebarCollapsed ? "→" : "←"}
                </button>
              </div>
            </div>

            {/* PROFILE CARD */}
            <div className="p-4">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-base font-bold text-slate-950">
                    {doctorInitials}
                  </div>

                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {doctor?.full_name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {doctor?.email}
                      </p>
                      <div className="mt-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
                        Verified doctor
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NAV */}
            <nav className="flex-1 space-y-2 px-3 py-2">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
                      active
                        ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100 shadow-[0_10px_24px_rgba(34,211,238,0.08)]"
                        : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-sm">
                      {item.icon}
                    </span>

                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* FOOTER */}
            <div className="border-t border-white/10 p-4 space-y-3">
              {!sidebarCollapsed && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
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
                onClick={logout}
                className="w-full rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-500/15"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE SIDEBAR */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[300px] -translate-x-full border-r p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-transform duration-300 md:hidden",
            themeClasses.sidebar,
            mobileMenuOpen && "translate-x-0",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-base font-bold text-slate-950">
                  {doctorInitials}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {doctor?.full_name}
                  </p>
                  <p className="text-xs text-slate-400">Doctor Workspace</p>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mb-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
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

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
                      active
                        ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
                        : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-sm">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={logout}
              className="mt-4 w-full rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* TOPBAR */}
          <header
            className={cn(
              "sticky top-0 z-30 border-b px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8",
              themeClasses.topbar,
            )}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] md:hidden"
                >
                  Menu
                </button>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Doctor portal
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

          {/* CONTENT */}
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
