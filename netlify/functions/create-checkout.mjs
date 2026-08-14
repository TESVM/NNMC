import Stripe from "stripe";
import { json, parseJson } from "./_lib/store.mjs";

// ─── STRIPE CONFIG ────────────────────────────────────────────────────────────
// Set these in Netlify → Site configuration → Environment variables
// STRIPE_SECRET_KEY   = sk_live_...
// STRIPE_EARLY_PRICE  = price_...  ($25 early bird)
// STRIPE_REGULAR_PRICE= price_...  ($35 regular)
// SITE_URL            = https://nnmcouncil.com

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = await parseJson(req);

  // Validate required fields
  const required = ["fullName", "email", "phone", "church", "pastor", "tier"];
  for (const field of required) {
    if (!body?.[field]) {
      return json({ error: `Missing required field: ${field}` }, 400);
    }
  }

  const tier = body.tier; // "early" or "regular"
  const priceId =
    tier === "early"
      ? process.env.STRIPE_EARLY_PRICE
      : process.env.STRIPE_REGULAR_PRICE;

  if (!priceId) {
    return json(
      { error: "Stripe price IDs are not configured. Set STRIPE_EARLY_PRICE and STRIPE_REGULAR_PRICE in Netlify environment variables." },
      500
    );
  }

  const siteUrl = process.env.SITE_URL || "https://nnmcouncil.com";

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: body.email,
      line_items: [{ price: priceId, quantity: 1 }],
      // Pass registration data so webhook can save it after payment
      metadata: {
        fullName:   body.fullName,
        phone:      body.phone,
        church:     body.church,
        pastor:     body.pastor,
        clergyRole: body.clergyRole  || "",
        carrier:    body.carrier     || "",
        address:    body.address     || "",
        cityState:  body.cityState   || "",
        notes:      body.notes       || "",
        tier:       tier,
      },
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/register?cancelled=true`,
    });

    return json({ url: session.url }, 200);
  } catch (err) {
    console.error("Stripe error:", err.message);
    return json({ error: err.message }, 500);
  }
};

export const config = { path: "/api/create-checkout" };
