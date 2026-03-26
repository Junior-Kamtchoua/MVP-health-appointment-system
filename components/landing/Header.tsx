"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full pop-in1">
      <div className="mx-auto w-full max-w-none px-1 sm:px-2 lg:px-3">
        <div className="mt-2 flex items-center justify-between rounded-[24px] border border-white/10 bg-[#07111f]/80 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-5 lg:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="#" className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <Image
                  src="/logo.png"
                  alt="HealthTrack Logo"
                  width={120}
                  height={40}
                  priority
                  className="h-auto w-auto"
                />
              </div>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="#"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Home
            </Link>
            <Link
              href="#about"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              About
            </Link>
            <Link
              href="#features"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#faq"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              FAQ
            </Link>
            <Link
              href="#contact"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Contact
            </Link>
          </nav>

          {/* Actions Desktop */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.20)] transition hover:-translate-y-0.5"
            >
              Register
            </Link>
          </div>

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08] md:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* ===== Mobile Menu ===== */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      >
        <div
          className={`absolute right-0 top-0 flex h-full w-80 max-w-[90vw] flex-col border-l border-white/10 bg-[#07111f]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top */}
          <div className="mb-8 flex items-center justify-between">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <Image
                src="/logo.png"
                alt="HealthTrack Logo"
                width={110}
                height={36}
                className="h-auto w-auto"
              />
            </div>

            <button
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* Mobile Nav */}
          <nav className="flex flex-col gap-3">
            <Link
              href="#"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
            >
              Home
            </Link>
            <Link
              href="#about"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
            >
              About
            </Link>
            <Link
              href="#features"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
            >
              Features
            </Link>
            <Link
              href="#faq"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
            >
              FAQ
            </Link>
            <Link
              href="#contact"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
            >
              Contact
            </Link>
          </nav>

          {/* Mobile Info */}
          <div className="mt-6 rounded-[24px] border border-cyan-400/15 bg-cyan-500/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
              HealthTrack
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A smoother healthcare booking experience for patients and doctors.
            </p>
          </div>

          {/* Mobile Actions */}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.20)] transition hover:-translate-y-0.5"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
