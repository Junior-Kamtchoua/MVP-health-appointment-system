import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/* ================= STRIPE ================= */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/* ================= POST ================= */

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();

    /* 🔐 AUTH CHECK */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointmentId" },
        { status: 400 },
      );
    }

    /* 🔍 VERIFY APPOINTMENT */
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, patient_id, status")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    /* 🔒 SECURITY */
    if (appointment.patient_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (appointment.status === "paid") {
      return NextResponse.json(
        { error: "Appointment already paid" },
        { status: 400 },
      );
    }

    /* 💳 CREATE SESSION */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Appointment reservation",
            },
            unit_amount: 500,
          },
          quantity: 1,
        },
      ],

      metadata: {
        appointment_id: appointmentId,
        user_id: user.id,
      },

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?appointmentId=${appointmentId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/user`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Stripe checkout error" },
      { status: 500 },
    );
  }
}
