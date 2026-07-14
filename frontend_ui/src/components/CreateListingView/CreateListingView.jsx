import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import './CreateListingView.css';

function CreateListingView({ onDone }) {
  const [form, setForm] = useState({
    title: "",
    category: "Engineering",
    rate: "",
    description: "",
    tags: ""
  });

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
              {["Cleaning", "Tutor", "Plumber", "Gardener", "Babysitter", "Moving", "Handyman", "Delivery", "Other"].map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Rate</label>
            <input
              className="form-input"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              placeholder="e.g. $85/hr"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the role..."
          />
        </div>

        <div>
          <label className="form-label">Required Skills</label>
          <input
            className="form-input"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="e.g. English Speaking, Comfortable with Children (comma-separated)"
          />
        </div>

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

        <button className="submit-btn" onClick={onDone}>
          Post Listing
        </button>
      </div>
    </div>
  );
}

export default CreateListingView;
