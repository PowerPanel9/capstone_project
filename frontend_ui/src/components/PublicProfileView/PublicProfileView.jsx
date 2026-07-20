import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ChevronLeft } from "lucide-react";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import ReviewsPanel from "../ReviewsPanel/ReviewsPanel";
import { getUserById } from "../../api/users";
import { getReviewsForUser } from "../../api/reviews";
import { fullName, initials } from "../../utils/user";
import "./PublicProfileView.css";

// Read-only profile for viewing ANOTHER user (e.g. a listing's poster).
// Shows name, location, and review stats. Clicking the Rating stat opens the
// reviews modal. `currentUser` is the logged-in user (so they could leave a
// review from the panel if it's not their own profile).
function PublicProfileView({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (isLoading) return <p className="feed-status">Loading profile…</p>;
  if (error) return <p className="feed-status feed-error">{error}</p>;
  if (!user) return <p className="feed-status feed-error">User not found</p>;

  // The id from the URL is a string; the reviews API/component expect a number.
  const revieweeId = Number(userId);

  return (
    <div className="public-profile-wrap">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="public-profile-card">
        <div className="public-profile-header">
          <ProfilePicture initials={initials(user)} size="lg" />
          <div>
            <h1 className="public-profile-name">{fullName(user)}</h1>
            {(user.location) && (
              <div className="public-profile-loc">
                <MapPin size={13} />
                {user.location}
              </div>
            )}
          </div>
        </div>

        {user.bio && <p className="public-profile-bio">{user.bio}</p>}

        <div className="public-stats-row">
          <div>
            <div className="stat-n">{reviewCount}</div>
            <div className="stat-l">Reviews</div>
          </div>
          {/* Rating is clickable -> opens the reviews modal */}
          <div className="stat-clickable" onClick={() => setShowReviews(true)}>
            <div className="stat-n">{avgRating ? `${avgRating} ★` : "0"}</div>
            <div className="stat-l">Rating</div>
          </div>
        </div>
      </div>

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
