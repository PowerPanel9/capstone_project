import { Menu, Search } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import './TopBar.css';

function TopBar({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';

  // Generate title based on current route
  const getPageTitle = () => {
    if (location.pathname === '/home') return 'Home';
    if (location.pathname.startsWith('/listing/')) {
      if (location.pathname === '/listing/create') return 'Post a Listing';
      return 'Listing Details';
    }
    if (location.pathname === '/user/profile') return 'My Profile';
    if (location.pathname === '/user/bookmarks') return 'Bookmarks';
    if (location.pathname === '/messages') return 'Messages';
    return 'Workly';
  };

  const handleSearchChange = (value) => {
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  // Only show search on home page
  const showSearch = location.pathname === '/home';

  return (
    <div className="topbar">
      <button className="topbar-btn" onClick={onToggleSidebar}>
        <Menu size={18} />
      </button>
      <span className="topbar-title">{getPageTitle()}</span>
      {showSearch && (
        <div className="search-wrap">
          <Search size={14} />
          <input
            className="search-input"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search listings..."
          />
        </div>
      )}
      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default TopBar;
