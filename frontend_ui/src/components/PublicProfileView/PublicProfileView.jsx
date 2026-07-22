import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ChevronLeft, Briefcase } from "lucide-react";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import ReviewsPanel from "../ReviewsPanel/ReviewsPanel";
import { getUserById } from "../../api/users";
import { getReviewsForUser } from "../../api/reviews";
import { getListingsByUser } from "../../api/listings";
import { fullName, initials } from "../../utils/user";
import { listingStatusLabel, isListingGrayed } from "../../utils/listingStatus";
import { formatCityState } from "../../utils/location";
// Reuse the profile page's styles so this looks like the user's own profile.
import "../UserProfileView/UserProfileView.css";
import "./PublicProfileView.css";

// Experience is stored per-profile in localStorage by UserProfileView, using
// this key prefix. We read (never write) it here so a user's experiences show
// on their public profile too.
const EXPERIENCES_STORAGE_PREFIX = "userProfileExperiences";

// Read-only profile for viewing ANOTHER user (e.g. a listing's poster).
// Mirrors UserProfileView's tabs (All / Listings / Experience) exactly, minus
// any edit/add/toggle controls.
function PublicProfileView({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", "Listings", "Experience"];

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [listings, setListings] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(null);

  // Load the user being viewed.
  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);
    getUserById(userId)
      .then((data) => { if (!ignore) setUser(data); })
      .catch((err) => {
        console.error("Failed to load user:", err);
        if (!ignore) setError("Could not load this user's profile.");
      })
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [userId]);

  // Load this user's listings.
  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    getListingsByUser(userId)
      .then((data) => { if (!ignore) setListings(Array.isArray(data) ? data : []); })
      .catch((err) => console.error("Failed to load user's listings:", err));
    return () => { ignore = true; };
  }, [userId]);

  // Load this user's saved experiences from localStorage (read-only).
  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`${EXPERIENCES_STORAGE_PREFIX}_${userId}`);
      const parsed = raw ? JSON.parse(raw) : [];
      setExperiences(Array.isArray(parsed) ? parsed : []);
    } catch {
      setExperiences([]);
    }
  }, [userId]);

  // Load review stats (count + average).
  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    getReviewsForUser(userId)
      .then((reviews) => {
        if (ignore) return;
        setReviewCount(reviews.length);
        if (reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
          setAvgRating(avg.toFixed(1));
        } else {
          setAvgRating(null);
        }
      })
      .catch((err) => console.error("Failed to load review stats:", err));
    return () => { ignore = true; };
  }, [userId, showReviews]);

  if (isLoading) return <p className="feed-status">Loading profile…</p>;
  if (error) return <p className="feed-status feed-error">{error}</p>;
  if (!user) return <p className="feed-status feed-error">User not found</p>;

  const revieweeId = Number(userId);
  const skills = Array.isArray(user.skills) ? user.skills : [];
  const profilePicture = typeof user.profilePicture === "string" ? user.profilePicture.trim() : "";
  const bannerImageUrl = typeof user.imageUrl === "string" ? user.imageUrl.trim() : "";
  const bannerStyle = bannerImageUrl ? { backgroundImage: `url("${bannerImageUrl}")` } : undefined;

  const openListingDetails = (id) => navigate(`/listing/${id}`);

  // Renders one listing card with its status badge. This is the PUBLIC view, so
  // grayed rules: IN_PROGRESS and COMPLETED are grayed out.
  const renderListingCard = (listing) => {
    const grayed = isListingGrayed(listing.status, { isOwnerView: false });
    return (
      <div
        key={listing.id}
        className={`mini-card ${grayed ? "listing-grayed" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => openListingDetails(listing.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openListingDetails(listing.id);
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <ProfilePicture initials="LS" size="xs" />
        <div className="mini-info">
          <div className="mini-title">{listing.title}</div>
          <div className="mini-desc">{listing.description}</div>
        </div>
        <div className="listing-status-row">
          <span className={`listing-status listing-status-${(listing.status || "OPEN").toLowerCase()}`}>
            {listingStatusLabel(listing.status)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-wrap">
      <button className="public-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="profile-card">
        <div className="profile-banner" style={bannerStyle} />
        <div className="profile-body">
          <div className="profile-top-row">
            <div className="profile-avatar-wrap">
              <div
                className="profile-avatar"
                style={
                  profilePicture
                    ? { backgroundImage: `url("${profilePicture}")`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                {!profilePicture && initials(user)}
              </div>
            </div>
            {/* No edit / mode-toggle buttons: this is a read-only public view. */}
          </div>

          <h1 className="profile-name">{fullName(user)}</h1>
          {user.location && (
            <div className="profile-sub">
              <MapPin size={13} />
              {formatCityState(user.location)}
            </div>
          )}

          <div className="stats-row">
            {[
              [listings.length, "Listings"],
              [reviewCount, "Reviews"],
              [avgRating ? `${avgRating} ★` : "0", "Rating"],
            ].map(([num, label]) => {
              const clickable = label === "Rating";
              return (
                <div
                  key={label}
                  className={clickable ? "stat-clickable" : undefined}
                  onClick={clickable ? () => setShowReviews(true) : undefined}
                >
                  <div className="stat-n">{num}</div>
                  <div className="stat-l">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tabs-bar">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "All" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="info-card">
              <div className="info-card-title">Bio</div>
              <div className="info-card-content">
                <p style={{ fontSize: 14, color: "#4B5563" }}>
                  {user.bio || "This user hasn't added a bio yet."}
                </p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-title">Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skills.length > 0 ? (
                  skills.map((skill) => <span key={skill} className="tag">{skill}</span>)
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>No skills added yet</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ fontWeight: 700, color: "#4B5563", fontSize: 14 }}>Listings</div>
          {listings.length > 0 ? (
            listings.slice(0, 2).map((listing) => renderListingCard(listing))
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              No listings yet
            </div>
          )}
        </div>
      )}

      {activeTab === "Listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {listings.length > 0 ? (
            listings.map((listing) => renderListingCard(listing))
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "40px 20px",
              color: "#9CA3AF",
              textAlign: "center",
            }}>
              <Briefcase size={32} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No listings yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "Experience" && (
        <div className="experience-layout">
          <div className="experience-skills-column">
            <div className="info-card" style={{ padding: 20 }}>
              <div className="info-card-title" style={{ marginBottom: 16 }}>
                Skills
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span key={skill} className="tag">{skill}</span>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                    No experience skills added yet
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="experience-content-column">
            <div className="experience-section-title">Previous Experience</div>
            <div className="experience-list">
              {experiences.length > 0 ? (
                experiences.map((experience) => (
                  <div key={experience.id} className="experience-card">
                    <h3 className="experience-title">{experience.jobTitle}</h3>
                    <p className="experience-description">{experience.description}</p>
                    {experience.images.length > 0 && (
                      <div className="experience-images">
                        {experience.images.map((imageSrc, index) => (
                          <img key={`${experience.id}-${index}`} src={imageSrc} alt={`${experience.jobTitle} ${index + 1}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="experience-empty">
                  No experiences to show.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReviews && (
        <ReviewsPanel
          revieweeId={revieweeId}
          currentUser={currentUser}
          onClose={() => setShowReviews(false)}
        />
      )}
    </div>
  );
}

export default PublicProfileView;
