import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Supabase admin (service role) — backend uniquement
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  // ✅ Paiement confirmé par Stripe
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const appointmentId = session.metadata?.appointment_id;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointment_id" },
        { status: 400 }
      );
    }

    // 🔁 Mettre la réservation à "paid" et récupérer les infos
    // 🔁 Mettre la réservation à "paid" et récupérer les infos
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ status: "paid" })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: "Failed to update appointment" },
        { status: 500 }
      );
    }

    // 💾 Enregistrer le paiement dans la table payments
    await supabase.from("payments").insert({
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

    // 📧 Email automatique après paiement
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/appointments/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_email: appointment.patient_email,
        patient_name: appointment.patient_name,
        doctor_email: appointment.doctor_email,
        doctor_name: appointment.doctor_name,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        status: "paid",
      }),
    });
  }

  return NextResponse.json({ received: true });
}
