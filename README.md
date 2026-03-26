Health Appointment System — Premium SaaS

A modern, scalable, and production-ready healthcare appointment platform built with Next.js, TypeScript, Supabase, and Stripe.

This project delivers a complete end-to-end booking experience for patients and doctors, including real-time availability, secure authentication, and payment integration.

Features

Authentication & Roles
Secure login & registration (Supabase Auth)
Role-based access:
Patient dashboard
Doctor dashboard
Admin-ready architecture

Smart Booking System
Real-time doctor availability
Interactive calendar (monthly view)
Time slot generation (30 min intervals)
Automatic conflict prevention (no double booking)
Slot grouping (Morning / Afternoon / Evening)

Advanced UX
Multi-step booking flow
Live form validation
Sticky booking summary
Toast notifications system
Smooth scroll between steps
Dark / Light mode toggle

Payments (Stripe)
Secure checkout session
Reservation fee system
Payment confirmation flow
Success page with appointment tracking

Doctor Dashboard
View appointments
Filter (Today / Pending / Completed)
Mark appointments as completed
Real-time stats

Premium UI
Modern SaaS design (glassmorphism + gradients)
Fully responsive (mobile → desktop)
Clean component architecture
High-performance rendering
🛠 Tech Stack
Frontend
Next.js (App Router)
React + TypeScript
Tailwind CSS
Backend
Supabase (Database + Auth)
PostgreSQL
Payments
Stripe API

Key Highlights
Clean architecture (modular & scalable)
Optimized performance (Next.js 16 + Turbopack)
Component-based design
🛡 Secure authentication & data handling
Production-ready patterns
Getting Started

1. Clone the repository
   git clone https://github.com/your-username/health-appointment-system.git
   cd health-appointment-system
2. Install dependencies
   npm install
3. Setup environment variables

Create a .env.local file:

NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

STRIPE_SECRET_KEY=your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key 4. Run the project
npm run dev
