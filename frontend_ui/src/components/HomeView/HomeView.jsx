import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ListingCard from '../ListingCard/ListingCard';
import CategoryGrid from '../CategoryGrid/CategoryGrid';
import './HomeView.css';

function HomeView({ listings, providers = [], showProviders = false, bookmarks, onBookmark, userMode, onOpenAI, onLoadMore, hasMore, isLoadingMore }) {
  const [aiInput, setAiInput] = useState("");
  const navigate = useNavigate();
  const safeListings = Array.isArray(listings) ? listings : [];
  const safeProviders = Array.isArray(providers) ? providers : [];

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

  // Open the AI chat modal, passing the typed query so it prefills the chat.
  const handleAskAI = () => {
    if (aiInput.trim()) {
      onOpenAI(aiInput);
      setAiInput(""); // clear the banner box now that it's handed off to the modal
    }
  };

  return (
    <div className="home-wrap">
      <div className="ai-banner">
        <div className="ai-banner-blob1" />
        <div className="ai-banner-blob2" />
        <div style={{ position: "relative" }}>
          <div className="ai-label">
            <Sparkles size={14} />
            AI Assistant
          </div>
          <div className="ai-title">Find your perfect match</div>
          <div className="ai-input-row">
            <Sparkles size={14} />
            <input
              className="ai-input"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
              placeholder='e.g. "React developer, 3 yrs exp, remote under $100/hr"'
            />
            <button
              className="ai-ask-btn"
              onClick={handleAskAI}
              disabled={!aiInput.trim()}
            >
              Ask AI
            </button>
          </div>
        </div>
      </div>

      {/* On the landing page, category tiles sit just below the AI banner. */}
      {showCategories && <CategoryGrid userMode={userMode} />}

      {/* When viewing a category, offer a way back to the category tiles. */}
      {category && (
        <button className="category-back" onClick={() => navigate('/home')}>
          <ArrowLeft size={15} />
          All categories
        </button>
      )}

      <div className="feed-header">
        <span className="feed-title">{showProviders ? "Providers" : "Listings"}</span>
      </div>

      {showProviders ? (
        // Client mode: show providers as circular avatar cards. Clicking one
        // opens that provider's public profile.
        <div className="provider-grid">
          {safeProviders.length === 0 ? (
            <p className="feed-status">No providers found</p>
          ) : (
            safeProviders.map((provider) => {
              const name =
                `${provider.firstName || ""} ${provider.lastName || ""}`.trim() || "Unknown";
              const initials =
                `${(provider.firstName?.[0] || "")}${(provider.lastName?.[0] || "")}`.toUpperCase() || "?";
              const picture =
                typeof provider.profilePicture === "string" ? provider.profilePicture.trim() : "";
              const skills = Array.isArray(provider.skills) ? provider.skills.slice(0, 3) : [];

              return (
                <button
                  type="button"
                  className="provider-tile"
                  key={provider.id}
                  onClick={() => navigate(`/users/${provider.id}`)}
                >
                  <div
                    className="provider-avatar"
                    style={picture ? { backgroundImage: `url("${picture}")` } : undefined}
                  >
                    {!picture && initials}
                  </div>
                  <div className="provider-tile-name">{name}</div>
                  {skills.length > 0 && (
                    <div className="provider-tile-skills">
                      {skills.map((skill) => (
                        <span key={skill} className="provider-tile-skill">{skill}</span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
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
  );
}

export default HomeView;
