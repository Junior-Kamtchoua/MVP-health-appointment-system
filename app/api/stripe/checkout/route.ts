import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId } = body;

    // Sécurité minimale
    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointmentId" },
        { status: 400 }
      );
    }

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
            unit_amount: 500, // 5.00 USD
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointment_id: appointmentId, // 🔑 lien Stripe ↔ réservation
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/user/appointments`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/user`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Stripe checkout error" },
      { status: 500 }
    );
  }
}
