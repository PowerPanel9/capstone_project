import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOnboardingStatus } from "../../api/connect";

// Landing page Stripe redirects to after onboarding (return_url).
// It re-checks status and tells the provider whether they're all set.
function ConnectReturn() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Checking your payout setup…");

  useEffect(() => {
    let ignore = false;
    getOnboardingStatus()
      .then((data) => {
        if (ignore) return;
        if (data.onboarded) {
          // Flag so the profile shows the "Payouts enabled" box ONCE. The
          // profile clears this, so a later refresh hides the box and the
          // header "Payment verified" checkmark becomes the indicator.
          sessionStorage.setItem("justOnboarded", "true");
        }
        setMessage(
          data.onboarded
            ? "✅ Payouts enabled! You can now receive payments for completed jobs."
            : "Your setup isn't complete yet. You can finish it anytime from your profile."
        );
      })
      .catch(() => { if (!ignore) setMessage("Could not verify your payout setup."); });
    return () => { ignore = true; };
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", padding: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1E2340", marginBottom: 12 }}>
        Payout Setup
      </h1>
      <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 24 }}>{message}</p>
      <button
        onClick={() => navigate("/user/profile")}
        style={{
          background: "var(--primary, #7B8FC8)", color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
      >
        Back to my profile
      </button>
    </div>
  );
}

export default ConnectReturn;
