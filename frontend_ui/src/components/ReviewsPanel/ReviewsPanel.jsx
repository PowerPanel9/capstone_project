import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import StarRating from '../StarRating/StarRating';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { getReviewsForUser, createReview } from '../../api/reviews';
import { fullName, initials } from '../../utils/user';
import './ReviewsPanel.css';

// A slide-in panel showing all reviews for one user, plus a form to leave a new
// review. Props:
//   revieweeId  - the id of the user whose reviews we're showing
//   currentUser - the logged-in user (null if not logged in)
//   onClose     - called when the panel should close
function ReviewsPanel({ revieweeId, currentUser, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New-review form state
  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Load this user's reviews from the backend when the panel opens.
  useEffect(() => {
    let ignore = false;

    // Guard against a missing/invalid id (would 500 the backend). If we don't
    // have a valid id yet, treat it as "no reviews" rather than an error.
    if (revieweeId === undefined || revieweeId === null || Number.isNaN(Number(revieweeId))) {
      setReviews([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getReviewsForUser(revieweeId)
      .then((data) => { if (!ignore) setReviews(data); })
      .catch((err) => {
        console.error("Failed to load reviews:", err?.response?.status, err?.message);
        if (!ignore) setError("Could not load reviews.");
      })
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [revieweeId]);

  // Average rating, computed from the real reviews (0 if there are none).
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
    : "0";

  // Can't review yourself, and must be logged in.
  const canReview = currentUser && currentUser.id !== revieweeId;

  const isFormValid = newRating && newTitle.trim() && newBody.trim();

  const submit = async () => {
    if (!isFormValid || isSubmitting) return;
    setSubmitError(null);
    try {
      setIsSubmitting(true);
      const created = await createReview({
        stars: newRating,
        title: newTitle.trim(),
        description: newBody.trim(),
        revieweeId,
      });
      // Show the new review at the top immediately, attaching the current user
      // as the reviewer so it renders like the others.
      setReviews((prev) => [{ ...created, reviewer: currentUser }, ...prev]);
      setNewRating(0);
      setNewTitle("");
      setNewBody("");
    } catch (err) {
      console.error("Failed to post review:", err);
      setSubmitError(
        err.response?.data?.error || "Could not post review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop — click to close */}
      <div className="reviews-backdrop" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="reviews-panel">
        {/* Header */}
        <div className="reviews-header">
          <div>
            <h2 className="reviews-title">Reviews</h2>
            <p className="reviews-subtitle">
              {reviews.length} reviews · {avgRating} avg
            </p>
          </div>
          <button className="reviews-close" onClick={onClose} aria-label="Close reviews">
            <X size={16} />
          </button>
        </div>

        {/* Review list */}
        <div className="reviews-list">
          {isLoading && <p className="reviews-status">Loading reviews…</p>}
          {error && <p className="reviews-status reviews-error">{error}</p>}
          {!isLoading && !error && reviews.length === 0 && (
            <div className="reviews-empty">
              <p className="reviews-empty-text">No reviews on this user</p>
            </div>
          )}

          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="review-row">
                <div className="review-main">
                  {/* User row */}
                  <div className="review-user">
                    <ProfilePicture initials={initials(r.reviewer)} size="xs" />
                    <div className="review-user-meta">
                      <p className="review-user-name">{fullName(r.reviewer)}</p>
                    </div>
                  </div>

                  {/* Stars + date */}
                  <div className="review-stars">
                    <StarRating rating={r.stars} size={12} />
                    {r.createdAt && (
                      <span className="review-date">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Title + body */}
                  <p className="review-card-title">{r.title}</p>
                  <p className="review-card-body">{r.description}</p>
                </div>

                {/* Optional thumbnail */}
                {r.imageUrl && (
                  <div className="review-thumb">
                    <img src={r.imageUrl} alt="" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add a review — only shown to a logged-in user viewing someone else's profile */}
        {canReview && (
          <div className="review-form">
            <p className="review-form-title">Leave a Review</p>

            <div className="review-form-stars">
              <StarRating rating={newRating} size={22} interactive onChange={setNewRating} />
              <span className="review-form-hint">
                {newRating ? `${newRating} / 5` : "Tap to rate"}
              </span>
            </div>

            <input
              className="review-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Review title"
            />
            <textarea
              className="review-textarea"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Share your experience working with this person..."
              rows={3}
            />

            {submitError && <p className="reviews-status reviews-error">{submitError}</p>}

            <button
              className="review-submit"
              onClick={submit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Posting…" : "Post Review"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default ReviewsPanel;
