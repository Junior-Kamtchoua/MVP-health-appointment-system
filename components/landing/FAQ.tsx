"use client";

import { useMemo, useState } from "react";

const faqs = [
  {
    category: "Appointments",
    question: "How do I book an appointment?",
    answer:
      "Create your account, sign in, choose your doctor, select an available date and time, then confirm your booking securely from the appointment flow.",
  },
  {
    category: "Appointments",
    question: "Can I reschedule or cancel an appointment?",
    answer:
      "Yes. From your dashboard, you can manage your bookings, review upcoming visits, and reschedule or cancel when the appointment still falls within the allowed update window.",
  },
  {
    category: "Security",
    question: "Is my personal information secure?",
    answer:
      "Yes. HealthTrack uses modern authentication, protected sessions, and secure data handling practices to protect sensitive account and appointment information.",
  },
  {
    category: "Payments",
    question: "Do I need to pay before confirming my visit?",
    answer:
      "Some appointments may require a secure reservation payment before final confirmation. When payment is required, you are redirected to a protected checkout flow.",
  },
  {
    category: "Doctors",
    question: "Can I choose a specific doctor?",
    answer:
      "Absolutely. You can browse available doctors, review specialties, and book directly with the doctor that best matches your needs and preferred schedule.",
  },
  {
    category: "Availability",
    question: "What if no time slot is available?",
    answer:
      "If a doctor has no open slots, you can choose another date, try another practitioner, or come back later when new availability is published.",
  },
  {
    category: "Support",
    question: "What should I do if I have a technical problem?",
    answer:
      "If something is not working properly, contact support from the platform or use the contact section on the landing page. Our team can help with login, booking, and payment issues.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const categories = useMemo(() => {
    return Array.from(new Set(faqs.map((faq) => faq.category)));
  }, []);

  return (
    <section id="faq" className="relative overflow-hidden bg-[#0f172a] py-20">
      {/* BACKGROUND (SIMPLE + PREMIUM BLOBS) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-100px] top-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-60px] left-1/3 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl" />

        {/* subtle gradient overlay (comme Features) */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />
      </div>

      <div className="relative mx-auto w-full max-w-none px-1 sm:px-2 lg:px-3">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          {/* LEFT */}
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              FAQ
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Frequently Asked Questions
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Everything you need to know about booking appointments, choosing
              doctors, managing your schedule, and using HealthTrack with
              confidence.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Questions
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {faqs.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Categories
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {categories.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Support
                </p>
                <p className="mt-2 text-2xl font-bold text-white">24/7</p>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-cyan-400/15 bg-cyan-500/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                Need more help?
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Still have questions?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                If you do not find the answer you need here, our team can help
                you with booking issues, account access, payment flow, and
                doctor availability questions.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="#contact"
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                >
                  Contact Support
                </a>

                <a
                  href="#booking"
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Start Booking
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-4 lg:p-5">
            <div className="mb-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={`${faq.question}-${index}`}
                    className={`overflow-hidden rounded-[26px] border transition duration-300 ${
                      isOpen
                        ? "border-cyan-400/20 bg-cyan-500/10 shadow-[0_16px_50px_rgba(34,211,238,0.08)]"
                        : "border-white/10 bg-[#081423]/85 hover:border-white/15 hover:bg-[#0a1727]"
                    }`}
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="flex w-full items-start justify-between gap-4 px-4 py-5 text-left sm:px-5"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                            isOpen
                              ? "bg-cyan-400 text-slate-950"
                              : "bg-white/[0.06] text-cyan-200"
                          }`}
                        >
                          {isOpen ? "−" : "+"}
                        </div>

                        <div className="min-w-0">
                          <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            {faq.category}
                          </div>

                          <h3 className="text-lg font-semibold leading-7 text-white">
                            {faq.question}
                          </h3>
                        </div>
                      </div>

                      <div
                        className={`mt-1 hidden text-xl sm:block ${
                          isOpen ? "text-cyan-300" : "text-slate-500"
                        }`}
                      >
                        {isOpen ? "▾" : "▸"}
                      </div>
                    </button>

                    <div
                      className={`grid transition-all duration-300 ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-5 sm:px-5 sm:pb-6">
                          <div className="ml-[3.25rem] border-l border-white/10 pl-4">
                            <p className="text-sm leading-7 text-slate-300">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Quick note
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                HealthTrack is built to make booking and managing appointments
                faster, clearer, and more secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
