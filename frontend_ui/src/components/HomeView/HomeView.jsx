import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ListingCard from '../ListingCard/ListingCard';
import CategoryGrid from '../CategoryGrid/CategoryGrid';
import AIAgentModal from '../AIAgentModal/AIAgentModal';
import './HomeView.css';

const EXPERIENCE_CATEGORIES = [
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'TUTORING', label: 'Tutoring' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'GARDENING', label: 'Gardening' },
  { value: 'BEAUTY', label: 'Beauty' },
  { value: 'BABYSITTING', label: 'Babysitting' },
  { value: 'MOVING', label: 'Moving' },
  { value: 'HANDYMAN', label: 'Handyman' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'OTHER', label: 'Other' },
];

// Turn a category enum value (e.g. "BABYSITTING") into a nice label ("Babysitting").
function prettyCategory(value) {
  if (!value) return '';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function HomeView({
  listings,
  experiences = [],
  showExperiences = false,
  selectedExperienceCategories = [],
  onToggleExperienceCategory,
  onClearExperienceCategories,
  bookmarks,
  onBookmark,
  userMode,
  onOpenAI,
  onLoadMore,
  hasMore,
  isLoading,
  isLoadingMore,
  usePersonalized,
  category,
  showCategories,
}) {
  const navigate = useNavigate();
  const safeListings = Array.isArray(listings) ? listings : [];
  const safeExperiences = Array.isArray(experiences) ? experiences : [];

  // Whether the docked AI chat panel on the right is open. Starts closed and
  // opens only when the user taps the floating chat button.
  const [chatOpen, setChatOpen] = useState(false);

  // The "sentinel" is an empty div at the very bottom of the feed. An
  // IntersectionObserver watches it: when it scrolls into view, we know the
  // user reached the bottom, so we ask for the next page.
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return; // nothing to watch if no more pages

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onLoadMore();
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect(); // clean up when deps change/unmount
  }, [hasMore, onLoadMore, safeListings.length]);

  return (
    <div className="home-wrap">
      {/* Left column: categories + the listings feed. */}
      <div className="home-main">
      {/* On the landing page, category tiles sit at the top of the feed. */}
      {showCategories && <CategoryGrid userMode={userMode} />}

      {/* When viewing a category, offer a way back to the category tiles. */}
      {category && (
        <button className="category-back" onClick={() => navigate('/home')}>
          <ArrowLeft size={15} />
          All categories
        </button>
      )}

      <div className="feed-header">
        {showExperiences ? (
          // Client mode: the feed shows a grid of posted experiences.
          <span className="feed-title">Experiences</span>
        ) : category ? (
          // Browsing a specific category.
          <span className="feed-title">{prettyCategory(category)} listings</span>
        ) : usePersonalized ? (
          // AI-ranked landing feed. Use `usePersonalized` (our intent) so the
          // header reads "Recommended for you" even while listings are loading,
          // before the backend confirms it actually AI-ranked the feed.
          <span className="feed-title feed-title-ai">
            <Sparkles size={15} />
            Recommended for you
          </span>
        ) : (
          <span className="feed-title">Listings</span>
        )}
      </div>

      {/* Feedback while the first batch loads, shown here in the feed area
          (under the header) rather than at the top of the page. */}
      {isLoading && (
        <p className="feed-status">
          {showExperiences ? "Loading experiences…" : "Loading listings…"}
        </p>
      )}

      {showExperiences ? (
        // Client mode: show posted experiences as social-style cards with the
        // poster info on top, then the cover image and title.
        <>
          <div className="experience-filters">
            <div className="experience-filter-chips">
              {EXPERIENCE_CATEGORIES.map((item) => {
                const isActive = selectedExperienceCategories.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`experience-filter-chip ${isActive ? 'active' : ''}`}
                    onClick={() => onToggleExperienceCategory?.(item.value)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {selectedExperienceCategories.length > 0 && (
              <button
                type="button"
                className="experience-filter-clear"
                onClick={() => onClearExperienceCategories?.()}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="experience-grid">
            {safeExperiences.length === 0 ? (
              <p className="feed-status">No experiences in selected categories yet</p>
            ) : (
              safeExperiences.map((experience) => {
                const cover =
                  Array.isArray(experience.images) && experience.images.length > 0
                    ? experience.images[0]
                    : "";

                const poster = experience.user || null;
                const firstName = poster?.firstName || "";
                const lastName = poster?.lastName || "";
                const posterName = `${firstName} ${lastName}`.trim() || "Unknown user";
                const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
                const profilePicture = poster?.profilePicture || "";

                return (
                  <article className="experience-grid-card" key={experience.id}>
                    <button
                      type="button"
                      className="experience-grid-image-button"
                      onClick={() => navigate(`/experiences/${experience.id}`)}
                    >
                      <div
                        className="experience-grid-image"
                        style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
                      />
                    </button>

                    <div className="experience-grid-meta">
                      <button
                        type="button"
                        className="experience-grid-poster"
                        onClick={() => poster?.id && navigate(`/users/${poster.id}`)}
                        disabled={!poster?.id}
                      >
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt={`${posterName} profile`}
                            className="experience-grid-avatar"
                          />
                        ) : (
                          <div className="experience-grid-avatar-fallback">{initials}</div>
                        )}
                        <span className="experience-grid-poster-name">{posterName}</span>
                      </button>

                      <button
                        type="button"
                        className="experience-grid-title"
                        onClick={() => navigate(`/experiences/${experience.id}`)}
                      >
                        {experience.jobTitle}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div className="listing-feed">
            {safeListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                bookmarked={bookmarks.has(listing.id)}
                onBookmark={() => onBookmark(listing.id)}
                onClick={() => navigate(`/listing/${listing.id}`)}
                userMode={userMode}
              />
            ))}
          </div>

          {/* Nothing to show yet. Wait until loading finishes so this doesn't
              flash while the first batch is still on its way. */}
          {safeListings.length === 0 && !isLoading && !isLoadingMore && (
            <p className="feed-status">No listings here yet.</p>
          )}

          {/* Invisible marker at the bottom; when it scrolls into view we load more. */}
          <div ref={sentinelRef} />

          {/* Feedback while a new page is loading */}
          {isLoadingMore && <p className="feed-status">Loading more…</p>}

          {/* End-of-list message once there's nothing left to load */}
          {!hasMore && safeListings.length > 0 && (
            <p className="feed-status feed-end">No more listings</p>
          )}
        </>
      )}
      </div>

      {/* Right column: the live AI chat, docked in place (no popup). Shown
          only while open; the X inside it sets chatOpen to false. */}
      {chatOpen && (
        <aside className="home-side">
          <AIAgentModal docked onClose={() => setChatOpen(false)} />
        </aside>
      )}

      {/* When the chat is closed, a floating button in the corner reopens it. */}
      {!chatOpen && (
        <button
          className="chat-reopen-btn"
          onClick={() => setChatOpen(true)}
          aria-label="Open AI assistant"
        >
          <Sparkles size={22} />
        </button>
      )}
    </div>
  );
}

export default HomeView;
