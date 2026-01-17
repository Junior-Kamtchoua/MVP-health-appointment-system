"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How do I book an appointment?",
    answer:
      "You can book an appointment by creating an account, logging in, and selecting an available time slot from the booking page.",
  },
  {
    question: "Can I reschedule or cancel an appointment?",
    answer:
      "Yes, you can reschedule or cancel appointments from your dashboard as long as it is within the allowed time window.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Yes. HealthTrack uses modern security standards and encryption to protect your personal and medical data.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="relative py-24 bg-linear-to-b from-blue-50 to-white block"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 flex items-center justify-center gap-3">
          <span className="text-blue-500">💬</span>
          Frequently Asked Questions
        </h2>

        {/* FAQ list */}
        <div className="mt-14 space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md border border-blue-100 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between px-8 py-6 text-left
                           text-blue-900 font-medium text-lg
                           cursor-pointer
                           transition-colors duration-300
                           hover:bg-blue-50"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 font-bold">
                    ✓
                  </span>
                  {faq.question}
                </div>

                <span className="text-2xl text-blue-400">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-8 pb-6 text-blue-700 text-base leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
