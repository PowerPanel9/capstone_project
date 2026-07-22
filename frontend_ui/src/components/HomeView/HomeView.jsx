import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ListingCard from '../ListingCard/ListingCard';
import CategoryGrid from '../CategoryGrid/CategoryGrid';
import AIAgentModal from '../AIAgentModal/AIAgentModal';
import './HomeView.css';

// Turn a category enum value (e.g. "BABYSITTING") into a nice label ("Babysitting").
function prettyCategory(value) {
  if (!value) return '';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function HomeView({ listings, bookmarks, onBookmark, userMode, onLoadMore, hasMore, isLoading, isLoadingMore, usePersonalized, category, showCategories }) {
  const navigate = useNavigate();
  const safeListings = Array.isArray(listings) ? listings : [];

  // Whether the docked AI chat panel on the right is open. Starts open; the
  // panel's X closes it, and a floating button reopens it.
  const [chatOpen, setChatOpen] = useState(true);

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
        {category ? (
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

      {/* Feedback while the first batch of listings loads, shown here in the
          feed area (under the header) rather than at the top of the page. */}
      {isLoading && <p className="feed-status">Loading listings…</p>}

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

      {/* Nothing in this category yet. Wait until loading finishes so this
          doesn't flash while the first batch is still on its way. */}
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
