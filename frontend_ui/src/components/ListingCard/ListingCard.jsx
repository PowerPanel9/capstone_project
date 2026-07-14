import { MapPin, Clock, Bookmark } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import './ListingCard.css';

function ListingCard({ listing, bookmarked, onBookmark, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      {listing.image && (
        <div className="card-img">
          <img src={listing.image} alt={listing.title} />
        </div>
      )}
      <div className="card-body">
        <div className="card-header">
          <ProfilePicture initials={listing.poster.avatar} size="xs" />
          <div className="card-meta">
            <div className="card-name">{listing.poster.name}</div>
            <div className="card-loc">
              <MapPin size={9} />
              {listing.poster.location}
            </div>
          </div>
          <span className="badge">{listing.category}</span>
          <button
            className={`bookmark-btn ${bookmarked ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
          >
            <Bookmark size={15} />
          </button>
        </div>
        <h3 className="card-title">{listing.title}</h3>
        <p className="card-desc">{listing.description}</p>
        <div className="tag-list">
          {listing.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="card-footer">
          <div>
            <span className="card-rate">{listing.rate}</span>
            <span className="card-type">{listing.type}</span>
          </div>
          <span className="card-time">
            <Clock size={10} />
            {listing.posted}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ListingCard;
