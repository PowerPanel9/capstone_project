// ProfileSetup: Step 2 of onboarding, shared by both client and provider flows.
// It collects two optional fields (location and bio) inside a form card and
// saves them with PUT /api/users/:id. The title, accent colour, step count,
// and "Continue" destination all switch based on the role picked on step 1.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from './Stepper';
import OnboardingChrome from './OnboardingChrome';
import AddressAutocomplete from '../AddressAutocomplete/AddressAutocomplete';
import { updateUser } from '../../api/users';
import './Onboarding.css';
import './ProfileSetup.css';

const TEAL = '#4ecdc4';
const PURPLE = '#7c83c9';

function ProfileSetup({ currentUser, onUserUpdate }) {
  const navigate = useNavigate();
  const [location, setLocation] = useState(currentUser?.location || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Location is optional here, so an empty box is valid. A non-empty value is
  // only valid once the user picks an address from the dropdown. A location
  // loaded from an existing profile counts as valid to start.
  const [isLocationValid, setIsLocationValid] = useState(true);
  // Whether to SHOW the "pick a valid address" message. We only turn this on
  // when the user clicks Continue with an invalid address, not while they type.
  const [showLocationError, setShowLocationError] = useState(false);

  // A provider or "both" user has a longer flow (5 steps) and a purple accent;
  // a client-only user has the shorter 3-step teal flow.
  const isProvider = currentUser?.role === 'PROVIDER' || currentUser?.role === 'BOTH';
  const accent = isProvider ? PURPLE : TEAL;
  const totalSteps = isProvider ? 5 : 3;

  // Where "Continue" goes next: providers pick services, clients go to welcome.
  const nextPage = isProvider ? '/onboarding/services' : '/onboarding/welcome';

  // Save location + bio, then continue. Both fields are optional.
  const handleContinue = async () => {
    if (saving) return;
    // Check the address only when the user clicks Continue. If it's not valid,
    // show the message under the box and stop here (don't continue).
    if (!isLocationValid) {
      setShowLocationError(true);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateUser(currentUser.id, { location, bio });
      onUserUpdate(updated);
      navigate(nextPage);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Skip saves nothing and just moves on to the next step.
  const handleSkip = () => navigate(nextPage);

  const track = isProvider ? 'Service Provider Track' : 'Client Success Track';

  return (
    <OnboardingChrome accent={accent} track={track}>
      <Stepper current={2} total={totalSteps} accent={accent} />

      <div className="onboarding-header">
        <h1 className="onboarding-title">
          {isProvider ? 'Let’s set up your provider profile' : 'Let’s set up your client profile'}
        </h1>
        <p className="onboarding-subtitle">
          Sharing your general location and a brief intro helps others feel confident working with
          you. You can adjust this information anytime.
        </p>
      </div>

      <div className="onboarding-form-card">
        {/* Location field with a map-pin icon inside the input. */}
        <div className="ob-field">
          <div className="ob-label-row">
            <label htmlFor="location">Where do you typically need tasks done?</label>
            <span className="ob-optional">Optional</span>
          </div>
          <AddressAutocomplete
            inputId="location"
            value={location}
            placeholder="Start typing your address…"
            onChange={(nextText, picked) => {
              setLocation(nextText);
              const nextValid = nextText.trim() === '' || picked;
              setIsLocationValid(nextValid);
              // Once the value becomes valid again, clear any error we showed.
              if (nextValid) setShowLocationError(false);
            }}
          />
          {showLocationError && (
            <p className="onboarding-error">
              Please select a valid address from the dropdown.
            </p>
          )}
        </div>

        {/* Bio textarea. */}
        <div className="ob-field">
          <div className="ob-label-row">
            <label htmlFor="bio">Tell us a bit about yourself</label>
            <span className="ob-optional">Optional</span>
          </div>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A sentence or two about you…"
          />
        </div>

        {error && <p className="onboarding-error">{error}</p>}

        <div className="onboarding-actions">
          <button
            type="button"
            className="onboarding-secondary-btn"
            style={{ flex: 1 }}
            onClick={handleSkip}
          >
            Skip for now
          </button>
          <button
            type="button"
            className="onboarding-primary-btn"
            style={{ background: accent, flex: 1 }}
            onClick={handleContinue}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    </OnboardingChrome>
  );
}

export default ProfileSetup;
