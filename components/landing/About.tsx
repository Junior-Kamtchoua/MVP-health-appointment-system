import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* TEXT CONTENT (LEFT) */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            About HealthTrack
          </h2>

          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            HealthTrack is dedicated to making healthcare simple and accessible.
            Our platform allows users to easily book, manage, and track their
            medical appointments all in one secure place.
          </p>

          <ul className="mt-8 space-y-4 text-gray-700">
            <li className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold">
                ✓
              </span>
              Easily find and book appointments
            </li>

            <li className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold">
                ✓
              </span>
              Receive automated reminders
            </li>

            <li className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold">
                ✓
              </span>
              Manage your medical history
            </li>
          </ul>

          <button
            className="
              mt-10 px-8 py-4 rounded-full
              bg-green-600 text-white font-semibold
              shadow-lg
              transition-all duration-300
              hover:bg-green-700 hover:scale-105
            "
          >
            Learn More
          </button>
        </div>

        {/* CALENDAR IMAGE (RIGHT) */}
        <div className="flex justify-center">
          <div
            className="
              bg-gray-50
              rounded-3xl
              p-6
              shadow-xl
              ring-1 ring-gray-200
              transition-all duration-300
              hover:shadow-2xl hover:scale-[1.02]
            "
          >
            <Image
              src="/calendar.gif"
              alt="Appointment calendar"
              width={520}
              height={420}
              className="w-full max-w-md rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
