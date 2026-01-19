import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
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

    // 🛑 Sécurité minimale (évite crash en prod)
    if (
      !patient_email ||
      !doctor_email ||
      !appointment_date ||
      !appointment_time ||
      !status
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ================= PATIENT EMAIL ================= */

    await sendEmail({
      to: patient_email,
      subject: "Your appointment is completed",
      html: `
        <p>Hello ${patient_name ?? "Patient"},</p>

        <p>
          Your appointment with <strong>Dr. ${doctor_name}</strong> has been
          <strong style="color: green;"> completed</strong>.
        </p>

        <p>
          <strong>Date:</strong> ${appointment_date}<br />
          <strong>Time:</strong> ${appointment_time}
        </p>

        <p>Thank you for trusting our health platform.</p>
      `,
    });

    /* ================= DOCTOR EMAIL ================= */

    await sendEmail({
      to: doctor_email,
      subject: "Appointment completed",
      html: `
        <p>Hello Dr. ${doctor_name},</p>

        <p>
          You have successfully marked the following appointment as
          <strong style="color: green;"> completed</strong>.
        </p>

        <p>
          <strong>Patient:</strong> ${patient_name ?? "Unknown"}<br />
          <strong>Date:</strong> ${appointment_date}<br />
          <strong>Time:</strong> ${appointment_time}
        </p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email notification error:", error);

    return NextResponse.json(
      { error: "Failed to send notification emails" },
      { status: 500 }
    );
  }
}
