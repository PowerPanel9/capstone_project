import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ChevronLeft, Briefcase, Check } from "lucide-react";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import ReviewsPanel from "../ReviewsPanel/ReviewsPanel";
import { getUserById } from "../../api/users";
import { getListings } from "../../api/listings";
import { getReviewsForUser } from "../../api/reviews";
import { getExperiencesByUser } from "../../api/experiences";
import { fullName } from "../../utils/user";
import { listingStatusLabel, isListingGrayed } from "../../utils/listingStatus";
// Reuse the same styles as the logged-in user's profile so this read-only
// profile looks identical to it.
import "../UserProfileView/UserProfileView.css";

// Read-only profile for viewing ANOTHER user (e.g. a provider found in search
// or a listing's poster). It mirrors the logged-in user's profile layout
// (banner, avatar, bio, skills, listings, review stats) but WITHOUT the
// client/provider toggle, the Edit Profile button, or the Add Experience
// feature — those only make sense on your own profile.
function PublicProfileView({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", "Listings", "Experience"];

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userListings, setUserListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState("");

  // Experiences are read-only here. They come from the backend database (the
  // same endpoint the owner's own profile uses), so anyone viewing this profile
  // sees the experiences this user posted.
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

  // Load this user's listings. The listings API has no "by user" filter, so we
  // page through the feed and keep only the ones this user posted (same
  // approach the logged-in profile uses).
  useEffect(() => {
    let ignore = false;

    const loadUserListings = async () => {
      if (!userId) {
        if (!ignore) setUserListings([]);
        return;
      }

      try {
        setIsLoadingListings(true);
        setListingsError("");

        const combinedListings = [];
        let page = 1;
        let hasMore = true;
        const PAGE_LIMIT = 50;
        const MAX_PAGES = 20; // safety guard

        while (hasMore && page <= MAX_PAGES) {
          const data = await getListings({ page, limit: PAGE_LIMIT });
          const pageListings = Array.isArray(data.listings) ? data.listings : [];
          combinedListings.push(...pageListings);
          hasMore = Boolean(data.hasMore);
          page += 1;
        }

        const theirs = combinedListings.filter((listing) => {
          const ownerId = listing?.userId ?? listing?.user?.id;
          return Number(ownerId) === Number(userId);
        });

        if (!ignore) setUserListings(theirs);
      } catch (err) {
        if (!ignore) {
          setListingsError("Failed to load listings.");
          setUserListings([]);
        }
      } finally {
        if (!ignore) setIsLoadingListings(false);
      }
    };

    loadUserListings();
    return () => { ignore = true; };
  }, [userId]);

  // Load review stats (count + average). Re-runs when the panel closes so a
  // newly-posted review updates the numbers.
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

  // Load this user's experiences from the backend. `ignore` guards against a
  // late response updating state after the user changed or we unmounted.
  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    getExperiencesByUser(userId)
      .then((list) => {
        if (!ignore) setExperiences(list);
      })
      .catch((err) => {
        console.error("Failed to load experiences:", err);
        if (!ignore) setExperiences([]);
      });

    return () => { ignore = true; };
  }, [userId]);

  const openListingDetails = (listingId) => {
    if (!listingId) return;
    navigate(`/listing/${listingId}`);
  };

  // Renders one listing card with its status badge. This is the PUBLIC view, so
  // listings that are IN_PROGRESS or COMPLETED show grayed out (no longer
  // taking applicants).
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

  if (isLoading) return <p className="feed-status">Loading profile…</p>;
  if (error) return <p className="feed-status feed-error">{error}</p>;
  if (!user) return <p className="feed-status feed-error">User not found</p>;

  const revieweeId = Number(userId);
  const skills = Array.isArray(user.skills) ? user.skills : [];
  const profilePicture = typeof user.profilePicture === "string" ? user.profilePicture.trim() : "";
  const bannerImageUrl = typeof user.imageUrl === "string" ? user.imageUrl.trim() : "";
  const bannerStyle = bannerImageUrl ? { backgroundImage: `url("${bannerImageUrl}")` } : undefined;
  const profileInitials = `${(user.firstName?.[0] || "").toUpperCase()}${(user.lastName?.[0] || "").toUpperCase()}`;
  const displayLocation =
    user.city && user.state ? `${user.city}, ${user.state}` : (user.location || "Location");

  return (
    <div className="profile-wrap">
      <button className="back-btn" onClick={() => navigate(-1)}>
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
                {!profilePicture && profileInitials}
              </div>
            </div>
            {/* No toggle or Edit button here — this is someone else's profile. */}
          </div>
          <div className="profile-name-row">
            <h1 className="profile-name">{fullName(user)}</h1>
            {/* Lets clients see the provider has Stripe payouts enabled. */}
            {user.paymentVerified && (
              <span className="payment-verified">
                <Check size={13} />
                Payment verified
              </span>
            )}
          </div>
          <div className="profile-sub">
            <MapPin size={13} />
            {displayLocation} · Provider
          </div>
          <div className="stats-row">
            {[
              [userListings.length, "Listings"],
              [reviewCount, "Reviews"],
              [avgRating ? `${avgRating} ★` : "0", "Rating"],
            ].map(([num, label]) => {
              // Only the Rating stat opens the reviews modal.
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
                  {user.bio || "No bio yet"}
                </p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-title">Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span key={skill} className="tag">{skill}</span>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>No skills added yet</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ fontWeight: 700, color: "#4B5563", fontSize: 14 }}>Listings</div>
          {isLoadingListings ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Loading listings...
            </div>
          ) : listingsError ? (
            <div style={{ padding: 20, textAlign: "center", color: "#b91c1c", fontSize: 13 }}>
              {listingsError}
            </div>
          ) : userListings.length > 0 ? (
            userListings.slice(0, 2).map((listing) => renderListingCard(listing))
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              No listings yet
            </div>
          )}
        </div>
      )}

      {activeTab === "Listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isLoadingListings ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Loading listings...
            </div>
          ) : listingsError ? (
            <div style={{ padding: 20, textAlign: "center", color: "#b91c1c", fontSize: 13 }}>
              {listingsError}
            </div>
          ) : userListings.length > 0 ? (
            userListings.map((listing) => renderListingCard(listing))
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "40px 20px",
              color: "#9CA3AF",
              textAlign: "center"
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
                    {Array.isArray(experience.images) && experience.images.length > 0 && (
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
                  No experiences to show yet.
                </div>
              )}
            </div>
            {/* No "Add Experience" button — this is a read-only profile. */}
          </div>
        </div>
      )}

      {/* Reviews modal — opens only when the Rating stat is clicked. */}
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
