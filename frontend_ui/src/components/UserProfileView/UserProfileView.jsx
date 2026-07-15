import { useEffect, useState } from "react";
import { MapPin, Briefcase, FileText } from "lucide-react";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import "./UserProfileView.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function readJsonSafe(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  return response.json();
}

function UserProfileView({ userMode, onToggleMode }) {
  const [activeTab, setActiveTab] = useState("All");
  const tabs =
    userMode === "client"
      ? ["All", "Listings", "Experience", "About", "Applications"]
      : ["All", "Experience", "About", "Applications"];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [profile, setProfile] = useState({
    id: null,
    firstName: "User",
    lastName: "Name",
    email: "",
    imageUrl: "",
    bio: "User bio will be loaded from the backend.",
    location: "Location",
    skills: [],
    resumeUrl: "",
    certificationUrl: "",
  });

  const [formData, setFormData] = useState({
    imageUrl: "",
    bio: "",
    location: "",
    skills: [],
    resumeUrl: "",
    certificationUrl: "",
  });

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setProfileError("Log in to load your profile.");
        return;
      }

      try {
        setIsLoadingProfile(true);
        setProfileError("");

        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!meResponse.ok) {
          throw new Error("Unable to verify your login session. Check backend URL/server.");
        }

        const me = await readJsonSafe(meResponse);
        if (!me || !me.id) {
          throw new Error("Invalid auth response. Expected JSON user data.");
        }

        const profileResponse = await fetch(`${API_BASE_URL}/users/${me.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error("Unable to load your profile");
        }

        const userProfile = await readJsonSafe(profileResponse);
        if (!userProfile) {
          throw new Error("Invalid profile response. Expected JSON user data.");
        }
        if (ignore) return;

        setProfile({
          id: userProfile.id ?? me.id ?? null,
          firstName: userProfile.firstName || "User",
          lastName: userProfile.lastName || "Name",
          email: userProfile.email || me.email || "",
          imageUrl: userProfile.imageUrl || "",
          bio: userProfile.bio || "",
          location: userProfile.location || "",
          skills: Array.isArray(userProfile.skills) ? userProfile.skills : [],
          resumeUrl: userProfile.resumeUrl || "",
          certificationUrl: userProfile.certificationUrl || "",
        });
      } catch (error) {
        if (!ignore) {
          setProfileError(error.message || "Failed to load profile");
        }
      } finally {
        if (!ignore) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

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
      if (!profile.id) {
        throw new Error("Profile id not found");
      }

      setIsSaving(true);
      setSaveError("");

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/users/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = (await readJsonSafe(res)) || {};
        throw new Error(err.message || "Failed to update profile");
      }

      const updated = await readJsonSafe(res);
      if (!updated) {
        throw new Error("Invalid update response. Expected JSON user data.");
      }
      setProfile((prev) => ({
        ...prev,
        ...updated,
        skills: Array.isArray(updated.skills) ? updated.skills : [],
      }));
      setIsEditModalOpen(false);
    } catch (error) {
      setSaveError(error.message || "Error saving profile");
    } finally {
      setIsSaving(false);
    }
  };

  const currentUser = profile;

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
            <button className="edit-btn" onClick={openEditModal}>
              Edit Profile
            </button>
          </div>
          <h1 className="profile-name">{currentUser.firstName} {currentUser.lastName}</h1>
          <div className="profile-sub">
            <MapPin size={13} />
            {currentUser.location} · {userMode === 'client' ? 'Client' : 'Provider'}
          </div>
          {isLoadingProfile && (
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>Loading profile...</p>
          )}
          {profileError && <p className="error-text" style={{ marginBottom: 12 }}>{profileError}</p>}
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
