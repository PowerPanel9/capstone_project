import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { X } from "lucide-react";
import { createPaymentIntent } from "../../api/payments";
import "./PaymentModal.css";

// Load Stripe.js once with the publishable key (safe to expose on the frontend).
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// The inner form — must live inside <Elements> so the Stripe hooks work.
function CheckoutForm({ amount, providerName, onPaid, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe.js still loading
    setError(null);
    setIsPaying(true);

    // Confirm the payment. Funds are HELD on the platform (no transfer yet).
    // redirect: "if_required" keeps the user on our page for card payments.
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed. Please try again.");
      setIsPaying(false);
    } else {
      // Success. The webhook flips the payment to HELD server-side.
      onPaid();
    }
  };

  const dollars = (amount / 100).toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="pay-form">
      <p className="pay-amount">
        Paying <strong>${dollars}</strong>
        {providerName ? ` to ${providerName}` : ""}
      </p>
      <PaymentElement />
      {error && <div className="pay-error">{error}</div>}
      <button className="pay-submit" type="submit" disabled={!stripe || isPaying}>
        {isPaying ? "Processing…" : `Pay $${dollars}`}
      </button>
      <button type="button" className="pay-cancel" onClick={onClose} disabled={isPaying}>
        Cancel
      </button>
    </form>
  );
}

// Modal that creates a held PaymentIntent for an accepted application and shows
// the Stripe Payment Element. `applicationId` is required; `providerName` is
// just for display. Calls `onPaid()` when the payment succeeds.
function PaymentModal({ applicationId, providerName, onPaid, onClose }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [amount, setAmount] = useState(0);
  const [paymentId, setPaymentId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let ignore = false;
    createPaymentIntent(applicationId)
      .then((data) => {
        if (ignore) return;
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setPaymentId(data.paymentId);
      })
      .catch((err) => {
        console.error("Failed to start payment:", err);
        if (!ignore) setLoadError(err.response?.data?.error || "Could not start payment.");
      });
    return () => { ignore = true; };
  }, [applicationId]);

  return (
    <div className="pay-bg" onClick={onClose}>
      <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pay-header">
          <div className="pay-title">Payment</div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>

        {loadError && <div className="pay-error">{loadError}</div>}

        {!clientSecret && !loadError && <p className="pay-loading">Preparing checkout…</p>}

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              amount={amount}
              providerName={providerName}
              onPaid={() => onPaid(paymentId)}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
