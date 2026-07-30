import { Search as SearchIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import './Search.css';

// Search box for the home page feed.
// It keeps the current search text in the URL (?search=...) so the feed in
// App.jsx can read it and ask the backend for matching results.
// In client mode the user is looking for providers, so the placeholder text
// changes to "Search providers...". In provider mode they look for listings.
function Search({ userMode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // The current search text always comes straight from the URL.
  const search = searchParams.get('search') || '';

  // Show a different hint depending on which mode the user is in.
  const placeholder =
    userMode === 'client' ? 'Search providers, skills, services...' : 'Search listings, services, clients...';

  // When the user types, update the URL. Empty text clears the search param.
  // We start from the CURRENT params (not an empty object) so other filters
  // already in the URL, like ?category=GARDENING, stay in place.
  const handleSearchChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('search', value);
      } else {
        next.delete('search');
      }
      return next;
    });
  };

  return (
    <div className="search-wrap">
      <SearchIcon size={14} />
      <input
        className="search-input"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default Search;
