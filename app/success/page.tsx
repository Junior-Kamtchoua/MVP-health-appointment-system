"use client";

import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
        <div className="text-green-600 text-5xl mb-4">✅</div>

        <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>

        <p className="text-gray-600 mb-6">
          Your appointment has been successfully confirmed.
          <br />A confirmation email will be sent to you shortly.
        </p>

        <Link
          href="/user/appointments"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          View My Appointments
        </Link>
      </div>
    </div>
  );
}
