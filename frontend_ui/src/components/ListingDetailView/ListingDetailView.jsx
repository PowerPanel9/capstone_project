import { useState } from 'react';
import { ChevronLeft, Clock, MapPin, Star, Briefcase, Check, Trash2, Mail } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { fullName, initials } from '../../utils/user';
import { formatCityState } from '../../utils/location';
import './ListingDetailView.css';

function ListingDetailView({ listing, userMode, isOwner, onDelete, onMessage, onBack, onApply, backLabel = "Back to listings" }) {
  // The owner can delete their own listing, but only while in client mode
  // (deleting is a client action).
  const canDelete = isOwner && userMode === "client";

  // On/off switch for our in-app delete confirmation modal.
  // false = hidden, true = visible. The trashcan opens it; the modal's own
  // buttons close it (Cancel) or run the real delete (Delete).
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  return (
    <div className="detail-wrap">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={16} />
        {backLabel}
      </button>

      <div className="detail-card">
        {listing.imageUrl && (
          <div className="detail-img">
            <img src={listing.imageUrl} alt={listing.title} />
          </div>
        )}

        <div className="detail-body">
          <div className="detail-top">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className="badge">{categoryLabel}</span>
                <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} />
                  {new Date(listing.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1E2340", letterSpacing: "-0.4px", marginBottom: 4 }}>
                {listing.title}
              </h1>
              <p style={{ fontSize: 14, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={13} />
                {listingLocation}
              </p>
            </div>
            {userMode === 'provider' && (
              <div className="detail-actions">
                <button className="apply-btn" onClick={onApply}>
                  Apply Now
                </button>
                <button
                  type="button"
                  className="message-btn"
                  title="Message the client"
                  aria-label="Message the client"
                  onClick={onMessage}
                >
                  <Mail size={18} />
                </button>
              </div>
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

          <div className="stats-grid">
            <div>
              <div className="stat-label">Rate</div>
              <div className="stat-val">${listing.price}</div>
            </div>
            <div>
              <div className="stat-label">Category</div>
              <div className="stat-val" style={{ fontSize: 14 }}>{categoryLabel}</div>
            </div>
          </div>

          <div className="detail-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div className="section-title">About this role</div>
                <p className="about-text">
                  {listing.description}
                </p>
              </div>

              <div>
                <div className="section-title">Required Skills</div>
                <div className="skill-tags">
                  {listing.skillsRequired.map((skill) => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="client-card">
              <div className="client-title">About the Client</div>
              <div className="client-row">
                <ProfilePicture initials={initials(listing.user)} size="xs" />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#1E2340" }}>
                    {fullName(listing.user)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B7280" }}>
                    <Star size={11} />
                    4.9 · 23 reviews
                  </div>
                </div>
              </div>
              <div className="client-details">
                <p><MapPin size={12} />{listingLocation}</p>
                <p><Briefcase size={12} />8 jobs posted</p>
                <p><Check size={12} />Payment verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* In-app delete confirmation. Only rendered when the switch is on, so it
          isn't in the page until the user clicks the trashcan. */}
      {showDeleteConfirm && (
        <div className="confirm-backdrop">
          <div className="confirm-box">
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
