import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Briefcase, FileText, ChevronDown, Check } from "lucide-react";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import ReviewsPanel from "../ReviewsPanel/ReviewsPanel";
import ConnectOnboarding from "../ConnectOnboarding/ConnectOnboarding";
import { getOnboardingStatus } from "../../api/connect";
import { getListingsByUser, updateListing } from "../../api/listings";
import { getPaymentForListing, releasePayment } from "../../api/payments";
import { listingStatusLabel, isListingGrayed } from "../../utils/listingStatus";
import { formatCityState } from "../../utils/location";
import { getReviewsForUser } from "../../api/reviews";
import {
  getMyApplications,
  getReceivedApplications,
  getRankedApplicationsForListing,
} from "../../api/applications";
import ApplicationDetailModal from "../ApplicationDetailModal/ApplicationDetailModal";
// Brings in .app-status / .status-* badge styles used on the application cards.
import "../ApplicationDetailModal/ApplicationDetailModal.css";

// Friendly label for an application status.
const STATUS_LABELS = { PENDING: "Pending", ACCEPTED: "Accepted", REJECTED: "Rejected" };
import "./UserProfileView.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function readJsonSafe(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  return response.json();
}

function toDisplayName(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function UserProfileView({ userMode, onToggleMode, onLogout }) {
  const EXPERIENCES_STORAGE_PREFIX = "userProfileExperiences";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const tabs =
    userMode === "provider"
      ? ["All", "Listings", "Experience", "Applications"]
      : ["All", "Listings", "Applications"];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [userListings, setUserListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState("");
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [experienceSaveError, setExperienceSaveError] = useState("");
  const [experiences, setExperiences] = useState([]);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef(null);
  const [experienceForm, setExperienceForm] = useState({
    jobTitle: "",
    description: "",
    images: [],
  });

  useEffect(() => {
    if (userMode !== "provider" && activeTab === "Experience") {
      setActiveTab("All");
    }
  }, [userMode, activeTab]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!actionsMenuRef.current?.contains(event.target)) {
        setIsActionsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsActionsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const [profile, setProfile] = useState({
    id: null,
    firstName: "User",
    lastName: "Name",
    email: "",
    profilePicture: "",
    imageUrl: "",
    bio: "User bio will be loaded from the backend.",
    location: "Location",
    city: "",
    state: "",
    skills: [],
    contactEmail: "",
    phoneNumber: "",
    mailingAddress: "",
    resumeUrl: "",
    certificationUrl: "",
  });

  const [formData, setFormData] = useState({
    imageUrl: "",
    profilePicture: "",
    bio: "",
    location: "",
    skills: [],
    contactEmail: "",
    phoneNumber: "",
    mailingAddress: "",
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

        const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
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

        const profileResponse = await fetch(`${API_BASE_URL}/api/users/${me.id}`, {
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
          profilePicture: userProfile.profilePicture || "",
          bio: userProfile.bio || "",
          location: userProfile.location || "",
          city: userProfile.city || "",
          state: userProfile.state || "",
          skills: Array.isArray(userProfile.skills) ? userProfile.skills : [],
          contactEmail: userProfile.contactEmail || "",
          phoneNumber: userProfile.phoneNumber || "",
          mailingAddress: userProfile.mailingAddress || "",
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

  useEffect(() => {
    let ignore = false;

    const loadUserListings = async () => {
      if (!profile.id) {
        if (!ignore) setUserListings([]);
        return;
      }

      try {
        setIsLoadingListings(true);
        setListingsError("");

        // Use the per-user endpoint, which returns ALL of the user's listings
        // regardless of status. (The home feed endpoint only returns OPEN ones,
        // which would hide IN_PROGRESS/COMPLETED listings from the owner.)
        const mine = await getListingsByUser(profile.id);

        if (!ignore) setUserListings(Array.isArray(mine) ? mine : []);
      } catch (error) {
        if (!ignore) {
          setListingsError("Failed to load your listings.");
          setUserListings([]);
        }
      } finally {
        if (!ignore) setIsLoadingListings(false);
      }
    };

    loadUserListings();

    return () => {
      ignore = true;
    };
  }, [profile.id]);

  useEffect(() => {
    if (!profile.id) return;
    const storageKey = `${EXPERIENCES_STORAGE_PREFIX}:${profile.id}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setExperiences([]);
        return;
      }
      const parsed = JSON.parse(raw);
      setExperiences(Array.isArray(parsed) ? parsed : []);
    } catch (_error) {
      setExperiences([]);
    }
  }, [profile.id]);

  useEffect(() => {
    if (!profile.id) return;
    const storageKey = `${EXPERIENCES_STORAGE_PREFIX}:${profile.id}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(experiences));
    } catch (_error) {
      // Ignore storage write errors (private mode/full storage).
    }
  }, [profile.id, experiences]);

  const openEditModal = () => {
    setFormData({
      imageUrl: profile.imageUrl || "",
      profilePicture: profile.profilePicture || "",
      bio: profile.bio || "",
      location: profile.location || "",
      skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
      contactEmail: profile.contactEmail || "",
      phoneNumber: profile.phoneNumber || "",
      mailingAddress: profile.mailingAddress || "",
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

  const handleToggleModeClick = () => {
    onToggleMode();
    setIsActionsMenuOpen(false);
  };

  const handleEditProfileClick = () => {
    openEditModal();
    setIsActionsMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setIsActionsMenuOpen(false);
    onLogout?.();
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    if (name === "phoneNumber") {
      setFormData((prev) => ({ ...prev, phoneNumber: value.replace(/[^\d+\-()\s]/g, "") }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const MAX_UPLOAD_DIMENSION = 1200;
  const MAX_BASE64_LENGTH = 900_000; // keep request payload safely below server limits

  const compressImageToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read image file."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Could not process selected image."));
        img.onload = () => {
          const scale = Math.min(
            1,
            MAX_UPLOAD_DIMENSION / Math.max(img.width, img.height)
          );
          const targetWidth = Math.max(1, Math.round(img.width * scale));
          const targetHeight = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not prepare image canvas."));
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // First try compressed JPEG, then fallback.
          let output = canvas.toDataURL("image/jpeg", 0.75);
          if (output.length > MAX_BASE64_LENGTH) {
            output = canvas.toDataURL("image/jpeg", 0.6);
          }
          if (output.length > MAX_BASE64_LENGTH) {
            reject(
              new Error("Image is too large. Please choose a smaller image.")
            );
            return;
          }

          resolve(output);
        };
        img.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });

  const handleSingleImageChange = (fieldName) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaveError("");
      const compressedDataUrl = await compressImageToDataUrl(file);
      setFormData((prev) => ({
        ...prev,
        [fieldName]: compressedDataUrl,
      }));
    } catch (error) {
      setSaveError(error.message || "Could not upload image.");
    }
  };

  const openExperienceModal = () => {
    setExperienceSaveError("");
    setExperienceForm({
      jobTitle: "",
      description: "",
      images: [],
    });
    setIsExperienceModalOpen(true);
  };

  const closeExperienceModal = () => {
    setIsExperienceModalOpen(false);
  };

  const handleExperienceFieldChange = (event) => {
    const { name, value } = event.target;
    setExperienceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExperienceImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      setExperienceForm((prev) => ({ ...prev, images: [] }));
      return;
    }

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          })
      )
    ).then((imageDataUrls) => {
      setExperienceForm((prev) => ({
        ...prev,
        images: imageDataUrls.filter(Boolean),
      }));
    });
  };

  const handleSaveExperience = () => {
    const jobTitle = experienceForm.jobTitle.trim();
    const description = experienceForm.description.trim();

    if (!jobTitle) {
      setExperienceSaveError("Job title is required.");
      return;
    }

    if (!description) {
      setExperienceSaveError("Description is required.");
      return;
    }

    setExperiences((prev) => [
      {
        id: Date.now(),
        jobTitle,
        description,
        images: experienceForm.images,
      },
      ...prev,
    ]);
    setIsExperienceModalOpen(false);
  };

  const openListingDetails = (listingId) => {
    if (!listingId) return;
    // Pass a "from" marker so the detail page knows we came from the profile
    // and can send us back here (instead of the home feed).
    navigate(`/listing/${listingId}`, { state: { from: "profile" } });
  };

  // Mark an in-progress listing as COMPLETED (owner only). Completing the job
  // also RELEASES the held payment to the provider (the money the client paid
  // is held until the job is done).
  const markListingCompleted = async (listingId) => {
    try {
      await updateListing(listingId, { status: "COMPLETED" });
      setUserListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: "COMPLETED" } : l))
      );

      // If a payment was made and is still HELD, release it to the provider.
      try {
        const payment = await getPaymentForListing(listingId);
        if (payment && payment.status === "HELD") {
          await releasePayment(payment.id);
        }
      } catch (payErr) {
        // Don't undo the completion if release fails — just log it. The client
        // can retry payout later if needed.
        console.error("Listing marked completed, but releasing payment failed:", payErr);
      }
    } catch (err) {
      console.error("Failed to mark listing completed:", err);
    }
  };

  // Renders one of the current user's listing cards (PRIVATE / owner view).
  // Owner rules: gray ONLY when COMPLETED. Shows a "Mark as Completed" button
  // while the listing is IN_PROGRESS.
  const renderOwnerListingCard = (listing) => {
    const grayed = isListingGrayed(listing.status, { isOwnerView: true });
    return (
      <div
        key={listing.id}
        className={`mini-card ${grayed ? "listing-grayed" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => openListingDetails(listing.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openListingDetails(listing.id);
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <ProfilePicture initials="LS" size="xs" />
        <div className="mini-info">
          <div className="mini-title">{listing.title}</div>
          <div className="mini-desc">{listing.description}</div>
        </div>
        <div className="listing-status-row">
          <span className={`listing-status listing-status-${(listing.status || "OPEN").toLowerCase()}`}>
            {listingStatusLabel(listing.status)}
          </span>
          {listing.status === "IN_PROGRESS" && (
            <button
              className="mark-done-btn"
              onClick={(e) => {
                e.stopPropagation();
                markListingCompleted(listing.id);
              }}
            >
              Mark as Completed
            </button>
          )}
        </div>
      </div>
    );
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
      const res = await fetch(`${API_BASE_URL}/api/users/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          addressText: formData.location,
        }),
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
        city: updated.city || "",
        state: updated.state || "",
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

  // Reviews shown on this profile (loaded from the backend by the user's id).
  // The panel opens when the "Rating" stat is clicked.
  const [showReviews, setShowReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(null);

  // Whether this user has Stripe payouts enabled -> drives the "Payment
  // verified" checkmark in the header.
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  // Read the "just finished onboarding" flag ONCE (set by ConnectReturn). We
  // clear it immediately so a page refresh no longer shows the confirmation box.
  const [justOnboarded] = useState(() => {
    const flag = sessionStorage.getItem("justOnboarded") === "true";
    if (flag) sessionStorage.removeItem("justOnboarded");
    return flag;
  });

  useEffect(() => {
    let ignore = false;
    getOnboardingStatus()
      .then((data) => { if (!ignore) setPayoutsEnabled(Boolean(data?.onboarded)); })
      .catch(() => { if (!ignore) setPayoutsEnabled(false); })
      .finally(() => { if (!ignore) setPayoutsLoading(false); });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!profile.id) return;
    let ignore = false;
    getReviewsForUser(profile.id)
      .then((reviews) => {
        if (ignore) return;
        setReviewCount(reviews.length);
        if (reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
          setAvgRating(avg.toFixed(1));
        } else {
          setAvgRating(null);
        }
      })
      .catch((err) => console.error("Failed to load review stats:", err));
    return () => { ignore = true; };
  }, [profile.id, showReviews]);

  const userProfilePicture =
    typeof currentUser.profilePicture === "string" ? currentUser.profilePicture.trim() : "";
  const bannerImageUrl =
    typeof currentUser.imageUrl === "string" ? currentUser.imageUrl.trim() : "";
  const bannerStyle = bannerImageUrl
    ? { backgroundImage: `url("${bannerImageUrl}")` }
    : undefined;
  const displayFirstName = toDisplayName(currentUser.firstName);
  const displayLastName = toDisplayName(currentUser.lastName);
  const profileInitials = `${(currentUser.firstName?.[0] || "").toUpperCase()}${(currentUser.lastName?.[0] || "").toUpperCase()}`;
  const displayLocation =
    currentUser.city && currentUser.state
      ? `${currentUser.city}, ${currentUser.state}`
      : formatCityState(currentUser.location);

  // Applications sent by me (provider view) and received on my listings (client view).
  const [applications, setApplications] = useState([]);
  const [incomingApplications, setIncomingApplications] = useState([]);

  // Bumped to force a re-fetch of applications after an accept/reject.
  const [applicationsRefresh, setApplicationsRefresh] = useState(0);
  // The application a client clicked to view in detail (client view).
  const [selectedApplication, setSelectedApplication] = useState(null);

  // How each listing group is sorted. Keyed by listingId; defaults to "recent".
  // Values: "recent" | "ai" | "alpha".
  const [sortModes, setSortModes] = useState({});
  // Cached AI rankings, keyed by listingId so we only ask the AI once per listing.
  // rankings[listingId] = { order: [providerId...], reasons: {providerId: text}, aiRanked: bool }
  const [rankings, setRankings] = useState({});
  // Which listing is currently loading its AI ranking (so we can show a loading state).
  const [rankingListingId, setRankingListingId] = useState(null);

  useEffect(() => {
    getMyApplications()
      .then((apps) =>
        setApplications(
          apps.map((a) => ({ id: a.id, title: a.listing?.title ?? "Listing", status: a.status }))
        )
      )
      .catch((err) => console.error("Failed to load your applications:", err));
  }, [applicationsRefresh]);

  useEffect(() => {
    getReceivedApplications()
      .then((apps) =>
        setIncomingApplications(
          apps.map((a) => ({
            id: a.id,
            providerId: a.provider?.id,
            providerName: `${a.provider?.firstName ?? ""} ${a.provider?.lastName ?? ""}`.trim(),
            listingId: a.listingId ?? a.listing?.id,
            listingTitle: a.listing?.title ?? "Listing",
            phone: a.phone,
            message: a.message,
            status: a.status,
          }))
        )
      )
      .catch((err) => console.error("Failed to load received applications:", err));
  }, [applicationsRefresh]);

  // The user picked a sort option for one listing group. "recent" and "alpha"
  // are instant (we sort on the frontend). "ai" needs the backend, so the first
  // time it's chosen we fetch + cache the ranking; after that it's instant too.
  async function handleSortChange(listingId, mode) {
    setSortModes((prev) => ({ ...prev, [listingId]: mode }));

    // Only "ai" needs data, and only if we haven't already fetched it.
    if (mode !== "ai" || rankings[listingId]) {
      return;
    }

    setRankingListingId(listingId);
    try {
      const result = await getRankedApplicationsForListing(listingId);
      const reasons = {};
      result.applicants.forEach((applicant) => {
        reasons[applicant.providerId] = applicant.reason;
      });
      setRankings((prev) => ({
        ...prev,
        [listingId]: {
          order: result.applicants.map((applicant) => applicant.providerId),
          reasons,
          aiRanked: result.aiRanked,
        },
      }));
    } catch (err) {
      console.error("Failed to rank applicants:", err);
      // Mark the group as "tried but unavailable" so we can show the notice.
      setRankings((prev) => ({
        ...prev,
        [listingId]: { order: [], reasons: {}, aiRanked: false },
      }));
    } finally {
      setRankingListingId(null);
    }
  }

  return (
    <div className="profile-wrap">
      <div className="profile-card">
        <div className="profile-banner" style={bannerStyle} />
        <div className="profile-body">
          <div className="profile-top-row">
            <button
              type="button"
              className="profile-avatar-wrap profile-avatar-btn"
              onClick={openEditModal}
              title="Edit profile picture"
            >
              <div
                className="profile-avatar"
                style={
                  userProfilePicture
                    ? { backgroundImage: `url("${userProfilePicture}")`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                {!userProfilePicture && profileInitials}
              </div>
            </button>
            <div className="profile-actions-menu" ref={actionsMenuRef}>
              <button
                type="button"
                className="actions-menu-trigger"
                onClick={() => setIsActionsMenuOpen((prev) => !prev)}
                aria-expanded={isActionsMenuOpen}
                aria-haspopup="menu"
                aria-label="Open profile actions"
              >
                <ChevronDown size={15} className={isActionsMenuOpen ? "menu-arrow open" : "menu-arrow"} />
              </button>

              {isActionsMenuOpen && (
                <div className="actions-menu-dropdown" role="menu">
                  <button type="button" className="actions-menu-item" role="menuitem" onClick={handleToggleModeClick}>
                    Switch to {userMode === "client" ? "Provider" : "Client"} Mode
                  </button>
                  <button type="button" className="actions-menu-item" role="menuitem" onClick={handleEditProfileClick}>
                    Edit Profile
                  </button>
                  <button type="button" className="actions-menu-item logout" role="menuitem" onClick={handleLogoutClick}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="profile-name-row">
            <h1 className="profile-name">{displayFirstName} {displayLastName}</h1>
            {/* Next to the name: a small loading note while we check payout
                status, then the "Payment verified" pill once enabled. Only
                relevant for providers (they're the ones who receive payouts). */}
            {userMode === "provider" && payoutsLoading && (
              <span className="payment-status-loading">Checking payout status…</span>
            )}
            {!payoutsLoading && payoutsEnabled && (
              <span className="payment-verified">
                <Check size={13} />
                Payment verified
              </span>
            )}
          </div>
          <div className="profile-sub">
            <MapPin size={13} />
            {displayLocation} · {userMode === 'client' ? 'Client' : 'Provider'}
          </div>
          {isLoadingProfile && (
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>Loading profile...</p>
          )}
          {profileError && <p className="error-text" style={{ marginBottom: 12 }}>{profileError}</p>}
          <div className="stats-row">
            {[
              [userListings.length, "Listings"],
              [reviewCount, "Reviews"],
              [avgRating ? `${avgRating} ★` : "0", "Rating"],
            ].map(([num, label]) => {
              // Only the Rating stat opens the reviews modal.
              const clickable = label === "Rating";
              return (
                <div
                  key={label}
                  className={clickable ? "stat-clickable" : undefined}
                  onClick={clickable ? () => setShowReviews(true) : undefined}
                >
                  <div className="stat-n">{num}</div>
                  <div className="stat-l">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Providers set up Stripe payouts here so they can receive payments.
          After onboarding, this box shows once then disappears on refresh (the
          header "Payment verified" checkmark becomes the lasting indicator). */}
      {userMode === "provider" && (
        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <ConnectOnboarding justOnboarded={justOnboarded} />
        </div>
      )}

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
          {isLoadingListings ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Loading your listings...
            </div>
          ) : listingsError ? (
            <div style={{ padding: 20, textAlign: "center", color: "#b91c1c", fontSize: 13 }}>
              {listingsError}
            </div>
          ) : userListings.length > 0 ? (
            userListings.slice(0, 2).map((listing) => renderOwnerListingCard(listing))
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No listings yet
            </div>
          )}
        </div>
      )}

      {activeTab === "Listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isLoadingListings ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Loading your listings...
            </div>
          ) : listingsError ? (
            <div style={{ padding: 20, textAlign: "center", color: "#b91c1c", fontSize: 13 }}>
              {listingsError}
            </div>
          ) : userListings.length > 0 ? (
            userListings.map((listing) => renderOwnerListingCard(listing))
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

      {activeTab === "Experience" && (
        <div className="experience-layout">
          <div className="experience-skills-column">
            <div className="info-card" style={{ padding: 20 }}>
              <div className="info-card-title" style={{ marginBottom: 16 }}>
                Skills
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {currentUser.skills.length > 0 ? (
                  currentUser.skills.map((skill) => (
                    <span key={skill} className="tag">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                    No experience skills added yet
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="experience-content-column">
            <div className="experience-section-title">Previous Experience</div>
            <div className="experience-list">
              {experiences.length > 0 ? (
                experiences.map((experience) => (
                  <div key={experience.id} className="experience-card">
                    <h3 className="experience-title">{experience.jobTitle}</h3>
                    <p className="experience-description">{experience.description}</p>
                    {experience.images.length > 0 && (
                      <div className="experience-images">
                        {experience.images.map((imageSrc, index) => (
                          <img key={`${experience.id}-${index}`} src={imageSrc} alt={`${experience.jobTitle} ${index + 1}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="experience-empty">
                  No experiences yet. Click Add Experience to create one.
                </div>
              )}
            </div>
            <div className="experience-actions">
              <button type="button" className="experience-add-btn" onClick={openExperienceModal}>
                + Add Experience
              </button>
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
                <span className={`app-status status-${(app.status || "PENDING").toLowerCase()}`}>
                  {STATUS_LABELS[app.status] ?? "Pending"}
                </span>
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
            // Group the flat list of applicants by the listing they applied to,
            // so each listing gets its own heading and its own "Rank with AI" button.
            Object.values(
              incomingApplications.reduce((groups, app) => {
                const key = app.listingId ?? "unknown";
                if (!groups[key]) {
                  groups[key] = { listingId: app.listingId, listingTitle: app.listingTitle, apps: [] };
                }
                groups[key].apps.push(app);
                return groups;
              }, {})
            ).map((group) => {
              const sortMode = sortModes[group.listingId] ?? "recent";
              const ranking = rankings[group.listingId];
              const isRanking = rankingListingId === group.listingId;
              // AI order only "wins" when the AI sort is picked AND it succeeded.
              const showingAi = sortMode === "ai" && ranking && ranking.aiRanked;

              // Build the ordered list based on the chosen sort.
              // "recent" = natural order (backend already sorts newest first).
              let orderedApps = group.apps;
              if (showingAi && ranking.order.length > 0) {
                orderedApps = [...group.apps].sort(
                  (a, b) =>
                    ranking.order.indexOf(a.providerId) - ranking.order.indexOf(b.providerId)
                );
              } else if (sortMode === "alpha") {
                orderedApps = [...group.apps].sort((a, b) =>
                  a.providerName.localeCompare(b.providerName)
                );
              }

              return (
                <div key={group.listingId ?? "unknown"} className="rank-group">
                  <div className="rank-group-header">
                    <div className="rank-group-title">{group.listingTitle}</div>
                    {group.listingId && (
                      <div className="rank-sort">
                        <label className="rank-sort-label" htmlFor={`sort-${group.listingId}`}>
                          Sort by
                        </label>
                        <div className="rank-sort-select-wrap">
                          <select
                            id={`sort-${group.listingId}`}
                            className="rank-sort-select"
                            value={sortMode}
                            disabled={isRanking}
                            onChange={(e) => handleSortChange(group.listingId, e.target.value)}
                          >
                            <option value="recent">Most Recent</option>
                            <option value="alpha">Name (A–Z)</option>
                            <option value="ai">{isRanking ? "Ranking…" : "Rank with AI"}</option>
                          </select>
                          <ChevronDown size={14} className="rank-sort-chevron" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fallback notice when the AI could not rank this group. */}
                  {sortMode === "ai" && ranking && !ranking.aiRanked && (
                    <div className="rank-notice">
                      AI ranking is unavailable right now. Showing applicants in recent order.
                    </div>
                  )}

                  {orderedApps.map((app) => {
                    // A rank number only shows while the AI sort is active.
                    const rankNumber = showingAi
                      ? ranking.order.indexOf(app.providerId) + 1
                      : null;
                    // The reason travels with the app so the detail modal can show it.
                    const reason = showingAi ? ranking.reasons[app.providerId] : null;
                    const appForModal = reason ? { ...app, aiReason: reason, aiRank: rankNumber } : app;

                    return (
                      <div
                        key={app.id}
                        className="mini-card rank-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedApplication(appForModal)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedApplication(appForModal);
                          }
                        }}
                      >
                        {rankNumber && (
                          <span
                            className={`rank-badge ${rankNumber === 1 ? "rank-badge-top" : ""}`}
                            aria-label={`Rank ${rankNumber}`}
                          >
                            {rankNumber}
                          </span>
                        )}
                        <ProfilePicture initials="AP" size="xs" />
                        <div className="mini-info">
                          <div className="mini-title">{app.providerName}</div>
                          <div className="rank-card-sub">
                            Applied to <span>{group.listingTitle}</span>
                          </div>
                        </div>
                        <span className={`app-status status-${(app.status || "PENDING").toLowerCase()}`}>
                          {STATUS_LABELS[app.status] ?? "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })
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

            <label className="modal-label" htmlFor="profile-picture">Upload Profile Picture</label>
            <input id="profile-picture" type="file" accept="image/*" onChange={handleSingleImageChange("profilePicture")} />
            {formData.profilePicture && (
              <div className="experience-images" style={{ marginTop: 4, marginBottom: 8 }}>
                <img src={formData.profilePicture} alt="Profile preview" />
              </div>
            )}

            <label className="modal-label" htmlFor="profile-image">Upload Banner Image</label>
            <input id="profile-image" type="file" accept="image/*" onChange={handleSingleImageChange("imageUrl")} />
            {formData.imageUrl && (
              <div className="experience-images" style={{ marginTop: 4, marginBottom: 8 }}>
                <img src={formData.imageUrl} alt="Banner preview" />
              </div>
            )}

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
                onKeyDown={(e) => {
                  // Add the skill when the user presses Enter/Return.
                  // preventDefault stops the form from submitting.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
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

      {isExperienceModalOpen && (
        <div className="profile-modal-backdrop">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h2>Add Experience</h2>
              <p>Share your work experience details</p>
            </div>

            <label className="modal-label" htmlFor="experience-job-title">Job Title</label>
            <input
              id="experience-job-title"
              name="jobTitle"
              value={experienceForm.jobTitle}
              onChange={handleExperienceFieldChange}
              placeholder="Ex: Frontend Developer"
            />

            <label className="modal-label" htmlFor="experience-description">Description</label>
            <textarea
              id="experience-description"
              name="description"
              value={experienceForm.description}
              onChange={handleExperienceFieldChange}
              rows={4}
              placeholder="Describe what you worked on..."
            />

            <label className="modal-label" htmlFor="experience-images">Images</label>
            <input
              id="experience-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleExperienceImagesChange}
            />

            {experienceForm.images.length > 0 && (
              <div className="experience-images" style={{ marginTop: 8 }}>
                {experienceForm.images.map((imageSrc, index) => (
                  <img key={`preview-${index}`} src={imageSrc} alt={`Preview ${index + 1}`} />
                ))}
              </div>
            )}

            {experienceSaveError && <p className="error-text">{experienceSaveError}</p>}

            <div className="modal-actions">
              <button type="button" className="modal-btn modal-btn-secondary" onClick={closeExperienceModal}>
                Cancel
              </button>
              <button type="button" className="modal-btn modal-btn-primary" onClick={handleSaveExperience}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews modal — opens only when the Rating stat is clicked.
          Shows reviews about this profile's user. */}
      {showReviews && (
        <ReviewsPanel
          revieweeId={currentUser.id}
          currentUser={currentUser}
          onClose={() => setShowReviews(false)}
        />
      )}

      {/* Client clicks a received application -> detailed view with Accept/Reject */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusChange={(id, newStatus) => {
            // Update the card in place, and refetch so both tabs stay in sync.
            setIncomingApplications((prev) =>
              prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
            );
            setSelectedApplication((prev) =>
              prev && prev.id === id ? { ...prev, status: newStatus } : prev
            );
            setApplicationsRefresh((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}

export default UserProfileView;
