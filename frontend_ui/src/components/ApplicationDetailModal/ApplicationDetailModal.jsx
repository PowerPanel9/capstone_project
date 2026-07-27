import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Phone, User, Check, Sparkles, CheckCircle, MessageCircle } from 'lucide-react';
import { updateApplicationStatus } from '../../api/applications';
import { updateListing } from '../../api/listings';
import { generatePaymentInvoice, getPaymentForListing, releasePayment } from '../../api/payments';
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
// May also include AI ranking info when opened from the AI-sorted list:
// { aiRank: number, aiReason: string }
// `onStatusChange(id, newStatus)` is called after a successful accept/reject.
// `onCompleted(listingId)` is called after the job is marked completed, so the
// parent can grey out the listing.
function ApplicationDetailModal({ application, onClose, onStatusChange, onCompleted, onMessage }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(application.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paidPaymentId, setPaidPaymentId] = useState(null);
  const [isGettingReceipt, setIsGettingReceipt] = useState(false);
  // Tracks the listing's completion state inside the modal so the UI can switch
  // from "Mark as Completed" to a "completed" confirmation without a reload.
  const [isCompleted, setIsCompleted] = useState(application.listingStatus === "COMPLETED");
  const [isCompleting, setIsCompleting] = useState(false);

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

  // Mark the job completed. This flips the listing to COMPLETED and releases the
  // held payment to the provider (the money the client paid is held until now).
  const handleMarkCompleted = async () => {
    if (!application.listingId) return;
    setError(null);
    try {
      setIsCompleting(true);
      await updateListing(application.listingId, { status: "COMPLETED" });

      // Release the held funds to the provider. Don't undo completion if this
      // fails — just log it; the payout can be retried later.
      try {
        if (paidPaymentId) {
          await releasePayment(paidPaymentId);
        }
      } catch (payErr) {
        console.error("Job completed, but releasing payment failed:", payErr);
      }

      setIsCompleted(true);
      if (onCompleted) onCompleted(application.listingId);
    } catch (err) {
      console.error("Failed to mark job completed:", err);
      setError(err.response?.data?.error || "Could not mark the job completed.");
    } finally {
      setIsCompleting(false);
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

        {/* AI ranking insight — only when opened from the AI-sorted list */}
        {application.aiReason && (
          <div className="app-detail-ai">
            <div className="app-detail-ai-head">
              <Sparkles size={13} />
              AI match
              {application.aiRank && (
                <span className="app-detail-ai-rank">#{application.aiRank} best fit</span>
              )}
            </div>
            <p className="app-detail-ai-reason">{application.aiReason}</p>
          </div>
        )}

        {/* Their message */}
        <div className="app-detail-section">
          <div className="app-detail-label">Message</div>
          <p className="app-detail-message">
            {application.message || "No message provided."}
          </p>
        </div>

        {/* Link to their public profile + direct message */}
        {application.providerId && (
          <div className="app-detail-profile-actions">
            <button
              className="app-detail-profile-btn"
              onClick={() => navigate(`/users/${application.providerId}`)}
            >
              <User size={14} />
              View applicant's profile
            </button>

            {onMessage && (
              <button className="app-detail-profile-btn" onClick={onMessage}>
                <MessageCircle size={14} />
                Message {application.providerName || "applicant"}
              </button>
            )}
          </div>
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
                  {isCompleted ? (
                    <div className="app-detail-paid">
                      <CheckCircle size={13} /> This job is completed. Payment released to the provider.
                    </div>
                  ) : (
                    <div className="app-detail-paid">
                      <Check size={13} /> Payment sent and held until you mark the job completed.
                    </div>
                  )}
                  {/* Actions stacked vertically so they don't collide. */}
                  <div className="app-detail-stack">
                    {!isCompleted && (
                      <button
                        className="app-btn app-btn-accept"
                        onClick={handleMarkCompleted}
                        disabled={isCompleting}
                      >
                        {isCompleting ? "Completing…" : "Mark as Completed"}
                      </button>
                    )}
                    <button
                      className="app-btn app-btn-outline"
                      onClick={handleGetReceipt}
                      disabled={isGettingReceipt}
                    >
                      {isGettingReceipt ? "Preparing receipt…" : "View receipt"}
                    </button>
                  </div>
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
