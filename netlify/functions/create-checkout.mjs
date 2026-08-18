import Stripe from "stripe";
import { json, parseJson } from "./_lib/store.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const body = await parseJson(req);

  const required = ["fullName", "email", "phone", "church", "pastor", "tier"];
  for (const field of required) {
    if (!body?.[field]) {
      return json({ error: `Missing required field: ${field}` }, 400);
    }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return json({ error: "STRIPE_SECRET_KEY is not configured." }, 500);
  }

  const tier = body.tier;
  const priceId = tier === "early"
    ? process.env.STRIPE_EARLY_PRICE
    : process.env.STRIPE_REGULAR_PRICE;

  if (!priceId) {
    return json({ error: "Stripe price IDs are not configured." }, 500);
  }

  const siteUrl = process.env.SITE_URL || "https://nnmcouncil.com";

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: body.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        fullName:      body.fullName,
        phone:         body.phone,
        phoneProvider: body.phoneProvider || "",
        phoneGateway:  body.phoneGateway  || "",
        church:        body.church,
        pastor:        body.pastor,
        clergyRole:    body.clergyRole || "",
        address:       body.address    || "",
        cityState:     body.cityState  || "",
        notes:         body.notes      || "",
        tier:          tier
      },
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/register?cancelled=true`
    });

    return json({ checkoutUrl: session.url, url: session.url }, 200);
  } catch (err) {
    console.error("Stripe error:", err.message);
    return json({ error: err.message }, 500);
  }
};

export const config = { path: "/api/create-checkout" };
