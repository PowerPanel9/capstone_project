import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, DollarSign, Tag, User, ExternalLink, Star, MessageCircle } from 'lucide-react';
import { withdrawApplication } from '../../api/applications';
// Reuse the client-side modal styles (.app-detail-*, .app-status, .app-btn),
// then layer a few provider-specific tweaks on top.
import '../ApplicationDetailModal/ApplicationDetailModal.css';
import './ProviderApplicationModal.css';

// Human-friendly label + color class for each application status.
const STATUS_META = {
  PENDING: { label: "Pending", className: "status-pending" },
  ACCEPTED: { label: "Accepted", className: "status-accepted" },
  REJECTED: { label: "Rejected", className: "status-rejected" },
  PAID: { label: "Paid", className: "status-paid" },
};

// Detailed view of one application (PROVIDER side). Shows the listing the
// provider applied to, the message they sent, who posted it, and quick links
// to the full listing and the client's profile.
//
// `application` shape (built in UserProfileView):
//   { id, title, status, message, listingId, listingStatus,
//     location, price, category, clientId, clientName }
//
// Props:
//   onClose         - close the modal
//   onWithdrawn(id) - called after the application is successfully withdrawn
//   onLeaveReview(clientId) - open the reviews panel for the client
function ProviderApplicationModal({ application, onClose, onWithdrawn, onLeaveReview, onMessage }) {
  const navigate = useNavigate();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState(null);

  // The provider can review the client once the job is finished.
  const jobCompleted = application.listingStatus === "COMPLETED";

  // Once the client has paid AND marked the job completed, show "Paid" instead
  // of "Accepted" on the provider's side.
  const displayStatus = jobCompleted && application.status === "ACCEPTED"
    ? "PAID"
    : application.status;
  const meta = STATUS_META[displayStatus] ?? STATUS_META.PENDING;

  // Only pending applications can be withdrawn (you can't withdraw once you've
  // been accepted or rejected).
  const canWithdraw = application.status === "PENDING";

  const handleWithdraw = async () => {
    setError(null);
    try {
      setIsWithdrawing(true);
      await withdrawApplication(application.id);
      if (onWithdrawn) onWithdrawn(application.id);
    } catch (err) {
      console.error("Failed to withdraw application:", err);
      setError(err.response?.data?.error || "Could not withdraw the application.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Format the listing price like "$45" (price comes back as a Decimal string).
  const rate = application.price !== undefined && application.price !== null
    ? `$${Number(application.price)}`
    : null;

  return (
    <div className="app-detail-bg" onClick={onClose}>
      <div className="app-detail" onClick={(e) => e.stopPropagation()}>
        <div className="app-detail-header">
          <div>
            <div className="app-detail-title">Application</div>
            <div className="app-detail-sub">Applied to: {application.title}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>

        {/* Listing title + your application status */}
        <div className="app-detail-applicant">
          <div className="app-detail-name">{application.title}</div>
          <span className={`app-status ${meta.className}`}>{meta.label}</span>
        </div>

        {/* Listing details: location, rate, category */}
        <div className="pam-details">
          {application.location && (
            <div className="pam-detail">
              <MapPin size={14} />
              {application.location}
            </div>
          )}
          {rate && (
            <div className="pam-detail">
              <DollarSign size={14} />
              {rate}
            </div>
          )}
          {application.category && (
            <div className="pam-detail">
              <Tag size={14} />
              {application.category}
            </div>
          )}
        </div>

        {/* The message the provider sent when applying */}
        <div className="app-detail-section">
          <div className="app-detail-label">Your message</div>
          <p className="app-detail-message">
            {application.message || "No message provided."}
          </p>
        </div>

        {/* Who posted the listing */}
        {application.clientName && (
          <div className="app-detail-section">
            <div className="app-detail-label">Posted by</div>
            <p className="app-detail-message">{application.clientName}</p>
          </div>
        )}

        {error && <div className="app-detail-error">{error}</div>}

        {/* Primary actions: view the full listing / view the client's profile */}
        <div className="pam-actions">
          {application.listingId && (
            <button
              className="app-detail-profile-btn pam-action"
              onClick={() => navigate(`/listing/${application.listingId}`)}
            >
              <ExternalLink size={18} />
              View Listing
            </button>
          )}
          {application.clientId && (
            <button
              className="app-detail-profile-btn pam-action"
              onClick={() => navigate(`/users/${application.clientId}`)}
            >
              <User size={18} />
              View Client Profile
            </button>
          )}
          {application.clientId && onMessage && (
            <button
              className="app-detail-profile-btn pam-action"
              onClick={onMessage}
            >
              <MessageCircle size={18} />
              Message Client
            </button>
          )}
        </div>

        {/* Job finished -> invite the provider to review the client */}
        {jobCompleted && application.clientId && (
          <div className="pam-review">
            <div className="app-detail-paid">
              <Star size={14} />
              This job is completed — leave the client a review.
            </div>
            <button
              className="app-btn app-btn-pay"
              onClick={() => onLeaveReview(application.clientId)}
            >
              Leave a Review
            </button>
          </div>
        )}

        {/* Withdraw — only while the application is still pending */}
        {canWithdraw && (
          <button
            className="app-btn app-btn-reject pam-withdraw"
            onClick={handleWithdraw}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? "Withdrawing…" : "Withdraw Application"}
          </button>
        )}
      </div>
    </div>
  );
}

export default ProviderApplicationModal;
