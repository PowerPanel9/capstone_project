import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import './ApplicationModal.css';

function ApplicationModal({ listing, onClose }) {
  const [experiences, setExperiences] = useState(["", ""]);
  const [certs, setCerts] = useState([""]);

  const addExperience = () => {
    setExperiences([...experiences, ""]);
  };

  const addCert = () => {
    setCerts([...certs, ""]);
  };

  const updateExperience = (index, value) => {
    const newExperiences = [...experiences];
    newExperiences[index] = value;
    setExperiences(newExperiences);
  };

  const updateCert = (index, value) => {
    const newCerts = [...certs];
    newCerts[index] = value;
    setCerts(newCerts);
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-body">
          <div className="modal-header">
            <div>
              <div className="modal-title">Apply for Position</div>
              <div className="modal-sub">{listing?.title ?? "Senior React Developer"}</div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={17} />
            </button>
          </div>

          <div className="modal-fields">
            <div className="form-grid">
              <div>
                <label className="field-label">First Name</label>
                <input className="field-input" placeholder="Alex" />
              </div>
              <div>
                <label className="field-label">Last Name</label>
                <input className="field-input" placeholder="Rivera" />
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label className="field-label">Email</label>
                <input type="email" className="field-input" placeholder="alex@example.com" />
              </div>
              <div>
                <label className="field-label">Available From</label>
                <input type="date" className="field-input" />
              </div>
            </div>

            <div>
              <label className="field-label">Experience</label>
              <div className="exp-wrap">
                {experiences.map((exp, i) => (
                  <input
                    key={i}
                    className="exp-input"
                    value={exp}
                    onChange={(e) => updateExperience(i, e.target.value)}
                    placeholder={`Job title & company ${i + 1}`}
                  />
                ))}
                <button className="add-more-btn" onClick={addExperience}>
                  <Plus size={11} />
                  Add more
                </button>
              </div>
            </div>

            <div>
              <label className="field-label">Certifications</label>
              <div className="exp-wrap">
                {certs.map((cert, i) => (
                  <input
                    key={i}
                    className="exp-input"
                    value={cert}
                    onChange={(e) => updateCert(i, e.target.value)}
                    placeholder="Certification name or URL"
                  />
                ))}
                <button className="add-more-btn" onClick={addCert}>
                  <Plus size={11} />
                  Add more
                </button>
              </div>
            </div>

            <div>
              <label className="field-label">Resume URL</label>
              <input className="field-input" placeholder="https://your-resume.com" />
            </div>

            <div>
              <label className="field-label">Availability</label>
              <div className="form-grid">
                <select className="field-input">
                  <option>Immediately</option>
                  <option>Within 2 weeks</option>
                  <option>Within a month</option>
                </select>
                <select className="field-input">
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Weekends only</option>
                </select>
              </div>
            </div>
          </div>

          <button className="modal-submit">Submit Application</button>
        </div>
      </div>
    </div>
  );
}

export default ApplicationModal;
