/*
 * ============================================================================
 * REVIEWS HOOK-UP — reference snippets for UserProfileView
 * ============================================================================
 *
 * This is NOT an active component. It's a saved reference of the changes needed
 * to wire the ReviewsPanel into the user profile page. They were reverted out
 * of UserProfileView.jsx to avoid merge conflicts while a teammate finishes the
 * profile page. Once their profile page is done, re-apply these pieces into it.
 *
 * The standalone pieces this depends on already exist and are committed:
 *   - components/ReviewsPanel/ReviewsPanel.jsx (+ .css)
 *   - components/StarRating/StarRating.jsx (+ .css)
 *   - api/reviews.js
 *
 * ---------------------------------------------------------------------------
 * 1) IMPORTS (add to the top of the profile component)
 * ---------------------------------------------------------------------------
 *
 *   import { useState, useEffect } from 'react';   // add useEffect
 *   import ReviewsPanel from '../ReviewsPanel/ReviewsPanel';
 *   import { getReviewsForUser } from '../../api/reviews';
 *
 * ---------------------------------------------------------------------------
 * 2) STATE + FETCH (inside the component)
 * ---------------------------------------------------------------------------
 *
 *   NOTE: `currentUser` must be the real logged-in user and include an `id`.
 *   The object stored in localStorage only has { id, firstName, lastName, email },
 *   so the profile page must DEFAULT the missing fields (skills, bio, location)
 *   or reading e.g. currentUser.skills.length will crash the page.
 */

const [showReviews, setShowReviews] = useState(false);

// Review stats for the profile header (count + average rating).
const [reviewCount, setReviewCount] = useState(0);
const [avgRating, setAvgRating] = useState(null);

// Fetch this user's reviews to show the real count and average in the stats
// row. Depends on currentUser.id (a stable value).
useEffect(() => {
  if (!currentUser.id) return;
  getReviewsForUser(currentUser.id)
    .then((reviews) => {
      setReviewCount(reviews.length);
      if (reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
        setAvgRating(avg.toFixed(1));
      } else {
        setAvgRating(null);
      }
    })
    .catch((err) => console.error("Failed to load review stats:", err));
}, [currentUser.id, showReviews]);

/*
 * ---------------------------------------------------------------------------
 * 3) STATS ROW (replace the existing stats-row map)
 * ---------------------------------------------------------------------------
 */

// <div className="stats-row">
//   {[
//     [userListings.length, "Listings"],
//     [reviewCount, "Reviews"],
//     [avgRating ? `${avgRating} ★` : "—", "Rating"],
//   ].map(([num, label]) => {
//     // Reviews and Rating open the reviews panel; Listings is static for now.
//     const clickable = label === "Reviews" || label === "Rating";
//     return (
//       <div
//         key={label}
//         className={clickable ? "stat-clickable" : undefined}
//         onClick={clickable ? () => setShowReviews(true) : undefined}
//       >
//         <div className="stat-n">{num}</div>
//         <div className="stat-l">{label}</div>
//       </div>
//     );
//   })}
// </div>

/*
 * ---------------------------------------------------------------------------
 * 4) PANEL RENDER (add near the end of the returned JSX)
 * ---------------------------------------------------------------------------
 */

// {showReviews && (
//   <ReviewsPanel
//     revieweeId={currentUser.id}
//     currentUser={currentUser}
//     onClose={() => setShowReviews(false)}
//   />
// )}

/*
 * ---------------------------------------------------------------------------
 * 5) CSS (already added to UserProfileView.css — re-add if it gets reverted)
 * ---------------------------------------------------------------------------
 *
 *   .stat-clickable { cursor: pointer; }
 *   .stat-clickable:hover .stat-n { color: var(--primary, #7B8FC8); }
 */
