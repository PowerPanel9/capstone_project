import { useState } from 'react';
import { MapPin } from 'lucide-react';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { currentUser } from '../../data/mockUser';
import { mockListings } from '../../data/mockListings';
import { mockApplications } from '../../data/mockApplications';
import { mockIncomingApplications } from '../../data/mockIncomingApplications';
import './UserProfileView.css';

function UserProfileView({ userMode, onToggleMode }) {
  const [activeTab, setActiveTab] = useState("All");
  const tabs = userMode === 'client'
    ? ["All", "Listings", "Experience", "About", "Applications"]
    : ["All", "Experience", "About", "Applications"];
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [newSkill, setNewSkill] = useState("");
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState("");

const [profile, setProfile] = useState({
  id: currentUser.id || null,
  firstName: currentUser.firstName || "",
  lastName: currentUser.lastName || "",
  email: currentUser.email || "",
  imageUrl: currentUser.imageUrl || "",
  bio: currentUser.bio || "",
  location: currentUser.location || "",
  skills: Array.isArray(currentUser.skills) ? currentUser.skills : [],
  resumeUrl: currentUser.resumeUrl || "",
  certificationUrl: currentUser.certificationUrl || "",
});
const [formData, setFormData] = useState({
  imageUrl: "",
  bio: "",
  location: "",
  skills: [],
  resumeUrl: "",
  certificationUrl: "",
});

const openEditModal = () => {
  setFormData({
    imageUrl: profile.imageUrl || "",
    bio: profile.bio || "",
    location: profile.location || "",
    skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
    resumeUrl: profile.resumeUrl || "",
    certificationUrl: profile.certificationUrl || "",
  });
  setNewSkill("");
  setSaveError("");
  setIsEditModalOpen(true);
};

const closeEditModal = () => {
  setIsEditModalOpen(false);
};

const handleFieldChange = (event) => {
  const { name, value } = event.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

const addSkill = () => {
  const trimmed = newSkill.trim();
  if (!trimmed) return;
  if (formData.skills.includes(trimmed)) return;
  setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
  setNewSkill("");
};

const removeSkill = (skillToRemove) => {
  setFormData((prev) => ({
    ...prev,
    skills: prev.skills.filter((skill) => skill !== skillToRemove),
  }));
};

const handleSaveProfile = async () => {
  try {
    setIsSaving(true);
    setSaveError("");

    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${profile.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update profile");
    }

    const updated = await res.json();
    setProfile((prev) => ({ ...prev, ...updated }));
    setIsEditModalOpen(false);
  } catch (error) {
    setSaveError(error.message || "Error saving profile");
  } finally {
    setIsSaving(false);
  }
};

  return (
    <div className="profile-wrap">
      <div className="profile-card">
        <div className="profile-banner" />
        <div className="profile-body">
          <div className="profile-top-row">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{currentUser.initials}</div>
            </div>
            <button className="edit-btn" onClick={onToggleMode}>
              Switch to {userMode === 'client' ? 'Provider' : 'Client'} Mode
            </button>
            <button className="edit-btn" onClick={openEditModal}>
  Edit Profile
</button>

          </div>
          <h1 className="profile-name">{currentUser.fullName}</h1>
          <div className="profile-sub">
            <MapPin size={13} />
            {currentUser.location} · {userMode === 'client' ? 'Client' : 'Provider'}
          </div>
          <div className="stats-row">
            {[[currentUser.stats.listings, "Listings"], [currentUser.stats.reviews, "Reviews"], [currentUser.stats.rating, "Rating"]].map(([num, label]) => (
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
              <div className="info-card-title">Personal Details</div>
              <div className="info-card-content">
                <p>{currentUser.personalDetails.jobTitle}</p>
                <p>{currentUser.personalDetails.availability}</p>
                <p>{currentUser.personalDetails.experience}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-title">Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {currentUser.skills.map((skill) => (
                  <span key={skill} className="tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontWeight: 700, color: "#4B5563", fontSize: 14 }}>Listings</div>
          {mockListings.slice(0, 2).map((listing) => (
            <div key={listing.id} className="mini-card">
              <ProfilePicture initials={listing.poster.avatar} size="xs" />
              <div className="mini-info">
                <div className="mini-title">{listing.title}</div>
                <div className="mini-desc">{listing.description}</div>
                <div className="mini-meta">
                  <span className="mini-rate">{listing.rate}</span>
                  <span className="mini-type">{listing.type}</span>
                </div>
              </div>
              <span className="badge">{listing.category}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mockListings.map((listing) => (
            <div key={listing.id} className="mini-card">
              <ProfilePicture initials={listing.poster.avatar} size="xs" />
              <div className="mini-info">
                <div className="mini-title">{listing.title}</div>
                <div className="mini-desc">{listing.description}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {listing.tags.map((tag) => (
                    <span key={tag} className="tag" style={{ fontSize: 11 }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1E2340" }}>{listing.rate}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{listing.type}</div>
              </div>
            </div>
          ))}
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
            <div className="info-card-title" style={{ marginBottom: 16 }}>Personal Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[
                ["Availability", currentUser.detailedInfo.availability],
                ["Preferred type", currentUser.detailedInfo.preferredType],
                ["Languages", currentUser.detailedInfo.languages],
                ["Time zone", currentUser.detailedInfo.timeZone],
                ["Response time", currentUser.detailedInfo.responseTime],
                ["Member since", currentUser.detailedInfo.memberSince]
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1E2340" }}>{value}</div>
                </div>
              ))}
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
          {mockApplications.map((app) => (
            <div key={app.title} className="mini-card">
              <ProfilePicture initials={app.company.slice(0, 2).toUpperCase()} size="xs" />
              <div className="mini-info">
                <div className="mini-title">{app.title}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{app.company}</div>
              </div>
              <span style={{ background: app.bg, color: app.col, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                {app.status}
              </span>
            </div>
          ))}
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
          {mockIncomingApplications.map((app) => (
            <div key={app.id} className="mini-card">
              <ProfilePicture initials={app.providerAvatar} size="xs" />
              <div className="mini-info">
                <div className="mini-title">{app.providerName}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Applied to: {app.listingTitle}</div>
              </div>
              <span style={{
                background: app.status === "Pending" ? "#FEF3C7" : app.status === "Accepted" ? "#CCFBF1" : "#FEE2E2",
                color: app.status === "Pending" ? "#B45309" : app.status === "Accepted" ? "#0F766E" : "#B91C1C",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap"
              }}>
                {app.status}
              </span>
            </div>
          ))}
        </div>
      )}
      {isEditModalOpen && (
        <div className="profile-modal-backdrop">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h2>Edit Profile</h2>
              <p>Update your public profile details</p>
            </div>

            <div className="profile-modal-static">
              <div>
                <span className="modal-static-label">Name</span>
                <p>{profile.firstName} {profile.lastName}</p>
              </div>
              <div>
                <span className="modal-static-label">Email</span>
                <p>{profile.email}</p>
              </div>
            </div>

            <label className="modal-label" htmlFor="profile-location">Location</label>
            <input id="profile-location" name="location" value={formData.location} onChange={handleFieldChange} />

            <label className="modal-label" htmlFor="profile-bio">Bio</label>
            <textarea id="profile-bio" name="bio" value={formData.bio} onChange={handleFieldChange} rows={4} />

            <label className="modal-label" htmlFor="profile-image">Image URL</label>
            <input id="profile-image" name="imageUrl" value={formData.imageUrl} onChange={handleFieldChange} />

            <label className="modal-label" htmlFor="profile-resume">Resume URL</label>
            <input id="profile-resume" name="resumeUrl" value={formData.resumeUrl} onChange={handleFieldChange} />

            <label className="modal-label" htmlFor="profile-certification">Certification URL</label>
            <input id="profile-certification" name="certificationUrl" value={formData.certificationUrl} onChange={handleFieldChange} />

            <label className="modal-label">Skills</label>
            <div className="skills-row">
              {formData.skills.map((skill) => (
                <span key={skill} className="modal-skill-tag">
                  {skill}
                  <button type="button" className="skill-remove-btn" onClick={() => removeSkill(skill)}>x</button>
                </span>
              ))}
            </div>

            <div className="skill-add-row">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill"
              />
              <button type="button" className="modal-btn modal-btn-secondary" onClick={addSkill}>Add</button>
            </div>

            {saveError && <p className="error-text">{saveError}</p>}

            <div className="modal-actions">
              <button type="button" className="modal-btn modal-btn-secondary" onClick={closeEditModal}>Cancel</button>
              <button type="button" className="modal-btn modal-btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfileView;
