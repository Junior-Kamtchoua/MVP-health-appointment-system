"use client";

import { useState } from "react";
import Link from "next/link";

export default function Hero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*HERO*/}
      <section className="relative w-full overflow-hidden hero-mobile-fix bg-[#0f172a] pt-20">
        {/* BACKGROUND ACCENTS (SOFT DARK) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-100px] top-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-[-80px] top-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute bottom-[-80px] left-1/3 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />

          {/* LIGHT SOFT OVERLAY */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%,transparent_70%,rgba(255,255,255,0.04))]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-none flex-col items-center justify-center gap-8 px-1 py-10 sm:px-2 lg:flex-row lg:gap-10 lg:px-3">
          {/*LEFT*/}
          <div className="flex w-full items-center justify-center lg:w-[58%]">
            <div className="relative w-full max-w-[980px]">
              {/* FLOATING CARD */}
              <div className="absolute left-3 top-3 z-10 hidden rounded-2xl border border-white/10 bg-[#0b1220]/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Live platform preview
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Appointment booking experience
                </p>
              </div>

              <div className="relative aspect-video w-full rounded-[34px] border border-white/10 bg-[#0b1220] p-3 shadow-2xl backdrop-blur-xl sm:p-4 md:p-5">
                <div className="relative h-full w-full rounded-[26px] border border-white/10 bg-[#0f1b2e] p-2 sm:p-3">
                  <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-black">
                    <video
                      src="/cerveau.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* STATS */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MiniPill label="Booking" value="Fast" />
                  <MiniPill label="Access" value="Secure" />
                  <MiniPill label="Workflow" value="Modern" />
                </div>
              </div>

              {/* FLOATING CARD */}
              <div className="absolute -bottom-3 right-3 z-10 hidden max-w-[260px] rounded-2xl border border-white/10 bg-[#0b1220]/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Real-time experience
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Smooth scheduling & secure access
                </p>
              </div>
            </div>
          </div>

          {/*RIGHT*/}
          <div className="w-full lg:w-[42%]">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-5 text-center shadow-2xl backdrop-blur-xl sm:p-6 lg:p-7 lg:text-left">
              <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                Healthcare platform
              </div>

              <h1 className="mt-5 text-3xl font-bold text-white sm:text-4xl md:text-5xl xl:text-6xl">
                Your Healthcare Appointment Solution
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg md:text-xl lg:mx-0">
                Book, schedule, and manage medical appointments with real-time
                availability and secure access.
              </p>

              {/* VALUE CARDS */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <ValueCard
                  title="Real-Time"
                  text="Live availability updates."
                />
                <ValueCard title="Secure" text="Protected workflow." />
                <ValueCard title="Simple" text="Smooth booking." />
              </div>

              {/* BUTTONS */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <button
                  onClick={() => setOpen(true)}
                  className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-8 py-4 font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 sm:w-auto"
                >
                  ▶ Watch Demo
                </button>

                <Link href="/login" className="w-full sm:w-auto">
                  <button className="w-full rounded-full border border-white/10 bg-white/[0.08] px-8 py-4 font-semibold text-white hover:bg-white/[0.12]">
                    Login
                  </button>
                </Link>

                <Link href="/register" className="w-full sm:w-auto">
                  <button className="w-full rounded-full border border-cyan-400/20 bg-cyan-500/15 px-8 py-4 font-semibold text-cyan-100 hover:bg-cyan-500/20">
                    Register
                  </button>
                </Link>
              </div>

              {/* TRUST */}
              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.05] p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <TrustItem label="Patients" value="Easy booking" />
                  <TrustItem label="Doctors" value="Clear control" />
                  <TrustItem label="Platform" value="Mobile ready" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220] shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 h-10 w-10 rounded-full bg-black/50 text-white"
            >
              ✕
            </button>

            <video
              src="/demos.mp4"
              controls
              autoPlay
              className="h-full w-full object-contain bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}

/* COMPONENTS */

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function TrustItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1b2e]/70 px-4 py-3 text-center">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}
