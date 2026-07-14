import { Menu, Search } from 'lucide-react';
import './TopBar.css';

function TopBar({ title, onToggleSidebar, search, onSearchChange }) {
  return (
    <div className="topbar">
      <button className="topbar-btn" onClick={onToggleSidebar}>
        <Menu size={18} />
      </button>
      <span className="topbar-title">{title}</span>
      <div className="search-wrap">
        <Search size={14} />
        <input
          className="search-input"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search listings..."
        />
      </div>
    </div>
  );
}

export default TopBar;
