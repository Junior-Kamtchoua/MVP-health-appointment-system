# Health Appointment System

## Description

**Health Appointment System** is a modern web application for booking medical appointments. It allows patients, doctors, and administrators to interact through dedicated dashboards, with secure authentication and role-based access control driven by the user’s email/profile.

The main goal is to simplify medical appointment scheduling while providing a smooth, secure, and intuitive user experience.

---

## Key Features

### User Flow

- **Landing Page**: entry point of the application
- **Register Page**: user account creation
- **Email Confirmation**: mandatory email verification
- **Login Page**: secure authentication
- **Smart role-based redirection**:

  - 👤 User Page (Patient)
  - 🩺 Doctor Page (Doctor)
  - 🛠️ Admin Page (Administrator)

### Authentication & Security

- Authentication powered by **Supabase Auth**
- Mandatory email confirmation before access
- Role management based on email / user profile
- Protected routes on the frontend

### Payments (if enabled)

- **Stripe** integration for appointment payments

---

## Application Flow Diagram

The global navigation flow is as follows:

1. **Landing Page** (starting point)
2. Two possible actions:

   - Navigate to **Login Page**
   - Navigate to **Register Page**

3. From **Register Page** → email confirmation → redirect to **Login Page**
4. After successful authentication:

   - Redirect to **User Page**, **Doctor Page**, or **Admin Page** depending on the user role

_(See the visual diagram included in the project)_

---

## Tech Stack

### Frontend

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**

### Backend & Services

- **Supabase** (Authentication, Database, Storage)
- **Stripe** (Payments)

### Deployment

- **Vercel**

---

## Project Structure (simplified)

```
/app
  ├── page.tsx           # Landing Page
  ├── login/             # Login Page
  ├── register/          # Register Page
  ├── user/              # User Dashboard
  ├── doctor/            # Doctor Dashboard
  ├── admin/             # Admin Dashboard
/lib
  ├── supabaseClient.ts  # Supabase configuration
```

---

## Local Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/health-appointment-system.git
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_key
```

4. Run the project

```bash
npm run dev
```

---

## Future Improvements

- Email & SMS notifications
- Advanced doctor availability management
- Analytics dashboard (Admin)
- Appointment history
- Telemedicine / video consultation

---

## Author

**Junior Kamchoua**
Full Stack Developer
📍 Next.js • Supabase • TypeScript • AWS

---

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute it.
