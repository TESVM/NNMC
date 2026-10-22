import Stripe from "stripe";

export function receiptHandler(makeStripe = key => new Stripe(key)) {
  return async req => {
    const respond = (data, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }
    });
    if (req.method !== "GET") return respond({ error: "Method not allowed" }, 405);
    const id = new URL(req.url).searchParams.get("session_id");
    if (!id || !/^cs_(test_|live_)?[a-zA-Z0-9]+$/.test(id)) return respond({ error: "Please open the confirmation link provided after checkout." }, 400);
    if (!process.env.STRIPE_SECRET_KEY) return respond({ error: "We cannot retrieve your receipt right now. Please try again later. Do not pay again." }, 503);
    try {
      const session = await makeStripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(id, { expand: ["payment_intent.latest_charge"] });
      if (session.status !== "complete" || session.payment_status !== "paid") {
        return respond({ paid: false, message: "Your payment has not yet been confirmed. Refresh this page shortly. Do not pay again." });
      }
      const charge = session.payment_intent?.latest_charge;
      const receiptUrl = typeof charge === "object" ? charge?.receipt_url : null;
      return respond({ paid: true, name: session.metadata?.fullName || session.customer_details?.name || "", amount: session.amount_total, currency: session.currency, reference: session.id, receiptUrl: receiptUrl && new URL(receiptUrl).origin === "https://pay.stripe.com" ? receiptUrl : null });
    } catch (err) {
      return respond({ error: err.code === "resource_missing" ? "This checkout could not be found. Check your confirmation link or contact the council. Do not pay again." : "We cannot retrieve your receipt right now. Please try again later. Do not pay again." }, err.code === "resource_missing" ? 404 : 502);
    }
  };
}
export default receiptHandler();
export const config = { path: "/api/checkout-receipt" };
