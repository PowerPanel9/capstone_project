import { useState } from 'react';
import { X, DollarSign, Loader } from 'lucide-react';
// NOTE: when restoring the preserved image-upload UI below, add `Upload` back
// to the lucide-react import above (it's used by the upload dropbox).
import { createListing } from '../../api/listings';
import { getPriceRecommendations } from '../../api/prices';
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

function CreateListingView({ onDone }) {
  const [form, setForm] = useState({
    title: "",
    category: "CLEANING",
    customCategory: "",
    price: "",
    description: "",
    location: "",
    imageUrl: ""
  });

  // The Required Skills field now works like a tag list instead of one
  // comma-separated string. `skills` holds the added skills as an array, and
  // `newSkill` holds whatever the user is currently typing in the input box.
  const [skills, setSkills] = useState([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
    if (form.category === "OTHER" && !form.customCategory) {
      setError("Please enter a custom category.");
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
      await createListing(newListing);
      onDone(); // go back to the feed on success
    } catch (err) {
      console.error("Failed to create listing:", err);
      // A 401 here means the user isn't logged in (no valid token).
      if (err.response?.status === 401) {
        setError("Please log in to post a listing.");
      } else {
        setError(err.response?.data?.error || "Could not create listing. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-wrap">
      <div className="create-header">
        <div>
          <div className="create-title">Create a Listing</div>
          <div className="create-sub">Find the perfect talent for your project</div>
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
          <label className="form-label">Location</label>
          <input
            className="form-input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Lincoln, NE"
          />
        </div>

        {/*
          TODO (future sprint): real image upload. The drag-and-drop UI below is
          PRESERVED for when we implement file uploads. For now (MVP) we use a
          simple image URL text box instead, so listings can have a picture
          without building the upload/storage feature yet.

          --- PRESERVED IMAGE UPLOAD UI (do not delete) ---
          <div>
            <label className="form-label">Cover Image (optional)</label>
            <div className="upload-area">
              <div className="upload-icon">
                <Upload size={18} />
              </div>
              <div className="upload-text">Drag & drop or click to upload</div>
              <div className="upload-hint">PNG, JPG up to 10MB</div>
            </div>
          </div>
          --- END PRESERVED IMAGE UPLOAD UI ---
        */}

        <div>
          <label className="form-label">Cover Image URL (optional)</label>
          <input
            className="form-input"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="e.g. https://example.com/photo.jpg"
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Posting…" : "Post Listing"}
        </button>
      </div>
    </div>
  );
}

export default CreateListingView;
