import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    patient_email,
    patient_name,
    doctor_email,
    doctor_name,
    appointment_date,
    appointment_time,
    status,
  } = body;

  // 📩 Patient email
  await sendEmail({
    to: patient_email,
    subject: "Your appointment update",
    html: `
      <p>Hello ${patient_name},</p>
      <p>Your appointment with <strong>${doctor_name}</strong> is now <strong>${status}</strong>.</p>
      <p><strong>Date:</strong> ${appointment_date}</p>
      <p><strong>Time:</strong> ${appointment_time}</p>
    `,
  });

  // 📩 Doctor email
  await sendEmail({
    to: doctor_email,
    subject: "New appointment update",
    html: `
      <p>Hello Doctor,</p>
      <p>You have an appointment <strong>${status}</strong>.</p>
      <p><strong>Patient:</strong> ${patient_name}</p>
      <p><strong>Date:</strong> ${appointment_date}</p>
      <p><strong>Time:</strong> ${appointment_time}</p>
    `,
  });

  return NextResponse.json({ success: true });
}
