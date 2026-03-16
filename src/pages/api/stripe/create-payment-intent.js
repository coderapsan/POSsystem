import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, currency = "gbp", orderId, customerEmail, customerName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses smallest currency unit (pence for GBP)
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId || "",
        customerName: customerName || "",
      },
      receipt_email: customerEmail || null,
      description: `Order #${orderId || "Unknown"} - Four Dreams Restaurant`,
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Stripe PaymentIntent error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create payment intent",
    });
  }
}
