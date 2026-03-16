import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID required" });
    }

    // Retrieve the payment intent to verify its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const isSuccessful = paymentIntent.status === "succeeded";

    res.status(200).json({
      success: true,
      verified: isSuccessful,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error("Stripe verification error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify payment",
    });
  }
}
