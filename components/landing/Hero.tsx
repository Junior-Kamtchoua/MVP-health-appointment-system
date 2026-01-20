"use client";

import { useState } from "react";
import Link from "next/link";

export default function Hero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative w-full pt-20 hero-mobile-fix bg-linear-to-br from-blue-50 to-white">
        <div
          className="relative z-10 max-w-7xl mx-auto
                     min-h-[calc(100vh-80px)]
                     flex flex-col md:flex-row
                     items-center justify-center
                     px-6 gap-12"
        >
          {/* ================= LEFT : VIDEO PREVIEW ================= */}
          <div className="w-full md:w-[60%] flex items-center justify-center">
            <div
              className="relative w-full max-w-175
                         aspect-video
                         rounded-3xl
                         bg-blue-200
                         p-4 md:p-5"
            >
              <div className="w-full h-full rounded-2xl overflow-hidden bg-black pop-in1">
                <video
                  src="/cerveau.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* ================= RIGHT : TEXT ================= */}
          <div className="w-full md:w-[40%] text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 pop-in">
              Your Healthcare Appointment Solution
            </h1>

            <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-600 max-w-xl mx-auto md:mx-0 pop-in1">
              Book, schedule, and manage medical appointments easily with
              real-time availability and secure access for patients and doctors.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start pop-in2">
              {/* WATCH DEMO */}
              <button
                onClick={() => setOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition"
              >
                ▶ Watch Demo
              </button>

              <Link href="/login" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 rounded-full bg-white text-gray-800 font-semibold shadow-md hover:bg-gray-100 transition">
                  👤 Login
                </button>
              </Link>

              <Link href="/register" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 rounded-full border border-blue-600 text-blue-600 font-semibold hover:bg-blue-600 hover:text-white transition">
                  Register
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DEMO VIDEO MODAL ================= */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10
                         bg-black/60 text-white
                         rounded-full w-10 h-10
                         flex items-center justify-center
                         hover:bg-black transition"
            >
              ✕
            </button>

            {/* VIDEO */}
            <video
              src="/demos.mp4"
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
