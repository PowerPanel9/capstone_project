import { useEffect, useState } from 'react';
import { ChevronLeft, Clock, MapPin, Star, Briefcase, Check, Trash2, Mail, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { fullName, initials } from '../../utils/user';
import { formatCityState } from '../../utils/location';
import { getListingsByUser } from '../../api/listings';
import { getReviewsForUser } from '../../api/reviews';
import './ListingDetailView.css';

function ListingDetailView({ listing, userMode, isOwner, hasApplied, onDelete, onEdit, onMessage, onBack, onApply, backLabel = "Back" }) {
  // The owner can edit or delete their own listing, but only while in client
  // mode (both are client actions on a listing they posted).
  const canDelete = isOwner && userMode === "client";
  const canEdit = isOwner && userMode === "client";

  // On/off switch for our in-app delete confirmation modal.
  // false = hidden, true = visible. The trashcan opens it; the modal's own
  // buttons close it (Cancel) or run the real delete (Delete).
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  // Real stats about the client (poster), shown in the "About the Client"
  // card: how many listings they've posted, and their review count/rating.
  // These used to be hardcoded placeholder numbers.
  const [clientListingCount, setClientListingCount] = useState(null);
  const [clientReviewCount, setClientReviewCount] = useState(0);
  const [clientAvgRating, setClientAvgRating] = useState(null);

  useEffect(() => {
    const clientId = listing.user?.id;
    if (!clientId) return;
    let ignore = false;

    getListingsByUser(clientId)
      .then((data) => {
        if (!ignore) setClientListingCount(Array.isArray(data) ? data.length : 0);
      })
      .catch((err) => {
        console.error("Failed to load client's listing count:", err);
        if (!ignore) setClientListingCount(0);
      });

    getReviewsForUser(clientId)
      .then((reviews) => {
        if (ignore) return;
        setClientReviewCount(reviews.length);
        if (reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
          setClientAvgRating(avg.toFixed(1));
        } else {
          setClientAvgRating(null);
        }
      })
      .catch((err) => console.error("Failed to load client's reviews:", err));

    return () => { ignore = true; };
  }, [listing.user?.id]);

  // Show the user's typed-in category text when the category is OTHER,
  // otherwise show the fixed category value.
  const categoryLabel =
    listing.category === "OTHER" ? listing.customCategory : listing.category;

  // Show only "City, State" for the location. Prefer the structured city/state
  // fields if the backend gives them, otherwise parse the raw address.
  const listingLocation =
    listing.user?.city && listing.user?.state
      ? `${listing.user.city}, ${listing.user.state}`
      : formatCityState(listing.user?.location ?? listing.location);
  // Go to the poster's public profile (where their rating + reviews live).
  const goToPosterProfile = () => {
    if (listing.user?.id) navigate(`/users/${listing.user.id}`);
  };

  return (
    <div className="detail-wrap">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={16} />
        {backLabel}
      </button>

      {/* One two-column layout: the left column flows image -> title ->
          About -> Skills, so with no image everything just moves up. The
          right column stacks the price card and client card together. */}
      <div className="detail-layout">
        <div className="detail-main">
          {/* Details card: one contained card holding everything about this
              listing — image, title/badge/location, owner actions, About,
              and Required Skills — matching the same card look as the price
              and client cards alongside it. */}
          <div className="detail-card">
            {listing.imageUrl && (
              <div className="detail-img">
                <img src={listing.imageUrl} alt={listing.title} />
              </div>
            )}

            <div className="detail-title-block">
              <div className="detail-title-info">
                <div className="detail-badge-row">
                  <span className="badge">{categoryLabel}</span>
                  <span className="detail-posted">
                    <Clock size={11} />
                    Posted {new Date(listing.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="detail-title">{listing.title}</h1>
                <p className="detail-location">
                  <MapPin size={13} />
                  {listingLocation}
                </p>
              </div>
              {(canEdit || canDelete) && (
                <div className="owner-actions">
                  {canEdit && (
                    <button
                      type="button"
                      className="edit-listing-btn"
                      title="Edit listing"
                      aria-label="Edit listing"
                      onClick={onEdit}
                    >
                      <Pencil size={20} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className="delete-listing-btn"
                      title="Delete listing"
                      aria-label="Delete listing"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="section-title">About this role</div>
              <p className="about-text">
                {listing.description}
              </p>
            </div>

            <div>
              <div className="section-title">Required Skills</div>
              <div className="skill-tags">
                {/* If the listing has skills, show them as tags. Otherwise
                    show "None" so the section isn't just blank. */}
                {listing.skillsRequired.length > 0 ? (
                  listing.skillsRequired.map((skill) => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))
                ) : (
                  <span className="skill-tag-none">None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky sidebar: price + actions card, then the client card. */}
        <div className="detail-side">
          <aside className="booking-card">
            <div className="booking-price-row">
              <span className="booking-price">${listing.price}</span>
            </div>
            <p className="booking-price-note">Rate</p>

            {userMode === 'provider' && !isOwner && (
              <>
                {/* Once the provider has applied, show a disabled "Applied"
                    button so they can't apply to the same listing twice. */}
                {hasApplied ? (
                  <button className="apply-btn apply-btn-applied" disabled>
                    Applied
                  </button>
                ) : (
                  <button className="apply-btn" onClick={onApply}>
                    Apply Now
                  </button>
                )}
                <button
                  type="button"
                  className="message-btn"
                  title="Message the client"
                  aria-label="Message the client"
                  onClick={onMessage}
                >
                  <Mail size={18} />
                  Message client
                </button>
              </>
            )}

            <div className="booking-meta">
              <div className="booking-meta-line">
                <span className="booking-meta-label">
                  <Briefcase size={13} />
                  Category
                </span>
                <span className="booking-meta-val">{categoryLabel}</span>
              </div>
            </div>
          </aside>

          <aside className="client-card">
            <div className="client-title">About the Client</div>
            <div
              className="client-row client-row-clickable"
              onClick={goToPosterProfile}
            >
              <ProfilePicture initials={initials(listing.user)} size="xs" />
              <div>
                <p className="client-name">
                  {fullName(listing.user)}
                </p>
                <div className="client-rating-row">
                  <Star size={11} />
                  {clientAvgRating ? `${clientAvgRating} · ` : ""}
                  {clientReviewCount} review{clientReviewCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            <div className="client-details">
              <p><MapPin size={12} />{listingLocation}</p>
              <p>
                <Briefcase size={12} />
                {clientListingCount == null ? "…" : clientListingCount} job{clientListingCount === 1 ? "" : "s"} posted
              </p>
              {/* Only show when the client actually has Stripe payouts enabled. */}
              {listing.user?.paymentVerified && (
                <p><Check size={12} />Payment verified</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* In-app delete confirmation. Only rendered when the switch is on, so it
          isn't in the page until the user clicks the trashcan. */}
      {showDeleteConfirm && (
        <div className="confirm-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Delete this listing?</h3>
            <p className="confirm-text">
              This cannot be undone. The listing will be permanently removed.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={onDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingDetailView;
