"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 pop-in1">
      <div
        className="max-w-7xl mx-auto px-6 py-2
                   flex items-center justify-between
                   bg-white/80 backdrop-blur-md
                   border-b border-black/5"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="HealthTrack Logo"
            width={120}
            height={40}
            priority
            className="h-auto w-auto"
          />
        </div>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
          <Link href="#" className="hover:text-blue-600 transition">
            Home
          </Link>
          <Link href="#about" className="hover:text-blue-600 transition">
            About
          </Link>
          <Link href="#features" className="hover:text-blue-600 transition">
            Features
          </Link>
          <Link href="#faq" className="hover:text-blue-600 transition">
            FAQ
          </Link>
          <Link href="#contact" className="hover:text-blue-600 transition">
            Contact
          </Link>
        </nav>

        {/* Actions Desktop */}
        <div className="hidden md:flex gap-3">
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-lg
                       text-gray-700 border border-gray-300
                       hover:bg-gray-100 transition"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="px-4 py-1.5 rounded-lg
                       bg-blue-600 text-white
                       hover:bg-blue-700 transition"
          >
            Register
          </Link>
        </div>

        {/* Hamburger (Mobile) */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden text-gray-700"
        >
          <Menu size={26} />
        </button>
      </div>

      {/* ===== Mobile Menu ===== */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity md:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-white p-6
                      transition-transform duration-300
                      ${open ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button className="mb-6 text-gray-700" onClick={() => setOpen(false)}>
            <X size={24} />
          </button>

          {/* Mobile Nav */}
          <nav className="flex flex-col gap-5 text-gray-700 font-medium">
            <Link href="#" onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href="#about" onClick={() => setOpen(false)}>
              About
            </Link>
            <Link href="#features" onClick={() => setOpen(false)}>
              Features
            </Link>
            <Link href="#faq" onClick={() => setOpen(false)}>
              FAQ
            </Link>
            <Link href="#contact" onClick={() => setOpen(false)}>
              Contact
            </Link>
          </nav>

          {/* Mobile Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg
                         border border-gray-300 text-center"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg
                         bg-blue-600 text-white text-center"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
