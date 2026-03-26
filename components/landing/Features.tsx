"use client";

import React, { useRef } from "react";

type CSSWithVars = React.CSSProperties & {
  [key: `--${string}`]: string | number;
};

export default function Features() {
  const sliderStyle: CSSWithVars = {
    "--quantity": 8,
  };

  const trackRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    if (!trackRef.current) return;
    trackRef.current.style.animationPlayState = "paused";
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleTouchEnd = () => {
    if (!trackRef.current) return;
    timeoutRef.current = setTimeout(() => {
      if (trackRef.current) {
        trackRef.current.style.animationPlayState = "running";
      }
    }, 5000);
  };

  const cards = [
    {
      icon: "📅",
      title: "Easy Booking",
      text: "Schedule appointments with just a few clicks.",
      color:
        "bg-cyan-500/10 text-cyan-200 border border-cyan-400/20 shadow-[0_10px_30px_rgba(34,211,238,0.10)]",
    },
    {
      icon: "🔔",
      title: "Appointment Reminders",
      text: "Never miss an appointment.",
      color:
        "bg-amber-500/10 text-amber-200 border border-amber-400/20 shadow-[0_10px_30px_rgba(245,158,11,0.10)]",
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      text: "Your data is encrypted and secure.",
      color:
        "bg-emerald-500/10 text-emerald-200 border border-emerald-400/20 shadow-[0_10px_30px_rgba(16,185,129,0.10)]",
    },
    {
      icon: "🩺",
      title: "Doctor Dashboard",
      text: "Manage patients efficiently.",
      color:
        "bg-indigo-500/10 text-indigo-200 border border-indigo-400/20 shadow-[0_10px_30px_rgba(99,102,241,0.10)]",
    },
    {
      icon: "👥",
      title: "Patient Management",
      text: "Organize patient information easily.",
      color:
        "bg-fuchsia-500/10 text-fuchsia-200 border border-fuchsia-400/20 shadow-[0_10px_30px_rgba(217,70,239,0.10)]",
    },
    {
      icon: "⏱️",
      title: "Real-Time Availability",
      text: "Live slot updates.",
      color:
        "bg-teal-500/10 text-teal-200 border border-teal-400/20 shadow-[0_10px_30px_rgba(20,184,166,0.10)]",
    },
    {
      icon: "📧",
      title: "Email Notifications",
      text: "Automatic confirmations.",
      color:
        "bg-orange-500/10 text-orange-200 border border-orange-400/20 shadow-[0_10px_30px_rgba(249,115,22,0.10)]",
    },
    {
      icon: "📱",
      title: "Mobile Friendly",
      text: "Works on all devices.",
      color:
        "bg-sky-500/10 text-sky-200 border border-sky-400/20 shadow-[0_10px_30px_rgba(14,165,233,0.10)]",
    },
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#0f172a] py-20 sm:py-24"
    >
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-100px] top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-90px] top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-70px] left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />
      </div>

      {/* 👉 LE RESTE DE TON CODE CONTINUE EXACTEMENT COMME AVANT (NON MODIFIÉ) */}

      <div className="relative z-20 mx-auto w-full max-w-none px-1 sm:px-2 lg:px-3">
        {/* TEXT */}
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Platform Features
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Why Choose HealthTrack?
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            HealthTrack is designed to make healthcare scheduling faster,
            cleaner, and more professional for both patients and medical teams.
            From booking to reminders to daily management, every step feels more
            modern and more efficient.
          </p>
        </div>

        {/* TOP INFO BAR */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Experience
            </p>
            <p className="mt-2 text-2xl font-bold text-white">Smooth</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              A simpler, more modern patient journey from booking to follow-up.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Operations
            </p>
            <p className="mt-2 text-2xl font-bold text-white">Faster</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Better visibility and fewer manual scheduling bottlenecks for
              teams.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Reliability
            </p>
            <p className="mt-2 text-2xl font-bold text-white">Strong</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Secure access, reminder support, and a workflow patients can
              trust.
            </p>
          </div>
        </div>

        {/* ================= CAROUSEL (>=1300px) ================= */}
        <div className="features-carousel mt-16">
          <div className="carousel">
            <div className="carousel-track" style={sliderStyle}>
              {cards.map((card, index) => {
                const itemStyle: CSSWithVars = {
                  "--position": index + 1,
                };

                return (
                  <div key={index} className="carousel-item" style={itemStyle}>
                    <div className="w-72 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20">
                      <div
                        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl ${card.color}`}
                      >
                        {card.icon}
                      </div>

                      <h3 className="mt-6 text-xl font-semibold text-white">
                        {card.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        {card.text}
                      </p>

                      <div className="mt-5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Premium workflow
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============ SCROLL INFINI (<1300px && >=500px) ============ */}
        <div className="features-scroll mt-14 overflow-hidden">
          <div
            ref={trackRef}
            className="features-track"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {[...cards, ...cards].map((card, index) => (
              <div
                key={index}
                className="features-card rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl"
              >
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-xl ${card.color}`}
                >
                  {card.icon}
                </div>

                <h3 className="mt-4 text-lg font-semibold text-white">
                  {card.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {card.text}
                </p>

                <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Smart feature
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= GRID (<500px) ================= */}
        <div className="features-grid mt-12">
          <div className="grid grid-cols-1 gap-5">
            {cards.map((card, index) => (
              <div
                key={index}
                className="pop-in2 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl"
              >
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-xl ${card.color}`}
                >
                  {card.icon}
                </div>

                <h3 className="mt-4 text-lg font-semibold text-white">
                  {card.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {card.text}
                </p>

                <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Essential
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CONTENT */}
        <div className="mt-14 rounded-[32px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                For patients
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Patients get a faster booking experience, more clarity, and
                better communication before each appointment.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                For clinics
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Clinics benefit from more organized scheduling, clearer
                availability, and reduced operational friction.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                For growth
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                A cleaner digital workflow helps improve trust, retention, and
                the overall quality of the healthcare experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
