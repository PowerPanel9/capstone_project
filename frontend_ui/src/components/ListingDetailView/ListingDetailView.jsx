import { ChevronLeft, Clock, MapPin, Star, Briefcase, Check } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import './ListingDetailView.css';

function ListingDetailView({ listing, onBack, onApply }) {
  return (
    <div className="detail-wrap">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={16} />
        Back to listings
      </button>

      <div className="detail-card">
        {listing.image && (
          <div className="detail-img">
            <img src={listing.image} alt={listing.title} />
          </div>
        )}

        <div className="detail-body">
          <div className="detail-top">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className="badge">{listing.category}</span>
                <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} />
                  {listing.posted}
                </span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1E2340", letterSpacing: "-0.4px", marginBottom: 4 }}>
                {listing.title}
              </h1>
              <p style={{ fontSize: 14, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={13} />
                {listing.poster.location}
              </p>
            </div>
            <button className="apply-btn" onClick={onApply}>
              Apply Now
            </button>
          </div>

          <div className="stats-grid">
            <div>
              <div className="stat-label">Rate</div>
              <div className="stat-val">{listing.rate}</div>
            </div>
            <div>
              <div className="stat-label">Work type</div>
              <div className="stat-val" style={{ fontSize: 14 }}>{listing.type}</div>
            </div>
            <div>
              <div className="stat-label">Applicants</div>
              <div className="stat-val">{listing.applicants}</div>
            </div>
          </div>

          <div className="detail-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div className="section-title">About this role</div>
                <p className="about-text">
                  {listing.description} This is an exciting opportunity for someone passionate about their craft and looking to make a real impact on a high-growth team.
                </p>
              </div>

              <div>
                <div className="section-title">Required Skills</div>
                <div className="skill-tags">
                  {[...listing.tags, "Communication", "Problem Solving"].map((tag) => (
                    <span key={tag} className="skill-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="client-card">
              <div className="client-title">About the Client</div>
              <div className="client-row">
                <ProfilePicture initials={listing.poster.avatar} size="xs" />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#1E2340" }}>
                    {listing.poster.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B7280" }}>
                    <Star size={11} />
                    4.9 · 23 reviews
                  </div>
                </div>
              </div>
              <div className="client-details">
                <p><MapPin size={12} />{listing.poster.location}</p>
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
