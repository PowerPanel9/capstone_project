import { useState } from 'react';
import { X, DollarSign, Loader } from 'lucide-react';
import { createListing, updateListing } from '../../api/listings';
import { getPriceRecommendations } from '../../api/prices';
import { uploadFile } from '../../api/upload';
import AddressAutocomplete from '../AddressAutocomplete/AddressAutocomplete';
import './CreateListingView.css';

// The category options for the dropdown. `value` matches the backend
// ListingCategory enum exactly; `label` is the friendlier text the user sees.
const CATEGORY_OPTIONS = [
  { value: "CLEANING", label: "Cleaning" },
  { value: "TUTORING", label: "Tutoring" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "GARDENING", label: "Gardening" },
  { value: "BEAUTY", label: "Beauty" },
  { value: "BABYSITTING", label: "Babysitting" },
  { value: "MOVING", label: "Moving" },
  { value: "HANDYMAN", label: "Handyman" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "OTHER", label: "Other" },
];

// This one component powers BOTH creating a new listing and editing an existing
// one. When `listingId` + `initialData` are passed in (edit mode), the form
// starts pre-filled and saving calls the update API instead of the create API.
function CreateListingView({ onDone, listingId, initialData }) {
  // Are we editing an existing listing, or creating a brand new one?
  const isEditing = Boolean(listingId);

  const [form, setForm] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "",
    customCategory: initialData?.customCategory || "",
    price: initialData?.price != null ? String(initialData.price) : "",
    description: initialData?.description || "",
    location: initialData?.location || "",
    imageUrl: initialData?.imageUrl || ""
  });

  // The Required Skills field now works like a tag list instead of one
  // comma-separated string. `skills` holds the added skills as an array, and
  // `newSkill` holds whatever the user is currently typing in the input box.
  // In edit mode we start with the listing's existing skills.
  const [skills, setSkills] = useState(initialData?.skillsRequired || []);
  const [newSkill, setNewSkill] = useState("");

  // Add the text in the input as a new skill tag. Trims spaces, ignores empty
  // input, and skips duplicates so the same skill can't be added twice.
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setNewSkill("");
  };

  // Remove a skill tag when its "x" is clicked.
  const removeSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  // Upload the chosen cover image to AWS S3 (through our backend) and store the
  // returned public URL in the form. This is the same two-step flow the profile
  // picture uses: uploadFile() POSTs the file to /api/upload, which saves it to
  // S3 and returns a URL string; we keep that URL so the listing's image_url is
  // saved to the database on submit.
  const handleCoverImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setIsUploadingImage(true);
      const fileUrl = await uploadFile(file);
      setForm((prev) => ({ ...prev, imageUrl: fileUrl }));
    } catch (err) {
      console.error("Failed to upload cover image:", err);
      setError("Could not upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // True while the cover image is uploading to S3, so we can show "Uploading…"
  // and stop the user from submitting before the URL comes back.
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Whether the location currently in the form is a valid address. In edit mode
  // the saved location was already picked from the dropdown before, so we treat
  // it as valid to start. A NEW listing starts empty, which is also fine — the
  // value only becomes invalid once the user types without picking a suggestion.
  const [isLocationValid, setIsLocationValid] = useState(true);
  // Whether to SHOW the "pick a valid address" message. We only turn this on
  // when the user tries to submit with an invalid address, not while they type.
  const [showLocationError, setShowLocationError] = useState(false);

  // Price-suggestion feature state.
  const [priceRec, setPriceRec] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState(null);

  // Ask the backend for a suggested price based on similar listings
  // (same category + nearby location). Auto-fills the price field on success.
  const handleGetPriceSuggestion = async () => {
    setPriceError(null);
    if (!form.category) {
      setPriceError("Please select a category first.");
      return;
    }
    if (!form.location) {
      setPriceError("Please enter a location first.");
      return;
    }

    try {
      setLoadingPrice(true);
      const data = await getPriceRecommendations({
        category: form.category,
        location: form.location,
        description: form.description,
      });
      setPriceRec(data);
      // Pre-fill the price input with the suggestion (user can still edit it).
      if (data.recommendedPrice) {
        setForm((prev) => ({ ...prev, price: data.recommendedPrice.toString() }));
      }
    } catch (err) {
      console.error("Price recommendation error:", err);
      setPriceError("Could not fetch price suggestions. Please try again.");
    } finally {
      setLoadingPrice(false);
    }
  };

  // Build the payload (using the backend's snake_case field names) and POST it.
  const handleSubmit = async () => {
    setError(null);

    // Basic front-end validation so we don't send an obviously bad request.
    if (!form.title || !form.description || !form.price || !form.location) {
      setError("Please fill in the title, rate, description, and location.");
      return;
    }
    // The location must be one the user picked from the address dropdown, the
    // same rule used on the Edit Profile and onboarding location fields.
    if (!isLocationValid) {
      setShowLocationError(true);
      return;
    }
    if (!form.category) {
      setError("Please choose a category.");
      return;
    }
    if (form.category === "OTHER" && !form.customCategory) {
      setError("Please enter a custom category.");
      return;
    }
    // Don't submit while the cover image is still uploading, or we'd lose its URL.
    if (isUploadingImage) {
      setError("Please wait for the image to finish uploading.");
      return;
    }

    const newListing = {
      title: form.title,
      category: form.category, // already an enum value from the dropdown
      custom_category: form.category === "OTHER" ? form.customCategory : null,
      price: Number(form.price),
      description: form.description,
      skills_required: skills,
      location: form.location,
      image_url: form.imageUrl || null,
    };

    try {
      setIsSubmitting(true);
      // Edit mode updates the existing listing; create mode makes a new one.
      if (isEditing) {
        await updateListing(listingId, newListing);
      } else {
        await createListing(newListing);
      }
      onDone(); // go back on success
    } catch (err) {
      console.error("Failed to save listing:", err);
      // A 401 here means the user isn't logged in, or isn't the owner.
      if (err.response?.status === 401) {
        setError("You must be the owner and logged in to save this listing.");
      } else {
        setError(err.response?.data?.error || "Could not save listing. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-wrap">
      <div className="create-header">
        <div>
          <div className="create-title">{isEditing ? "Edit Listing" : "Create a Listing"}</div>
          <div className="create-sub">
            {isEditing
              ? "Update the details of your listing"
              : "Find the perfect talent for your project"}
          </div>
        </div>
        <button className="close-btn" onClick={onDone}>
          <X size={17} />
        </button>
      </div>

      <div className="form-card">
        <div>
          <label className="form-label">Listing Title</label>
          <input
            className="form-input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Babysitter for 6 Year Old Needed"
          />
        </div>

        <div className="form-grid">
          <div>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="" disabled>Choose a category</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="rate-label-row">
              <label className="form-label">Rate ($)</label>
              <button
                type="button"
                className="price-suggest-btn"
                onClick={handleGetPriceSuggestion}
                disabled={loadingPrice}
              >
                {loadingPrice ? (
                  <>
                    <Loader size={13} className="spin" />
                    Loading…
                  </>
                ) : (
                  <>
                    <DollarSign size={13} />
                    Get Price Suggestion
                  </>
                )}
              </button>
            </div>
            <input
              className="form-input"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 85"
            />
          </div>
        </div>

        {/* Price suggestion results (based on similar listings in the market) */}
        {priceRec && priceRec.recommendedPrice && (
          <div className="price-rec price-rec-success">
            <div className="price-rec-title">
              💡 Suggested Price: ${priceRec.recommendedPrice}
            </div>
            <div>{priceRec.reasoning}</div>
            {priceRec.priceRange?.min != null && (
              <div className="price-rec-range">
                Range: ${priceRec.priceRange.min.toFixed(0)} – ${priceRec.priceRange.max.toFixed(0)}
              </div>
            )}
          </div>
        )}

        {/* Shown when there's no market data to base a suggestion on */}
        {priceRec && !priceRec.recommendedPrice && (
          <div className="price-rec price-rec-warning">
            {priceRec.reasoning}
          </div>
        )}

        {priceError && (
          <div className="price-rec price-rec-error">{priceError}</div>
        )}

        {/* Custom category text box — only shown when the user picks "Other" */}
        {form.category === "OTHER" && (
          <div>
            <label className="form-label">Custom Category</label>
            <input
              className="form-input"
              value={form.customCategory}
              onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
              placeholder="e.g. Dog Walking"
            />
          </div>
        )}

        <div>
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the role"
          />
        </div>

        <div>
          <label className="form-label">Required Skills</label>
          {/* Show each added skill as a removable tag. */}
          <div className="skills-row">
            {skills.map((skill) => (
              <span key={skill} className="modal-skill-tag">
                {skill}
                <button
                  type="button"
                  className="skill-remove-btn"
                  onClick={() => removeSkill(skill)}
                >
                  x
                </button>
              </span>
            ))}
          </div>
          {/* Input + Add button. Pressing Enter adds the skill too. */}
          <div className="skill-add-row">
            <input
              className="form-input"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                // Add the skill when the user presses Enter/Return.
                // preventDefault stops any accidental form submission.
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. English Speaking"
            />
            <button
              type="button"
              className="price-suggest-btn"
              onClick={addSkill}
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="listing-location">Location</label>
          {/* Same address dropdown as the Edit Profile modal: the user types and
              picks a real address from the list. `picked` is true only after a
              suggestion is chosen, which is what makes the value "valid". */}
          <AddressAutocomplete
            inputId="listing-location"
            variant="modal"
            inputClassName="form-input"
            value={form.location}
            placeholder="Start typing your address…"
            onChange={(nextText, picked) => {
              setForm((prev) => ({ ...prev, location: nextText }));
              // A listing needs a location, so a non-empty value is only valid
              // once it's picked from the dropdown.
              setIsLocationValid(picked);
              if (picked) setShowLocationError(false);
            }}
          />
          {showLocationError && (
            <p className="error-text">
              Please select a valid address from the dropdown.
            </p>
          )}
        </div>

        <div>
          <label className="form-label" htmlFor="listing-cover-image">
            Cover Image (optional)
          </label>
          {/* Pick a file from your computer. On change we upload it to AWS S3
              (via /api/upload) and store the returned link in form.imageUrl,
              which is saved as the listing's image_url on submit. */}
          <input
            id="listing-cover-image"
            className="form-input"
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            disabled={isUploadingImage}
          />
          {isUploadingImage && (
            <p style={{ fontSize: 13, color: "var(--primary, #7B8FC8)", fontWeight: 600, marginTop: 6 }}>
              Uploading…
            </p>
          )}
          {/* Show a preview of the uploaded image once we have its S3 URL. */}
          {form.imageUrl && !isUploadingImage && (
            <img
              src={form.imageUrl}
              alt="Cover preview"
              style={{ marginTop: 8, maxWidth: "100%", borderRadius: 12 }}
            />
          )}
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting || isUploadingImage}>
          {isUploadingImage
            ? "Uploading…"
            : isSubmitting
            ? (isEditing ? "Saving…" : "Posting…")
            : (isEditing ? "Save Changes" : "Post Listing")}
        </button>
      </div>
    </div>
  );
}

export default CreateListingView;
