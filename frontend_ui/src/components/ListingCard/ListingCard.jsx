import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Bookmark } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { fullName, initials } from '../../utils/user';
import './ListingCard.css';

function ListingCard({ listing, bookmarked, onBookmark, onClick, userMode }) {
  const navigate = useNavigate();

  // Show the user's typed-in category text when the category is OTHER,
  // otherwise show the fixed category value.
  const categoryLabel =
    listing.category === "OTHER" ? listing.customCategory : listing.category;

  // Only providers can bookmark listings, so the icon is hidden in client mode.
  // When it's hidden, the flex layout lets the category badge slide into its
  // place at the right edge of the header automatically.
  const showBookmark = userMode === "provider";

  // Clicking the poster goes to their profile (not the listing). stopPropagation
  // prevents the card's own onClick (which opens the listing) from also firing.
  const goToPosterProfile = (e) => {
    e.stopPropagation();
    if (listing.user?.id) navigate(`/users/${listing.user.id}`);
  };

  return (
    <div className="card" onClick={onClick}>
      {listing.imageUrl && (
        <div className="card-img">
          <img src={listing.imageUrl} alt={listing.title} />
        </div>
      )}
      <div className="card-body">
        <div className="card-header">
          <div className="card-poster">
            {/* Only the avatar and the name navigate to the poster's profile.
                The location (and the rest of the card) opens the listing. */}
            <span className="card-poster-link" onClick={goToPosterProfile}>
              <ProfilePicture initials={initials(listing.user)} size="xs" />
            </span>
            <div className="card-meta">
              <div className="card-name card-poster-link" onClick={goToPosterProfile}>
                {fullName(listing.user)}
              </div>
              <div className="card-loc">
                <MapPin size={9} />
                {listing.user?.location ?? listing.location}
              </div>
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
