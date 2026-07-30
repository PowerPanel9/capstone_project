import { useEffect, useRef, useState } from 'react';
import { Home, User, MessageSquare, Bookmark, Plus, Sparkles, LogOut, X } from 'lucide-react';
import LogoMark from '../Logo/Logo';
import { NavLink } from 'react-router-dom';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { fullName, initials } from '../../utils/user';
import './Sidebar.css';

function Sidebar({ currentUser, userMode, onOpenAI, onLogout, onClose, unreadMessageCount = 0 }) {
  // Small popup that opens when the user clicks their info row at the bottom.
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close the popup when clicking anywhere outside it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: User, label: "Profile", path: "/user/profile" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    ...(userMode === 'provider' ? [{ icon: Bookmark, label: "Bookmarks", path: "/user/bookmarks" }] : [])
  ];

  return (
    <div className="sidebar-inner">
      <div className="logo-wrap">
        <LogoMark size={36} />
        <span className="logo-name">Side<span style={{ color: '#7B8FC8' }}>Hustle</span></span>
        {onClose && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      <nav>
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
          >
            <Icon size={17} />
            {label}
            {label === "Messages" && unreadMessageCount > 0 && (
              <span className="nav-unread-badge">
                {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="cta-wrap">
        {userMode === 'client' && (
          <NavLink to="/listing/create" className="btn-primary">
            <Plus size={15} />
            Post a Listing
          </NavLink>
        )}
        <button className="btn-secondary" onClick={() => onOpenAI()}>
          <Sparkles size={15} />
          AI Assistant
        </button>
      </div>

      <div className="user-menu-wrap" ref={userMenuRef}>
        {isUserMenuOpen && (
          <div className="user-menu-popup" role="menu">
            <button
              type="button"
              className="user-menu-item logout"
              role="menuitem"
              onClick={() => {
                setIsUserMenuOpen(false);
                onLogout?.();
              }}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
        <button
          type="button"
          className="user-row"
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          aria-expanded={isUserMenuOpen}
          aria-haspopup="menu"
        >
          <ProfilePicture initials={initials(currentUser)} size="xs" />
          <div style={{ minWidth: 0, textAlign: 'left' }}>
            <p className="user-name">{fullName(currentUser)}</p>
            <p className="user-handle">{userMode === 'client' ? 'Client' : 'Provider'}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
