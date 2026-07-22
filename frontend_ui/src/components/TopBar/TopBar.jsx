import { Menu, PenSquare, Search as SearchIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Search from '../Search/Search';
import './TopBar.css';

function TopBar({
  onToggleSidebar,
  onLogout,
  userMode,
  messagesComposerOpen,
  onToggleMessagesComposer,
  messagesPeopleSearch,
  onMessagesPeopleSearchChange,
  messagesPeopleResults = [],
  onSelectMessagesPerson,
}) {
  const location = useLocation();

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
    return 'SideHustle';
  };

  // Only show search on home page
  const showSearch = location.pathname === '/home';
  const showMessagesSearch = location.pathname === "/messages";

  return (
    <div className="topbar">
      <button className="topbar-btn" onClick={onToggleSidebar}>
        <Menu size={18} />
      </button>
      <span className="topbar-title">{getPageTitle()}</span>
      {showSearch && <Search userMode={userMode} />}
      {showMessagesSearch && messagesComposerOpen && (
        <div className="search-wrap topbar-messages-search">
          <SearchIcon size={14} />
          <input
            className="search-input"
            value={messagesPeopleSearch}
            onChange={(e) => onMessagesPeopleSearchChange(e.target.value)}
            placeholder="Search people by name..."
          />
          {messagesPeopleResults.length > 0 && (
            <div className="topbar-people-dropdown">
              {messagesPeopleResults.slice(0, 8).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="topbar-people-option"
                  onClick={() => onSelectMessagesPerson(user)}
                >
                  {`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {showMessagesSearch && (
        <button
          className={`topbar-btn message-compose-btn ${messagesComposerOpen ? "active" : ""}`}
          onClick={onToggleMessagesComposer}
          aria-label="Start new conversation"
        >
          <PenSquare size={16} />
        </button>
      )}
    </div>
  );
}

export default TopBar;
