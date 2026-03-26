"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* ================= CONTENT ================= */

function SuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl max-w-md w-full text-center space-y-6">
        {/* ICON */}
        <div className="flex justify-center">
          <div className="h-20 w-20 flex items-center justify-center rounded-full bg-green-500/10 border border-green-400/20 text-green-400 text-3xl">
            ✓
          </div>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-white">Payment Successful</h1>

        {/* MESSAGE */}
        <p className="text-slate-300 text-sm leading-relaxed">
          Your appointment has been successfully confirmed.
          <br />A confirmation email will be sent shortly.
        </p>

        {/* ID */}
        {appointmentId && (
          <div className="text-xs text-slate-500 break-all">
            Appointment ID:{" "}
            <span className="font-mono text-slate-300">{appointmentId}</span>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/user/appointments"
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
          >
            View My Appointments
          </Link>

          <Link
            href="/user"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Book Another
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white text-sm">
          Loading confirmation...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
