import { useEffect, useState } from "react";
import { CreditCard, CheckCircle } from "lucide-react";
import { startOnboarding, getOnboardingStatus } from "../../api/connect";
import "./ConnectOnboarding.css";

// Shows a provider's payout-setup status and a button to start/continue Stripe
// Connect onboarding. Drop this on the profile page so providers can enable
// getting paid. On success Stripe sends them to /connect/return.
function ConnectOnboarding({ justOnboarded = false }) {
  const [status, setStatus] = useState(null); // { hasAccount, onboarded, ... }
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    getOnboardingStatus()
      .then((data) => { if (!ignore) setStatus(data); })
      .catch((err) => {
        console.error("Failed to load payout status:", err);
        if (!ignore) setError("Could not load your payout status.");
      })
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, []);

  const handleStart = async () => {
    setError(null);
    try {
      setIsStarting(true);
      const { url } = await startOnboarding();
      // Send the provider to Stripe's hosted onboarding.
      window.location.href = url;
    } catch (err) {
      console.error("Failed to start onboarding:", err);
      setError(err.response?.data?.error || "Could not start payout setup.");
      setIsStarting(false);
    }
  };

  // While loading, render nothing so no box flashes between the profile header
  // and the tabs. The header shows a small "Checking payout status…" instead.
  if (isLoading) return null;

  // Already fully onboarded: don't render the setup card at all. On refresh this
  // box disappears, and the "Payment verified" checkmark on the profile header
  // becomes the persistent indicator instead. `justOnboarded` lets the caller
  // show a brief confirmation right after returning from Stripe if desired.
  if (status?.onboarded) {
    if (!justOnboarded) return null;
    return (
      <div className="connect-card connect-card-done">
        <CheckCircle size={18} />
        <div>
          <div className="connect-title">Payouts enabled</div>
          <div className="connect-sub">You're all set to receive payments for completed jobs.</div>
        </div>
      </div>
    );
  }

  // Not onboarded (or partially) — show the setup button.
  return (
    <div className="connect-card">
      <div className="connect-card-row">
        <CreditCard size={18} />
        <div>
          <div className="connect-title">Set up payouts</div>
          <div className="connect-sub">
            {status?.hasAccount
              ? "Finish setting up your Stripe account to get paid."
              : "Connect a Stripe account so clients can pay you for completed jobs."}
          </div>
        </div>
      </div>
      {error && <div className="connect-error">{error}</div>}
      <button className="connect-btn" onClick={handleStart} disabled={isStarting}>
        {isStarting ? "Redirecting…" : status?.hasAccount ? "Continue setup" : "Set up payouts"}
      </button>
    </div>
  );
}

export default ConnectOnboarding;
