import { useState } from 'react';
import { MapPin, Briefcase, FileText } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import './UserProfileView.css';

function UserProfileView({ userMode, onToggleMode }) {
  const [activeTab, setActiveTab] = useState("All");
  const tabs = userMode === 'client'
    ? ["All", "Listings", "Experience", "About", "Applications"]
    : ["All", "Experience", "About", "Applications"];

  // TODO: Fetch user profile data from backend API
  // Replace this placeholder with real user data
  const currentUser = {
    firstName: "User",
    lastName: "Name",
    location: "Location",
    bio: "User bio will be loaded from the backend.",
    skills: []
  };

  // TODO: Fetch user's listings from backend API
  const userListings = [];

  // TODO: Fetch applications data from backend API
  const applications = [];
  const incomingApplications = [];

  return (
    <div className="profile-wrap">
      <div className="profile-card">
        <div className="profile-banner" />
        <div className="profile-body">
          <div className="profile-top-row">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </div>
            </div>
            <button className="edit-btn" onClick={onToggleMode}>
              Switch to {userMode === 'client' ? 'Provider' : 'Client'} Mode
            </button>
          </div>
          <h1 className="profile-name">{currentUser.firstName} {currentUser.lastName}</h1>
          <div className="profile-sub">
            <MapPin size={13} />
            {currentUser.location} · {userMode === 'client' ? 'Client' : 'Provider'}
          </div>
          <div className="stats-row">
            {[[0, "Listings"], [0, "Reviews"], [0, "Rating"]].map(([num, label]) => (
              <div key={label}>
                <div className="stat-n">{num}</div>
                <div className="stat-l">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tabs-bar">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "All" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="info-card">
              <div className="info-card-title">Bio</div>
              <div className="info-card-content">
                <p style={{ fontSize: 14, color: "#4B5563" }}>{currentUser.bio}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-title">Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {currentUser.skills.length > 0 ? (
                  currentUser.skills.map((skill) => (
                    <span key={skill} className="tag">{skill}</span>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>No skills added yet</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ fontWeight: 700, color: "#4B5563", fontSize: 14 }}>Listings</div>
          {userListings.length > 0 ? (
            userListings.slice(0, 2).map((listing) => (
              <div key={listing.id} className="mini-card">
                <ProfilePicture initials="LS" size="xs" />
                <div className="mini-info">
                  <div className="mini-title">{listing.title}</div>
                  <div className="mini-desc">{listing.description}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No listings yet
            </div>
          )}
        </div>
      )}

      {activeTab === "Listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {userListings.length > 0 ? (
            userListings.map((listing) => (
              <div key={listing.id} className="mini-card">
                <ProfilePicture initials="LS" size="xs" />
                <div className="mini-info">
                  <div className="mini-title">{listing.title}</div>
                  <div className="mini-desc">{listing.description}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 20px',
              color: '#9CA3AF',
              textAlign: 'center'
            }}>
              <Briefcase size={32} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No listings yet</p>
              <small style={{ fontSize: 12 }}>Create a listing to get started</small>
            </div>
          )}
        </div>
      )}

      {activeTab === "About" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="info-card" style={{ padding: 24 }}>
            <div className="info-card-title">Bio</div>
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7 }}>
              {currentUser.bio}
            </p>
          </div>
          <div className="info-card" style={{ padding: 24 }}>
            <div className="info-card-title" style={{ marginBottom: 16 }}>Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {currentUser.skills.length > 0 ? (
                currentUser.skills.map((skill) => (
                  <span key={skill} className="tag">{skill}</span>
                ))
              ) : (
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>No skills added yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Applications" && userMode === "provider" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700, color: "#374151", fontSize: 15, marginBottom: 4 }}>
            Jobs You Applied To
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>
            Track the status of your job applications
          </div>
          {applications.length > 0 ? (
            applications.map((app) => (
              <div key={app.id} className="mini-card">
                <ProfilePicture initials="AP" size="xs" />
                <div className="mini-info">
                  <div className="mini-title">{app.title}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 20px',
              color: '#9CA3AF',
              textAlign: 'center'
            }}>
              <FileText size={32} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No applications yet</p>
              <small style={{ fontSize: 12 }}>Applications you submit will appear here</small>
            </div>
          )}
        </div>
      )}

      {activeTab === "Applications" && userMode === "client" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700, color: "#374151", fontSize: 15, marginBottom: 4 }}>
            Applications Received
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>
            Providers who have applied to your job listings
          </div>
          {incomingApplications.length > 0 ? (
            incomingApplications.map((app) => (
              <div key={app.id} className="mini-card">
                <ProfilePicture initials="AP" size="xs" />
                <div className="mini-info">
                  <div className="mini-title">{app.providerName}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Applied to: {app.listingTitle}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 20px',
              color: '#9CA3AF',
              textAlign: 'center'
            }}>
              <FileText size={32} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No applications received</p>
              <small style={{ fontSize: 12 }}>Applications from providers will appear here</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfileView;
