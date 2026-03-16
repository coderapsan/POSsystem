import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#e2e8f0",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      backgroundColor: "#10172d",
      "::placeholder": {
        color: "#64748b",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
  hidePostalCode: true,
};

export default function StripeCardForm({ 
  amount, 
  orderId, 
  customerName,
  customerEmail,
  onPaymentSuccess, 
  onPaymentError,
  className = "" 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentReady, setPaymentReady] = useState(false);

  // Create payment intent when component mounts or amount changes
  React.useEffect(() => {
    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "gbp",
          orderId,
          customerName,
          customerEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClientSecret(data.clientSecret);
        setPaymentReady(true);
      } else {
        setError(data.error || "Failed to initialize payment");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Payment intent error:", err);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!clientSecret) {
      setError("Payment not initialized. Please refresh.");
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName || "Customer",
              email: customerEmail || undefined,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        if (onPaymentError) {
          onPaymentError(stripeError);
        }
      } else if (paymentIntent.status === "succeeded") {
        setProcessing(false);
        if (onPaymentSuccess) {
          onPaymentSuccess({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentMethod: paymentIntent.payment_method,
          });
        }
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
      setProcessing(false);
      console.error("Payment error:", err);
      if (onPaymentError) {
        onPaymentError(err);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Card Details
        </label>
        <div className="rounded-lg border border-white/10 bg-[#10172d] p-3">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs text-green-200">
        <div className="flex items-start gap-2">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <p className="font-semibold">Secure Payment by Stripe</p>
            <p className="mt-1 text-green-300/80">
              Your payment is processed securely by Stripe. We never see or store your card details.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !paymentReady}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${
          processing || !paymentReady
            ? "cursor-not-allowed bg-slate-600"
            : "bg-[#f26b30] hover:bg-[#ff7a3e] shadow-lg shadow-[#f26b30]/30"
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
            Processing...
          </span>
        ) : !paymentReady ? (
          "Initializing payment..."
        ) : (
          `Pay £${amount.toFixed(2)}`
        )}
      </button>
    </form>
  );
}
