"use client";

import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-[#0f172a] py-20">
      {/* BACKGROUND ACCENTS */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-8 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-90px] top-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-80px] left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />

        {/* White luminous circle at the end */}
      </div>

      <div className="relative mx-auto w-full max-w-none px-1 sm:px-2 lg:px-3">
        <div className="grid grid-cols-1 items-center gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          {/* LEFT */}
          <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-6 lg:p-7">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              About HealthTrack
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              A smarter healthcare experience designed for modern clinics and
              patients
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              HealthTrack brings appointment booking, schedule visibility,
              reminders, and patient organization into one secure digital
              platform. Instead of disconnected calls, manual follow-up, and
              confusing coordination, both patients and providers benefit from a
              cleaner, faster, and more reliable workflow.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-400">
              The goal is simple: reduce friction, reduce missed appointments,
              improve communication, and create a premium healthcare journey
              from the first booking to the final follow-up.
            </p>

            {/* TOP STATS */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Access
                </p>
                <p className="mt-2 text-3xl font-bold text-white">24/7</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Patients can book and manage visits whenever it fits their
                  schedule.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Workflow
                </p>
                <p className="mt-2 text-3xl font-bold text-white">Smooth</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  A clearer process from booking to reminder to attendance.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Security
                </p>
                <p className="mt-2 text-3xl font-bold text-white">Protected</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Secure sessions and structured data handling for healthcare
                  operations.
                </p>
              </div>
            </div>

            {/* FEATURE GRID */}
            <div className="mt-8 grid grid-cols-1 gap-4 2xl:grid-cols-2">
              <FeatureCard
                badgeClass="bg-cyan-500/12 text-cyan-200"
                title="Easily find and book appointments"
                text="Patients can quickly choose doctors, review availability, and reserve appointments through a cleaner booking flow."
              />

              <FeatureCard
                badgeClass="bg-emerald-500/12 text-emerald-200"
                title="Receive automated reminders"
                text="Reminder flows help reduce missed visits and keep patients informed before each consultation."
              />

              <FeatureCard
                badgeClass="bg-violet-500/12 text-violet-200"
                title="Manage patient history more clearly"
                text="Important visit information stays more organized and easier to follow over time."
              />

              <FeatureCard
                badgeClass="bg-amber-500/12 text-amber-200"
                title="Save time for clinics and teams"
                text="Better scheduling visibility reduces manual coordination and supports more efficient daily operations."
              />
            </div>

            {/* SECONDARY BLOCK */}
            <div className="mt-8 rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.20)]">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Why it matters
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Better scheduling and better communication create a
                    stronger, calmer, and more professional care experience.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    For patients
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Faster booking, fewer missed visits, and easier access to
                    appointment information.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    For providers
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    A more efficient workflow with stronger visibility, cleaner
                    communication, and better time management.
                  </p>
                </div>
              </div>
            </div>

            {/* EXTRA CONTENT */}
            <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                What HealthTrack improves
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MiniInfo
                  title="Booking clarity"
                  text="Patients can see where they are in the process and confirm visits with less confusion."
                />
                <MiniInfo
                  title="Operational control"
                  text="Clinics gain better visibility into appointment flow, doctor schedules, and daily activity."
                />
                <MiniInfo
                  title="Patient confidence"
                  text="A cleaner digital experience helps patients feel informed, guided, and supported."
                />
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#features"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-8 py-4 font-semibold text-slate-950 shadow-[0_14px_34px_rgba(34,211,238,0.22)] transition-all duration-300 hover:-translate-y-0.5"
              >
                Learn More
              </a>

              <a
                href="#booking"
                className="rounded-full border border-white/10 bg-white/[0.04] px-8 py-4 font-semibold text-white shadow-sm transition-all duration-300 hover:bg-white/[0.08]"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center xl:justify-end">
            <div className="relative w-full max-w-[700px]">
              {/* TOP FLOATING CARD */}
              <div className="absolute left-2 top-5 z-10 hidden max-w-[250px] rounded-2xl border border-white/10 bg-[#07111f]/95 px-4 py-3 shadow-[0_24px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Smart reminders
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-white">
                  Patients stay informed and prepared before every visit
                </p>
              </div>

              {/* MAIN FRAME */}
              <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 shadow-[0_34px_90px_rgba(0,0,0,0.30)] backdrop-blur-xl">
                <div className="rounded-[26px] border border-white/10 bg-[#081423]/90 p-3 shadow-inner">
                  <Image
                    src="/calendar.gif"
                    alt="Appointment calendar"
                    width={700}
                    height={520}
                    className="h-auto w-full rounded-[22px] object-cover"
                    priority
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <PanelPill
                    label="Booking"
                    value="Fast and intuitive scheduling"
                  />
                  <PanelPill
                    label="Tracking"
                    value="Clear appointment visibility"
                  />
                  <PanelPill
                    label="History"
                    value="Better record organization"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Patient experience
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      A clearer journey from account access to booking, payment,
                      and confirmation.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Clinic experience
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Better appointment structure and smoother daily workflow
                      management for teams.
                    </p>
                  </div>
                </div>
              </div>

              {/* BOTTOM FLOATING CARD */}
              <div className="absolute -bottom-4 right-2 z-10 hidden max-w-[270px] rounded-2xl border border-white/10 bg-[#07111f]/95 px-4 py-3 shadow-[0_24px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Unified workflow
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-white">
                  Booking, reminders, and patient history connected in one place
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  text,
  badgeClass,
}: {
  title: string;
  text: string;
  badgeClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_35px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badgeClass}`}
        >
          ✓
        </span>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function MiniInfo({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#081423]/75 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function PanelPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
