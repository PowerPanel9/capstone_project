import { MapPin, Clock, Bookmark, Sparkles } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { fullName, initials } from '../../utils/user';
import './ListingCard.css';

function ListingCard({ listing, bookmarked, onBookmark, onClick, userMode }) {
  // Show the user's typed-in category text when the category is OTHER,
  // otherwise show the fixed category value.
  const categoryLabel =
    listing.category === "OTHER" ? listing.customCategory : listing.category;

  // Only providers can bookmark listings, so the icon is hidden in client mode.
  // When it's hidden, the flex layout lets the category badge slide into its
  // place at the right edge of the header automatically.
  const showBookmark = userMode === "provider";

  return (
    <div className="card" onClick={onClick}>
      {listing.imageUrl && (
        <div className="card-img">
          <img src={listing.imageUrl} alt={listing.title} />
        </div>
      )}
      <div className="card-body">
        <div className="card-header">
          <ProfilePicture initials={initials(listing.user)} size="xs" />
          <div className="card-meta">
            <div className="card-name">{fullName(listing.user)}</div>
            <div className="card-loc">
              <MapPin size={9} />
              {listing.user?.location ?? listing.location}
            </div>
          </div>
          <span className="badge">{categoryLabel}</span>
          {showBookmark && (
            <button
              className={`bookmark-btn ${bookmarked ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark();
              }}
            >
              {/* fill the icon when bookmarked so the user can see its saved state */}
              <Bookmark size={15} fill={bookmarked ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        <h3 className="card-title">{listing.title}</h3>
        {/* Only recommended cards carry a `reason` from the AI. */}
        {listing.reason && (
          <div className="card-reason">
            <Sparkles size={11} />
            {listing.reason}
          </div>
        )}
        <p className="card-desc">{listing.description}</p>
        <div className="tag-list">
          {listing.skillsRequired.map((skill) => (
            <span key={skill} className="tag">
              {skill}
            </span>
          ))}
        </div>
        <div className="card-footer">
          <div>
            <span className="card-rate">${listing.price}</span>
            <span className="card-type">{categoryLabel}</span>
          </div>
          <span className="card-time">
            <Clock size={10} />
            {new Date(listing.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ListingCard;
