import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './ProvidersView.css';

// Turn a category enum value (e.g. "BABYSITTING") into a nice label ("Babysitting").
function prettyCategory(value) {
  if (!value) return '';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

// Build the initials shown when a provider has no profile picture.
function getInitials(firstName, lastName) {
  const first = (firstName || '').charAt(0);
  const last = (lastName || '').charAt(0);
  return (first + last).toUpperCase() || '?';
}

// ProvidersView shows the list of providers for one category in the client view.
// A client gets here by clicking a category tile. Each card links to that
// provider's public profile. This is a client-only screen, so it lives in its
// own component instead of the shared HomeView feed.
function ProvidersView({ providers = [], category, isLoading }) {
  const navigate = useNavigate();
  const safeProviders = Array.isArray(providers) ? providers : [];

  return (
    <div className="providers-wrap">
      {/* Way back to the category tiles, same as the listings/experiences feed. */}
      <button className="category-back" onClick={() => navigate('/home')}>
        <ArrowLeft size={15} />
        All categories
      </button>

      <div className="feed-header">
        <span className="feed-title">{prettyCategory(category)} providers</span>
      </div>

      {isLoading && <p className="feed-status">Loading providers…</p>}

      {!isLoading && safeProviders.length === 0 && (
        <p className="feed-status">No providers offer this service yet.</p>
      )}

      <div className="providers-grid">
        {safeProviders.map((provider) => (
          <button
            type="button"
            className="provider-card"
            key={provider.id}
            onClick={() => navigate(`/users/${provider.id}`)}
          >
            {provider.profilePicture ? (
              <img
                className="provider-avatar"
                src={provider.profilePicture}
                alt={`${provider.firstName} ${provider.lastName}`}
              />
            ) : (
              <div className="provider-avatar provider-avatar-initials">
                {getInitials(provider.firstName, provider.lastName)}
              </div>
            )}

            <div className="provider-name">
              {provider.firstName} {provider.lastName}
            </div>

            {/* Show up to three of the provider's skills as small tags. */}
            {Array.isArray(provider.skills) && provider.skills.length > 0 && (
              <div className="provider-skills">
                {provider.skills.slice(0, 3).map((skill) => (
                  <span className="provider-skill-tag" key={skill}>
                    {prettyCategory(skill)}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProvidersView;
