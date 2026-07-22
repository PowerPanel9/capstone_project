import { useEffect, useRef, useState } from 'react';
import { Home, User, MessageSquare, Bookmark, Plus, Sparkles, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { fullName, initials } from '../../utils/user';
import './Sidebar.css';

function Sidebar({ currentUser, userMode, onOpenAI, onLogout }) {
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
        <div className="logo-icon">
          <Sparkles size={16} />
        </div>
        <span className="logo-name">SideHustle</span>
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
