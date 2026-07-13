import { Home, User, MessageSquare, Bookmark, Plus, Sparkles } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { currentUser } from '../../data/mockUser';
import './Sidebar.css';

function Sidebar({ currentView, navigate, onOpenAI, onOpenCreate }) {
  const navItems = [
    { icon: Home, label: "Home", view: "home" },
    { icon: User, label: "Profile", view: "profile" },
    { icon: MessageSquare, label: "Messages", view: "messages" },
    { icon: Bookmark, label: "Bookmarks", view: "bookmarks" }
  ];

  return (
    <div className="sidebar-inner">
      <div className="logo-wrap">
        <div className="logo-icon">
          <Sparkles size={16} />
        </div>
        <span className="logo-name">Workly</span>
      </div>

      <nav>
        {navItems.map(({ icon: Icon, label, view }) => (
          <button
            key={view}
            onClick={() => navigate(view)}
            className={`nav-btn ${currentView === view ? "active" : ""}`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="cta-wrap">
        <button className="btn-primary" onClick={onOpenCreate}>
          <Plus size={15} />
          Post a Listing
        </button>
        <button className="btn-secondary" onClick={onOpenAI}>
          <Sparkles size={15} />
          AI Assistant
        </button>
      </div>

      <div className="user-row">
        <ProfilePicture initials={currentUser.initials} size="xs" />
        <div style={{ minWidth: 0 }}>
          <p className="user-name">{currentUser.fullName}</p>
          <p className="user-handle">{currentUser.handle}</p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
