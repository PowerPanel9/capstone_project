import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import ListingCard from '../ListingCard/ListingCard';
import './HomeView.css';

function HomeView({ listings, bookmarks, onBookmark, onNavigate, onOpenAI }) {
  const [aiInput, setAiInput] = useState("");

  const handleAskAI = () => {
    if (aiInput.trim()) {
      onOpenAI();
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
        <span className="feed-title">Latest Listings</span>
        <button className="view-all">View all →</button>
      </div>

      <div className="listing-feed">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            bookmarked={bookmarks.has(listing.id)}
            onBookmark={() => onBookmark(listing.id)}
            onClick={() => onNavigate("listing", listing)}
          />
        ))}
      </div>
    </div>
  );
}

export default HomeView;
