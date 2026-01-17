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
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: "🔔",
      title: "Appointment Reminders",
      text: "Never miss an appointment.",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      text: "Your data is encrypted and secure.",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: "🩺",
      title: "Doctor Dashboard",
      text: "Manage patients efficiently.",
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      icon: "👥",
      title: "Patient Management",
      text: "Organize patient information easily.",
      color: "bg-pink-100 text-pink-600",
    },
    {
      icon: "⏱️",
      title: "Real-Time Availability",
      text: "Live slot updates.",
      color: "bg-teal-100 text-teal-600",
    },
    {
      icon: "📧",
      title: "Email Notifications",
      text: "Automatic confirmations.",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: "📱",
      title: "Mobile Friendly",
      text: "Works on all devices.",
      color: "bg-cyan-100 text-cyan-600",
    },
  ];

  return (
    <section
      id="features"
      className="relative py-20 sm:py-28 bg-linear-to-b from-blue-50 to-white overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-20 sm:h-24 bg-white rounded-b-[100%]" />

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6">
        {/* TEXT */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Why Choose Us?
          </h2>
          <p className="mt-4 sm:mt-5 text-gray-600 max-w-3xl mx-auto text-base sm:text-lg">
            HealthTrack is built to simplify healthcare appointment management
            for both patients and doctors.
          </p>
        </div>

        {/* ================= CAROUSEL (>=1300px) ================= */}
        <div className="features-carousel mt-24">
          <div className="carousel">
            <div className="carousel-track" style={sliderStyle}>
              {cards.map((card, index) => {
                const itemStyle: CSSWithVars = {
                  "--position": index + 1,
                };
                return (
                  <div key={index} className="carousel-item" style={itemStyle}>
                    <div className="bg-white rounded-2xl p-8 shadow-md text-center w-72">
                      <div
                        className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full text-2xl ${card.color}`}
                      >
                        {card.icon}
                      </div>
                      <h3 className="mt-6 text-xl font-semibold text-gray-900">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-gray-600">{card.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============ SCROLL INFINI (<1300px && >=500px) ============ */}
        <div className="features-scroll mt-16 overflow-hidden">
          <div
            ref={trackRef}
            className="features-track"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {[...cards, ...cards].map((card, index) => (
              <div key={index} className="features-card">
                <div
                  className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full text-xl ${card.color}`}
                >
                  {card.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{card.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ================= GRID (<500px) ================= */}
        <div className="features-grid mt-12">
          <div className="grid grid-cols-1 gap-6">
            {cards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-md text-center pop-in2"
              >
                <div
                  className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full text-xl ${card.color}`}
                >
                  {card.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
