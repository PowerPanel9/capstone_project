// ProviderBuild: Step 4 of the provider/both flow.
// The user uploads their resume and any certifications as files. Each file is
// sent to S3 through our backend (POST /api/upload), which returns a public URL.
// We then save those URLs as `resumeUrl` and `certificationUrl` with
// PUT /api/users/:id.
//
// Note: the Figma design also showed a "Post an Experience" card and a Bio
// field here, but those were intentionally dropped for now (bio is collected
// on the profile step), so this page keeps just the two upload cards.
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Award } from 'lucide-react';
import Stepper from './Stepper';
import OnboardingChrome from './OnboardingChrome';
import { updateUser } from '../../api/users';
import { uploadFile } from '../../api/upload';
import './Onboarding.css';
import './ProviderBuild.css';

const PURPLE = '#7c83c9';

function ProviderBuild({ currentUser, onUserUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Carried forward from ProviderServices — see the comment there.
  const addingProviderRole = Boolean(location.state?.addingProviderRole);
  const [resumeUrl, setResumeUrl] = useState(currentUser?.resumeUrl || '');
  const [certificationUrl, setCertificationUrl] = useState(currentUser?.certificationUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Which file is currently uploading, so we can show "Uploading…" on that card.
  const [uploadingField, setUploadingField] = useState('');

  // Send the chosen file to S3 and remember the returned URL in state.
  // `field` is either "resume" or "certification" so we know which one to set.
  const handleFileUpload = (field) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadingField(field);
    try {
      const url = await uploadFile(file);
      if (field === 'resume') setResumeUrl(url);
      else setCertificationUrl(url);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('Could not upload your file. Please try again.');
    } finally {
      setUploadingField('');
    }
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateUser(currentUser.id, { resumeUrl, certificationUrl });
      onUserUpdate(updated);
      navigate('/onboarding/welcome', { state: { addingProviderRole } });
    } catch (err) {
      console.error('Failed to save profile links:', err);
      setError('Could not save your links. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Skip saves nothing and moves straight to the welcome screen.
  const handleSkip = () => navigate('/onboarding/welcome', { state: { addingProviderRole } });

  return (
    <OnboardingChrome accent={PURPLE} track="Service Provider Track">
      <Stepper current={4} total={5} accent={PURPLE} />

      <div className="onboarding-header">
        <h1 className="onboarding-title">Build your verified profile</h1>
        <p className="onboarding-subtitle">
          Upload your resume and certifications so clients can trust your work. Both are
          optional and appear as trust badges on your public page.
        </p>
      </div>

      <div className="build-block">
        {/* Resume link card */}
        <div className="build-card">
          <div className="build-icon-box">
            <FileText size={24} />
          </div>
          <div className="build-card-text">
            <h2>Add Resume</h2>
            <p>Highlight your career path &amp; credentials</p>
          </div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleFileUpload('resume')}
            disabled={uploadingField === 'resume'}
          />
          {uploadingField === 'resume' && <span className="build-status">Uploading…</span>}
          {resumeUrl && uploadingField !== 'resume' && (
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="build-status">
              Resume uploaded ✓
            </a>
          )}
        </div>

        {/* Certification link card */}
        <div className="build-card">
          <div className="build-icon-box">
            <Award size={24} />
          </div>
          <div className="build-card-text">
            <h2>Add Certification</h2>
            <p>Secure verification of skills / licenses</p>
          </div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleFileUpload('certification')}
            disabled={uploadingField === 'certification'}
          />
          {uploadingField === 'certification' && <span className="build-status">Uploading…</span>}
          {certificationUrl && uploadingField !== 'certification' && (
            <a href={certificationUrl} target="_blank" rel="noopener noreferrer" className="build-status">
              Certification uploaded ✓
            </a>
          )}
        </div>

        {error && <p className="onboarding-error">{error}</p>}

        <div className="onboarding-actions">
          <button type="button" className="onboarding-secondary-btn" onClick={handleSkip}>
            Skip for now
          </button>
          <button
            type="button"
            className="onboarding-primary-btn"
            style={{ background: PURPLE, flex: 1 }}
            onClick={handleContinue}
            disabled={saving || Boolean(uploadingField)}
          >
            {saving ? 'Saving…' : 'Complete Profile & Continue'}
          </button>
        </div>
      </div>
    </OnboardingChrome>
  );
}

export default ProviderBuild;
