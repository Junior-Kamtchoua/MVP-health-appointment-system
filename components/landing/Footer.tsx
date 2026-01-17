import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative bg-linear-to-b from-blue-100 via-sky-100 to-blue-200
                 pt-24 sm:pt-32 pb-12 sm:pb-14 overflow-hidden"
    >
      {/* Top wave */}
      <div className="absolute inset-x-0 top-0 h-20 sm:h-28 bg-white rounded-b-[100%]" />

      {/* FOOTER CARD */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="bg-white/90 backdrop-blur-md rounded-3xl sm:rounded-4xl shadow-xl
                     px-6 sm:px-10 py-10 sm:py-14
                     grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12"
        >
          {/* BRAND */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Image
                src="/logo.png"
                alt="HealthTrack Logo"
                width={150}
                height={48}
                className="mx-auto md:mx-0"
              />
            </div>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-sm mx-auto md:mx-0">
              HealthTrack is a modern healthcare appointment system designed to
              connect patients and doctors with ease, security, and reliability.
            </p>
          </div>

          {/* LINKS */}
          <div className="md:border-x md:border-gray-200 md:px-10 text-center md:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              Quick Links
            </h3>

            <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
              {[
                { label: "Home", href: "#" },
                { label: "About", href: "#about" },
                { label: "Features", href: "#features" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-block transition-all duration-300
                               hover:translate-x-1 hover:text-blue-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Contact
            </h3>

            <p className="flex items-center justify-center md:justify-start gap-3 text-sm sm:text-base text-gray-700">
              <span className="text-lg">📧</span>
              support@healthtrack.com
            </p>

            <p className="flex items-center justify-center md:justify-start gap-3 text-sm sm:text-base text-gray-700">
              <span className="text-lg">📞</span>
              +237 (6 93 57 72 70)
            </p>

            <p className="flex items-center justify-center md:justify-start gap-3 text-sm sm:text-base text-gray-500">
              <span className="text-lg">⏰</span>
              Available 24/7
            </p>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="relative z-10 mt-8 sm:mt-12 text-center text-xs sm:text-sm text-gray-600">
        © {new Date().getFullYear()} HealthTrack. All rights reserved.
      </div>
    </footer>
  );
}
