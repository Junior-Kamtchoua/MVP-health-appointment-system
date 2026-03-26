import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

/* ================= HELPERS ================= */

const statusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "pending";
    case "accepted":
      return "accepted";
    case "rejected":
      return "rejected";
    case "completed":
      return "completed";
    case "paid":
      return "paid";
    default:
      return status;
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case "accepted":
    case "completed":
    case "paid":
      return "green";
    case "rejected":
      return "red";
    case "pending":
      return "orange";
    default:
      return "black";
  }
};

/* ================= POST ================= */

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

    if (
      !patient_email ||
      !doctor_email ||
      !appointment_date ||
      !appointment_time ||
      !status
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const safePatientName = patient_name ?? "Patient";
    const safeDoctorName = doctor_name ?? "Doctor";
    const safeStatus = statusLabel(status);
    const color = statusColor(status);

    await Promise.all([
      sendEmail({
        to: patient_email,
        subject: `Your appointment is ${safeStatus}`,
        html: `
          <p>Hello ${safePatientName},</p>

          <p>
            Your appointment with <strong>Dr. ${safeDoctorName}</strong> is now
            <strong style="color: ${color};">${safeStatus}</strong>.
          </p>

          <p>
            <strong>Date:</strong> ${appointment_date}<br />
            <strong>Time:</strong> ${appointment_time}
          </p>

          <p>Thank you for trusting our health platform.</p>
        `,
      }),

      sendEmail({
        to: doctor_email,
        subject: `Appointment ${safeStatus}`,
        html: `
          <p>Hello Dr. ${safeDoctorName},</p>

          <p>
            The following appointment is now
            <strong style="color: ${color};">${safeStatus}</strong>.
          </p>

          <p>
            <strong>Patient:</strong> ${safePatientName}<br />
            <strong>Date:</strong> ${appointment_date}<br />
            <strong>Time:</strong> ${appointment_time}
          </p>
        `,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email notification error:", error);

    return NextResponse.json(
      { error: "Failed to send notification emails" },
      { status: 500 },
    );
  }
}
