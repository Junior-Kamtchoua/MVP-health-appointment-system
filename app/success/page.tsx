"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* ================= PAGE ================= */

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
        {/* ICON */}
        <div className="text-green-500 text-6xl">✅</div>

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>

        {/* MESSAGE */}
        <p className="text-gray-600 text-sm leading-relaxed">
          Your appointment has been successfully confirmed.
          <br />A confirmation email will be sent to you shortly.
        </p>

        {/* OPTIONAL INFO */}
        {appointmentId && (
          <div className="text-xs text-gray-500 break-all">
            Appointment ID: <span className="font-mono">{appointmentId}</span>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/user/appointments"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            View My Appointments
          </Link>

          <Link
            href="/user"
            className="bg-gray-100 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Book Another
          </Link>
        </div>
      </div>
    </div>
  );
}
