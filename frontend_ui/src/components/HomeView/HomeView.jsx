import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ListingCard from '../ListingCard/ListingCard';
import './HomeView.css';

function HomeView({ listings, bookmarks, onBookmark, userMode, onOpenAI, onLoadMore, hasMore, isLoadingMore }) {
  const [aiInput, setAiInput] = useState("");
  const navigate = useNavigate();
  const safeListings = Array.isArray(listings) ? listings : [];

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
            AI-Powered Matching
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

      <div className="feed-header">
        <span className="feed-title">Listings</span>
      </div>

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
    </div>
  );
}

export default HomeView;
