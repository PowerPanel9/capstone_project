import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ChevronLeft, Briefcase, Check, FileText, Award } from "lucide-react";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import ReviewsPanel from "../ReviewsPanel/ReviewsPanel";
import { getUserById } from "../../api/users";
import { getListingsByUser } from "../../api/listings";
import { getReviewsForUser } from "../../api/reviews";
import { getExperiencesByUser } from "../../api/experiences";
import { fullName, initials } from "../../utils/user";
import { formatCityState } from "../../utils/location";
import { listingStatusLabel, isListingGrayed } from "../../utils/listingStatus";
import { categoryLabel } from "../../utils/categories";
// Reuse the same styles as the logged-in user's profile so this read-only
// profile looks identical to it (same social-rail layout, cards, and tabs).
import "../UserProfileView/UserProfileView.css";

// Read-only profile for viewing ANOTHER user (e.g. a provider found in search
// or a listing's poster). It mirrors the logged-in user's profile layout
// exactly (social rail with identity/Skills/Specialties/Bio cards, and a tab
// feed with Listings/Experience) but WITHOUT any editable fields or buttons:
// no Edit Profile, no toggle mode, no payout setup, no Add/Delete Experience,
// and no Applications tab (that's private data specific to the account owner).
function PublicProfileView({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

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

  // Always show both tabs on every public profile, no matter the profile
  // owner's role or the viewer's current client/provider mode. Posted work
  // is a trust signal for ANY user — a client browsing in provider mode
  // should still be able to see a job poster's experience just like a
  // provider browsing in client mode can. A profile with no experiences yet
  // just shows the tab's empty state, same as the owner's own profile does.
  const [activeTab, setActiveTab] = useState("Experience");
  const tabs = ["Experience", "Listings"];

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

  // Load this user's listings. Same per-user endpoint the owner's own profile
  // uses, so both views count listings the same way (all statuses, not just OPEN).
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

        const mine = await getListingsByUser(userId);

        if (!ignore) setUserListings(Array.isArray(mine) ? mine : []);
      } catch (err) {
        console.error("Failed to load listings:", err);
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
        <div className="mini-card-grid">
          <div className="mini-title">{listing.title}</div>
          <div className="mini-card-status">
            <span className={`listing-status listing-status-${(listing.status || "OPEN").toLowerCase()}`}>
              {listingStatusLabel(listing.status)}
            </span>
          </div>
          <div className="mini-desc">{listing.description}</div>
          <div className="mini-card-meta">
            {listing.price != null && (
              <span className="mini-price">${listing.price}</span>
            )}
            {listing.price != null && (listing.category || listing.customCategory) && (
              <span className="mini-dot">·</span>
            )}
            {(listing.category || listing.customCategory) && (
              <span className="mini-category-tag">
                {listing.category === "OTHER" ? listing.customCategory : listing.category}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <p className="feed-status">Loading profile…</p>;
  if (error) return <p className="feed-status feed-error">{error}</p>;
  if (!user) return <p className="feed-status feed-error">User not found</p>;

  const revieweeId = Number(userId);
  const skills = Array.isArray(user.skills) ? user.skills : [];
  const categories = Array.isArray(user.categories) ? user.categories : [];
  const userProfilePicture = typeof user.profilePicture === "string" ? user.profilePicture.trim() : "";
  const bannerImageUrl = typeof user.imageUrl === "string" ? user.imageUrl.trim() : "";
  const bannerStyle = bannerImageUrl ? { backgroundImage: `url("${bannerImageUrl}")` } : undefined;
  const profileInitials = initials(user);
  const displayLocation =
    user.city && user.state ? `${user.city}, ${user.state}` : formatCityState(user.location);
  const roleLabel =
    user.role === "BOTH" ? "Client & Provider" : user.role === "PROVIDER" ? "Provider" : "Client";

  return (
    <div className="profile-wrap profile-wrap-social">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="social-layout">
        {/* LEFT RAIL: identity card + Skills + Specialties + Bio. Same rail
            the owner's own profile uses, minus anything editable. */}
        <aside className="social-rail">
          <div className="profile-card rail-card">
            <div
              className={`profile-banner ${bannerImageUrl ? "" : "profile-banner-animated"}`}
              style={bannerStyle}
            />
            <div className="profile-body">
              <div className="profile-top-row">
                <div className="profile-avatar-wrap">
                  <div
                    className="profile-avatar"
                    style={
                      userProfilePicture
                        ? { backgroundImage: `url("${userProfilePicture}")`, backgroundSize: "cover", backgroundPosition: "center" }
                        : undefined
                    }
                  >
                    {!userProfilePicture && profileInitials}
                  </div>
                </div>
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
                {displayLocation} · {roleLabel}
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
              {/* No action row here — Edit and the toggle button only make
                  sense on your own profile. */}
            </div>
          </div>

          {/* Skills card in the rail, read-only (no add/remove controls). */}
          <div className="rail-mini">
            <h3 className="rail-mini-title">Skills</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <span key={skill} className="modal-skill-tag">{skill}</span>
                ))
              ) : (
                <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>No skills added yet</p>
              )}
            </div>
          </div>

          {/* Specialties card in the rail. Only providers pick categories, so
              this card only shows up for providers/both. */}
          {(user.role === "PROVIDER" || user.role === "BOTH") && (
            <div className="rail-mini">
              <h3 className="rail-mini-title">Specialties</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {categories.length > 0 ? (
                  categories.map((value) => (
                    <span key={value} className="tag">{categoryLabel(value)}</span>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>No specialties added yet</p>
                )}
              </div>
            </div>
          )}

          {/* Bio card in the rail. */}
          <div className="rail-mini">
            <h3 className="rail-mini-title">Bio</h3>
            <p style={{ margin: 0, fontSize: 13, color: "#4B5563", lineHeight: 1.6 }}>
              {user.bio || "No bio yet."}
            </p>
          </div>
        </aside>

        {/* RIGHT COLUMN: the "feed" — tabs and tab content. */}
        <div className="social-feed">
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

          <div className="tab-panel" key={activeTab}>
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
                <div className="experience-content-column">
                  {/* Credentials: resume + certification links. Only shown for
                      providers/both, and only when a file exists. A client
                      browsing providers can open these to vet them. The URLs
                      come from getUserById, which already returns both fields. */}
                  {(user.role === "PROVIDER" || user.role === "BOTH") &&
                    (user.resumeUrl || user.certificationUrl) && (
                      <div className="experience-credentials">
                        <div className="experience-section-title">CREDENTIALS</div>
                        <div className="cred-cards">
                          {user.resumeUrl && (
                            <div className="cred-card">
                              <div className="cred-card-head">
                                <div className="cred-icon">
                                  <FileText size={18} />
                                </div>
                                <div>
                                  <div className="cred-name">Resume</div>
                                  <div className="cred-status cred-status-on">✓ Uploaded</div>
                                </div>
                              </div>
                              <div className="cred-actions">
                                <a
                                  href={user.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="credential-link"
                                >
                                  View Resume
                                </a>
                              </div>
                            </div>
                          )}
                          {user.certificationUrl && (
                            <div className="cred-card">
                              <div className="cred-card-head">
                                <div className="cred-icon">
                                  <Award size={18} />
                                </div>
                                <div>
                                  <div className="cred-name">Certification</div>
                                  <div className="cred-status cred-status-on">✓ Uploaded</div>
                                </div>
                              </div>
                              <div className="cred-actions">
                                <a
                                  href={user.certificationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="credential-link"
                                >
                                  View Certification
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  <div className="experience-section-title">MY WORK</div>
                  <div className="experience-list">
                    {experiences.length > 0 ? (
                      experiences.map((experience) => {
                        // Build the small category sub-line shown under the job
                        // title. "Other" uses the custom text; known categories
                        // use their friendly label.
                        const expCategoryLabel =
                          experience.category === "OTHER"
                            ? experience.customCategory
                            : categoryLabel(experience.category);

                        return (
                          <div
                            key={experience.id}
                            className="exp-post"
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/experiences/${experience.id}`)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                navigate(`/experiences/${experience.id}`);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="exp-post-head">
                              <ProfilePicture initials={profileInitials} size="xs" />
                              <div className="exp-post-meta">
                                <b>{experience.jobTitle}</b>
                                {expCategoryLabel && <span>{expCategoryLabel}</span>}
                              </div>
                              {/* No owner controls — this is a read-only profile. */}
                            </div>
                            <p className="exp-post-body">{experience.description}</p>
                            {Array.isArray(experience.images) && experience.images.length > 0 && (
                              <div className="exp-post-photos">
                                {experience.images.map((imageSrc, index) => (
                                  <img key={`${experience.id}-${index}`} src={imageSrc} alt={`${experience.jobTitle} ${index + 1}`} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
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
          </div>
        </div>
      </div>

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
