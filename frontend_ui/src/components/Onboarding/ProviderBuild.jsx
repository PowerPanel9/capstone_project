// ProviderBuild: Step 4 of the provider/both flow.
// The user can paste links to their resume and any certifications. There is no
// file upload yet, so these are plain URL fields. Saved as `resumeUrl` and
// `certificationUrl` with PUT /api/users/:id.
//
// Note: the Figma design also showed a "Post an Experience" card and a Bio
// field here, but those were intentionally dropped for now (bio is collected
// on the profile step), so this page keeps just the two link fields.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Award } from 'lucide-react';
import Stepper from './Stepper';
import OnboardingChrome from './OnboardingChrome';
import { updateUser } from '../../api/users';
import './Onboarding.css';
import './ProviderBuild.css';

const PURPLE = '#7c83c9';

function ProviderBuild({ currentUser, onUserUpdate }) {
  const navigate = useNavigate();
  const [resumeUrl, setResumeUrl] = useState(currentUser?.resumeUrl || '');
  const [certificationUrl, setCertificationUrl] = useState(currentUser?.certificationUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateUser(currentUser.id, { resumeUrl, certificationUrl });
      onUserUpdate(updated);
      navigate('/onboarding/welcome');
    } catch (err) {
      console.error('Failed to save profile links:', err);
      setError('Could not save your links. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Skip saves nothing and moves straight to the welcome screen.
  const handleSkip = () => navigate('/onboarding/welcome');

  return (
    <OnboardingChrome accent={PURPLE} track="Service Provider Track">
      <Stepper current={4} total={5} accent={PURPLE} />

      <div className="onboarding-header">
        <h1 className="onboarding-title">Build your verified profile</h1>
        <p className="onboarding-subtitle">
          Add links to your resume and certifications so clients can trust your work. Both are
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
            type="url"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="Paste a link (https://…)"
          />
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
            type="url"
            value={certificationUrl}
            onChange={(e) => setCertificationUrl(e.target.value)}
            placeholder="Paste a link (https://…)"
          />
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
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Complete Profile & Continue'}
          </button>
        </div>
      </div>
    </OnboardingChrome>
  );
}

export default ProviderBuild;
