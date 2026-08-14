import Stripe from "stripe";
import { addRegistration } from "./_lib/store.mjs";

// ─── STRIPE WEBHOOK ───────────────────────────────────────────────────────────
// Set in Netlify env vars:
// STRIPE_WEBHOOK_SECRET = whsec_...  (get from Stripe Dashboard → Webhooks)

export default async (req) => {
  const sig     = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const meta    = session.metadata || {};

    await addRegistration({
      id:         session.id,
      createdAt:  new Date().toISOString(),
      fullName:   meta.fullName   || "",
      email:      session.customer_email || "",
      phone:      meta.phone      || "",
      carrier:    meta.carrier    || "",
      church:     meta.church     || "",
      pastor:     meta.pastor     || "",
      clergyRole: meta.clergyRole || "",
      address:    meta.address    || "",
      cityState:  meta.cityState  || "",
      notes:      meta.notes      || "",
      tier:       meta.tier       || "",
      amount:     session.amount_total / 100,
      status:     "paid",
      stripeSessionId: session.id,
    });

    console.log("Registration saved for:", meta.fullName);
  }

  return new Response("ok", { status: 200 });
};

export const config = { path: "/api/stripe-webhook" };
