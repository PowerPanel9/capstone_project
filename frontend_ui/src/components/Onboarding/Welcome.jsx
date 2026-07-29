// Welcome: the final onboarding screen. It confirms the user is all set, then
// the button drops them into the correct view for the role they picked.
// Clients land in the client view; providers/both land in the provider view.
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import Stepper from './Stepper';
import OnboardingChrome from './OnboardingChrome';
import { updateUser } from '../../api/users';
import './Onboarding.css';
import './Welcome.css';

const TEAL = '#4ecdc4';
const PURPLE = '#7c83c9';

function Welcome({ currentUser, onUserUpdate, onFinish }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // True when a CLIENT-only user got here from the "sign up as a provider"
  // toggle — see App.jsx's toggleUserMode. Their role is still CLIENT in the
  // database; we only save it as BOTH once they click through below, so
  // hitting Back anywhere in this flow never counts as "became a provider".
  const addingProviderRole = Boolean(location.state?.addingProviderRole);
  const isProvider =
    currentUser?.role === 'PROVIDER' || currentUser?.role === 'BOTH' || addingProviderRole;
  const accent = isProvider ? PURPLE : TEAL;
  // Client flow is 3 steps, provider/both flow is 5 — welcome is the last one.
  const totalSteps = isProvider ? 5 : 3;

  // Save role: BOTH now (only for someone adding the provider role via the
  // toggle), then set the app's view mode and go to the home feed.
  const handleEnter = async () => {
    if (saving) return;
    setError('');

    if (addingProviderRole) {
      try {
        setSaving(true);
        const updated = await updateUser(currentUser.id, { role: 'BOTH' });
        onUserUpdate(updated); // keep App state + localStorage in sync
      } catch (err) {
        console.error('Failed to save the provider role:', err);
        setError('Could not finish setup. Please try again.');
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    const mode = isProvider ? 'provider' : 'client';
    onFinish(mode); // App saves the mode and we land in the right view
    navigate('/home');
  };

  const track = isProvider ? 'Service Provider Track' : 'Client Success Track';

  return (
    <OnboardingChrome accent={accent} track={track}>
      <Stepper current={totalSteps} total={totalSteps} accent={accent} />

      <div className="welcome-body">
        <div className="welcome-check" style={{ background: accent }}>
          <Check size={40} />
        </div>

        <div className="onboarding-header">
          <h1 className="onboarding-title">You’re all set!</h1>
          <p className="onboarding-subtitle">
            {isProvider
              ? 'Your provider profile is ready. Start finding tasks and earning today.'
              : 'Your client profile is ready. Start finding trusted help nearby.'}
          </p>
        </div>

        {error && <p className="onboarding-error">{error}</p>}

        <button
          type="button"
          className="onboarding-primary-btn"
          style={{ background: accent }}
          onClick={handleEnter}
          disabled={saving}
        >
          {saving
            ? 'Saving…'
            : isProvider
              ? 'Go to my provider dashboard'
              : 'Start browsing providers'}
        </button>
      </div>
    </OnboardingChrome>
  );
}

export default Welcome;
