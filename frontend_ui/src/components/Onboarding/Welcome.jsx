// Welcome: the final onboarding screen. It confirms the user is all set, then
// the button drops them into the correct view for the role they picked.
// Clients land in the client view; providers/both land in the provider view.
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import Stepper from './Stepper';
import OnboardingChrome from './OnboardingChrome';
import './Onboarding.css';
import './Welcome.css';

const TEAL = '#4ecdc4';
const PURPLE = '#7c83c9';

function Welcome({ currentUser, onFinish }) {
  const navigate = useNavigate();

  const isProvider = currentUser?.role === 'PROVIDER' || currentUser?.role === 'BOTH';
  const accent = isProvider ? PURPLE : TEAL;
  // Client flow is 3 steps, provider/both flow is 5 — welcome is the last one.
  const totalSteps = isProvider ? 5 : 3;

  // Set the app's view mode to match the role, then go to the home feed.
  const handleEnter = () => {
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

        <button
          type="button"
          className="onboarding-primary-btn"
          style={{ background: accent }}
          onClick={handleEnter}
        >
          {isProvider ? 'Go to my provider dashboard' : 'Start browsing providers'}
        </button>
      </div>
    </OnboardingChrome>
  );
}

export default Welcome;
