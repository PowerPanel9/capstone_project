import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, MapPin, Star, Briefcase, Check } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { fullName, initials } from '../../utils/user';
import './ListingDetailView.css';

function ListingDetailView({ listing, userMode, onBack, onApply }) {
  const navigate = useNavigate();

  // Show the user's typed-in category text when the category is OTHER,
  // otherwise show the fixed category value.
  const categoryLabel =
    listing.category === "OTHER" ? listing.customCategory : listing.category;

  // Go to the poster's public profile (where their rating + reviews live).
  const goToPosterProfile = () => {
    if (listing.user?.id) navigate(`/users/${listing.user.id}`);
  };

  return (
    <div className="detail-wrap">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={16} />
        Back
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
                {listing.user?.location ?? listing.location}
              </p>
            </div>
            {userMode === 'provider' && (
              <button className="apply-btn" onClick={onApply}>
                Apply Now
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
              <div
                className="client-row client-row-clickable"
                onClick={goToPosterProfile}
              >
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
                <p><MapPin size={12} />{listing.user?.location ?? listing.location}</p>
                <p><Briefcase size={12} />8 jobs posted</p>
                <p><Check size={12} />Payment verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingDetailView;
