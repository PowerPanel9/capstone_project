import { Home, User, MessageSquare, Bookmark, Plus, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { fullName, initials } from '../../utils/user';
import './Sidebar.css';

function Sidebar({ currentUser, userMode, onOpenAI }) {

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

      <div className="user-row">
        <ProfilePicture initials={initials(currentUser)} size="xs" />
        <div style={{ minWidth: 0 }}>
          <p className="user-name">{fullName(currentUser)}</p>
          <p className="user-handle">{userMode === 'client' ? 'Client' : 'Provider'}</p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
