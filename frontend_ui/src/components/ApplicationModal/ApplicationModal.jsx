import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { applyToListing } from '../../api/applications';
import './ApplicationModal.css';

// Simple application form. The applicant is the logged-in user (name shown from
// their account), and they provide a phone + short message. On submit it saves
// an application linked to this listing.
function ApplicationModal({ listing, currentUser, onClose, onSuccess }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const firstName = currentUser?.firstName ?? "";
  const lastName = currentUser?.lastName ?? "";

  const handleSubmit = async () => {
    setError(null);
    if (!listing?.id) {
      setError("No listing selected.");
      return;
    }
    if (!message.trim()) {
      setError("Please add a short message about why you're a fit.");
      return;
    }
    try {
      setIsSubmitting(true);
      await applyToListing({
        listingId: listing.id,
        phone: phone.trim() || null,
        message: message.trim(),
      });
      setDone(true);
      if (onSuccess) onSuccess();
      // Close shortly after showing the success state.
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      console.error("Failed to apply:", err);
      setError(err.response?.data?.error || "Could not submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-body">
          <div className="modal-header">
            <div>
              <div className="modal-title">Apply for Position</div>
              <div className="modal-sub">{listing?.title ?? "This listing"}</div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={17} />
            </button>
          </div>

          <div className="modal-fields">
            <div className="form-grid">
              <div>
                <label className="field-label">First Name</label>
                <input className="field-input" value={firstName} readOnly />
              </div>
              <div>
                <label className="field-label">Last Name</label>
                <input className="field-input" value={lastName} readOnly />
              </div>
            </div>

            <div>
              <label className="field-label">Phone (optional)</label>
              <input
                className="field-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 555-123-4567"
              />
            </div>

            <div>
              <label className="field-label">Message</label>
              <textarea
                className="field-input"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell them why you're a good fit for this job..."
              />
            </div>

            {error && <div className="modal-error">{error}</div>}
          </div>

          <button
            className="modal-submit"
            onClick={handleSubmit}
            disabled={isSubmitting || done}
          >
            {done ? (
              <span className="btn-with-icon"><Check size={15} /> Application sent!</span>
            ) : isSubmitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplicationModal;
