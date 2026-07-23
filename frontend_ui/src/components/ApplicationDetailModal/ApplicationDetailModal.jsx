import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Phone, User, Check } from 'lucide-react';
import { updateApplicationStatus } from '../../api/applications';
import { generatePaymentInvoice, getPaymentForListing } from '../../api/payments';
import PaymentModal from '../PaymentModal/PaymentModal';
import './ApplicationDetailModal.css';

// Human-friendly label + color for each application status.
const STATUS_META = {
  PENDING: { label: "Pending", className: "status-pending" },
  ACCEPTED: { label: "Accepted", className: "status-accepted" },
  REJECTED: { label: "Rejected", className: "status-rejected" },
};

// Detailed view of one application (client side). Shows what the applicant
// submitted, a link to their public profile, and Accept/Reject buttons.
// `application` shape: { id, providerId, providerName, listingTitle, phone, message, status }
// `onStatusChange(id, newStatus)` is called after a successful accept/reject.
function ApplicationDetailModal({ application, onClose, onStatusChange }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(application.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paidPaymentId, setPaidPaymentId] = useState(null);
  const [isGettingReceipt, setIsGettingReceipt] = useState(false);

  // On open, check if this listing already has a completed payment. If so, mark
  // it paid so the "View receipt" button persists across sessions (not just
  // right after paying in this session).
  useEffect(() => {
    if (!application.listingId) return;
    let ignore = false;
    getPaymentForListing(application.listingId)
      .then((payment) => {
        if (ignore || !payment) return;
        if (payment.status === "HELD" || payment.status === "RELEASED") {
          setPaid(true);
          setPaidPaymentId(payment.id);
        }
      })
      .catch((err) => console.error("Failed to check payment status:", err));
    return () => { ignore = true; };
  }, [application.listingId]);

  // Generate (or fetch) the receipt invoice, then open its hosted page.
  const handleGetReceipt = async () => {
    if (!paidPaymentId) return;
    try {
      setIsGettingReceipt(true);
      const { invoiceUrl } = await generatePaymentInvoice(paidPaymentId);
      if (invoiceUrl) window.open(invoiceUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to get receipt:", err);
      setError("Could not generate the receipt.");
    } finally {
      setIsGettingReceipt(false);
    }
  };

  const meta = STATUS_META[status] ?? STATUS_META.PENDING;
  const isDecided = status === "ACCEPTED" || status === "REJECTED";

  const decide = async (newStatus) => {
    setError(null);
    try {
      setIsUpdating(true);
      await updateApplicationStatus(application.id, newStatus);
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(application.id, newStatus);
    } catch (err) {
      console.error("Failed to update application:", err);
      setError(err.response?.data?.error || "Could not update the application.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="app-detail-bg" onClick={onClose}>
      <div className="app-detail" onClick={(e) => e.stopPropagation()}>
        <div className="app-detail-header">
          <div>
            <div className="app-detail-title">Application</div>
            <div className="app-detail-sub">Applied to: {application.listingTitle}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>

        {/* Applicant summary + status */}
        <div className="app-detail-applicant">
          <div>
            <div className="app-detail-name">{application.providerName || "Applicant"}</div>
            {application.phone && (
              <div className="app-detail-phone">
                <Phone size={12} />
                {application.phone}
              </div>
            )}
          </div>
          <span className={`app-status ${meta.className}`}>{meta.label}</span>
        </div>

        {/* Their message */}
        <div className="app-detail-section">
          <div className="app-detail-label">Message</div>
          <p className="app-detail-message">
            {application.message || "No message provided."}
          </p>
        </div>

        {/* Link to their public profile */}
        {application.providerId && (
          <button
            className="app-detail-profile-btn"
            onClick={() => navigate(`/users/${application.providerId}`)}
          >
            <User size={14} />
            View applicant's profile
          </button>
        )}

        {error && <div className="app-detail-error">{error}</div>}

        {/* Accept / Reject — hidden once a decision is made */}
        {!isDecided ? (
          <div className="app-detail-actions">
            <button
              className="app-btn app-btn-reject"
              onClick={() => decide("REJECTED")}
              disabled={isUpdating}
            >
              Reject
            </button>
            <button
              className="app-btn app-btn-accept"
              onClick={() => decide("ACCEPTED")}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving…" : "Accept"}
            </button>
          </div>
        ) : (
          <div className="app-detail-decided">
            This application has been <strong>{meta.label.toLowerCase()}</strong>.
            {/* Once accepted, the client can pay this provider (funds are held
                until the job is marked completed). */}
            {status === "ACCEPTED" && (
              paid ? (
                <>
                  <div className="app-detail-paid"><Check size={13} /> Payment sent and held until you mark the job completed.</div>
                  <button
                    className="app-detail-profile-btn"
                    onClick={handleGetReceipt}
                    disabled={isGettingReceipt}
                    style={{ marginTop: 10 }}
                  >
                    {isGettingReceipt ? "Preparing receipt…" : "View receipt"}
                  </button>
                </>
              ) : (
                <button
                  className="app-btn app-btn-pay"
                  onClick={() => setShowPayment(true)}
                >
                  Pay {application.providerName || "provider"}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          applicationId={application.id}
          providerName={application.providerName}
          onPaid={(paymentId) => { setPaid(true); setPaidPaymentId(paymentId); setShowPayment(false); }}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}

export default ApplicationDetailModal;
