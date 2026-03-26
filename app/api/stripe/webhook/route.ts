import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/* ================= STRIPE ================= */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/* ================= SUPABASE ADMIN ================= */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/* ================= HELPERS ================= */

async function sendNotificationEmail(payload: {
  patient_email: string | null;
  patient_name: string | null;
  doctor_email: string | null;
  doctor_name: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
}) {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) return;

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/appointments/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Notification fetch error:", error);
  }
}

/* ================= POST ================= */

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("Invalid webhook signature:", err);

      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 },
      );
    }

    /* ======================================================
       ✅ PAYMENT CONFIRMED
    ====================================================== */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointment_id;

      if (!appointmentId) {
        return NextResponse.json(
          { error: "Missing appointment_id" },
          { status: 400 },
        );
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select(
          `
            id,
            patient_id,
            patient_name,
            patient_email,
            doctor_email,
            appointment_date,
            appointment_time,
            status
          `,
        )
        .eq("id", appointmentId)
        .single();

      if (appointmentError || !appointment) {
        console.error("Failed to load appointment:", appointmentError);

        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      }

      /* Idempotency: if already paid, do not duplicate work */
      if (appointment.status !== "paid") {
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ status: "paid" })
          .eq("id", appointmentId);

        if (updateError) {
          console.error("Failed to update appointment:", updateError);

          return NextResponse.json(
            { error: "Failed to update appointment" },
            { status: 500 },
          );
        }
      }

      /* Avoid duplicate payment insert */
      const { data: existingPayment, error: existingPaymentError } =
        await supabase
          .from("payments")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

      if (existingPaymentError) {
        console.error(
          "Failed to check existing payment:",
          existingPaymentError,
        );

        return NextResponse.json(
          { error: "Failed to verify payment record" },
          { status: 500 },
        );
      }

      if (!existingPayment) {
        const { error: paymentInsertError } = await supabase
          .from("payments")
          .insert({
            appointment_id: appointment.id,
            user_id: appointment.patient_id,
            stripe_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            amount_cents: session.amount_total ?? 500,
            currency: session.currency ?? "usd",
            status: "paid",
          });

        if (paymentInsertError) {
          console.error("Failed to insert payment:", paymentInsertError);

          return NextResponse.json(
            { error: "Failed to record payment" },
            { status: 500 },
          );
        }
      }

      const { data: doctorData } = await supabase
        .from("doctors")
        .select("full_name")
        .eq("email", appointment.doctor_email)
        .maybeSingle();

      await sendNotificationEmail({
        patient_email: appointment.patient_email,
        patient_name: appointment.patient_name,
        doctor_email: appointment.doctor_email,
        doctor_name: doctorData?.full_name ?? null,
        appointment_date: appointment.appointment_date,
        appointment_time: String(appointment.appointment_time).slice(0, 5),
        status: "paid",
      });
    }

    /* ======================================================
       ❌ PAYMENT SESSION EXPIRED
    ====================================================== */
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointment_id;

      if (!appointmentId) {
        return NextResponse.json(
          { error: "Missing appointment_id" },
          { status: 400 },
        );
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select("id, status")
        .eq("id", appointmentId)
        .single();

      if (appointmentError || !appointment) {
        console.error(
          "Failed to load appointment for expiration:",
          appointmentError,
        );

        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      }

      if (appointment.status !== "paid" && appointment.status !== "completed") {
        const { error: expireError } = await supabase
          .from("appointments")
          .update({ status: "expired" })
          .eq("id", appointmentId);

        if (expireError) {
          console.error("Failed to expire appointment:", expireError);

          return NextResponse.json(
            { error: "Failed to expire appointment" },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
