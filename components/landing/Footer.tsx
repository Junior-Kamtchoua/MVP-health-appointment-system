"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative overflow-hidden bg-[#0f172a] pt-24 sm:pt-28 pb-12 sm:pb-14"
    >
      {/* BACKGROUND ACCENTS (SOFT) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-12 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-[-90px] top-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-[-80px] left-1/3 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* SOFT OVERLAY */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%,transparent_70%,rgba(255,255,255,0.04))]" />
      </div>

      {/* FOOTER CARD */}
      <div className="relative z-10 mx-auto w-full max-w-none px-1 sm:px-2 lg:px-3">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.06] px-5 py-8 shadow-2xl backdrop-blur-xl sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          {/* HEADER */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                Contact & Footer
              </div>

              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                Stay connected with HealthTrack
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Built to make appointment booking and clinic operations cleaner,
                safer, and more professional.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniBadge label="Support" value="24/7" />
              <MiniBadge label="Platform" value="Secure" />
              <MiniBadge label="Access" value="Anytime" />
            </div>
          </div>

          {/* CONTENT */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* BRAND */}
            <div className="rounded-[28px] border border-white/10 bg-[#0f1b2e]/80 p-5 text-center shadow-xl md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2">
                  <Image
                    src="/logo.png"
                    alt="HealthTrack Logo"
                    width={150}
                    height={48}
                    className="h-auto w-auto"
                  />
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-300 sm:text-base max-w-md mx-auto md:mx-0">
                HealthTrack connects patients and doctors with a cleaner,
                structured, and smoother healthcare experience.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card title="Mission" text="Simplify healthcare scheduling." />
                <Card title="Experience" text="Faster and clearer workflows." />
              </div>
            </div>

            {/* LINKS */}
            <div className="rounded-[28px] border border-white/10 bg-[#0f1b2e]/80 p-5 text-center shadow-xl md:text-left">
              <h3 className="text-base font-semibold text-white sm:text-lg">
                Quick Links
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Navigate the platform easily.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  { label: "Home", href: "#" },
                  { label: "About", href: "#about" },
                  { label: "Features", href: "#features" },
                  { label: "FAQ", href: "#faq" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      <span className="text-cyan-300">→</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CONTACT */}
            <div className="rounded-[28px] border border-white/10 bg-[#0f1b2e]/80 p-5 text-center shadow-xl md:text-left">
              <h3 className="text-base font-semibold text-white sm:text-lg">
                Contact
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Reach us anytime for support.
              </p>

              <div className="mt-6 space-y-3">
                <ContactItem icon="📧" text="support@healthtrack.com" />
                <ContactItem icon="📞" text="+237 693 57 72 70" />
                <ContactItem icon="⏰" text="24/7 Availability" />
              </div>

              <div className="mt-6 rounded-[24px] border border-cyan-400/20 bg-cyan-500/15 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">
                  Need help?
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  Get fast assistance with our streamlined support.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                  <a
                    href="mailto:support@healthtrack.com"
                    className="rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:-translate-y-0.5"
                  >
                    Email
                  </a>

                  <a
                    href="#faq"
                    className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08]"
                  >
                    FAQ
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.05] px-5 py-4">
            <div className="flex flex-col gap-3 text-center md:flex-row md:justify-between">
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} HealthTrack
              </p>

              <div className="flex flex-wrap justify-center gap-3 md:justify-end">
                <Tag text="Secure" />
                <Tag text="Patient First" />
                <Tag text="Modern Care" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* COMPONENTS */

function MiniBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ContactItem({ icon, text }: { icon: string; text: string }) {
  return (
    <p className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-300 md:justify-start">
      <span>{icon}</span>
      {text}
    </p>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-slate-400">
      {text}
    </span>
  );
}
