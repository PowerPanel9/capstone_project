// RoleSelection: Step 1 of onboarding.
// The user picks how they want to use SideHustle: hire help (Client), earn
// money (Provider), or both. The choice is saved as the `role` enum value
// ("CLIENT" | "PROVIDER" | "BOTH"), then we send them to profile setup.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleX, Wallet, ArrowLeftRight, Check, ShieldCheck } from 'lucide-react';
import Stepper from './Stepper';
import OnboardingChrome from './OnboardingChrome';
import { updateUser } from '../../api/users';
import './Onboarding.css';
import './RoleSelection.css';

// Accent colours from the Figma design.
const TEAL = '#4ecdc4';
const PURPLE = '#7c83c9';

// The three cards. Keeping them in an array lets the JSX loop instead of
// repeating near-identical markup three times. `theme` picks the card's colours.
const ROLE_OPTIONS = [
  {
    value: 'CLIENT',
    theme: 'teal',
    Icon: CircleX,
    badge: 'Client',
    title: 'I want to hire help',
    description: 'I need help getting local tasks, chores, repairs, or errands checked off my to-do list safely.',
    benefits: [
      'Post unlimited custom tasks for free',
      'Access verified local service providers',
      'Secure payment protection system',
      'Friendly customer support 24/7',
    ],
  },
  {
    value: 'PROVIDER',
    theme: 'purple',
    Icon: Wallet,
    badge: 'Provider',
    title: 'I want to earn money',
    description: 'I want to offer my services, skills, or labor to build a flexible business on my own schedule.',
    benefits: [
      'Browse open gigs and send quotes',
      'Keep 100% of your tips and direct rates',
      'Flexible hours — work when you want',
      'Instant withdrawal to bank account',
    ],
  },
  {
    value: 'BOTH',
    theme: 'blend',
    Icon: ArrowLeftRight,
    badge: 'Client & Provider',
    title: 'I want to do both',
    description: 'I want the full experience: hiring local help and also listing my services to earn extra income.',
    benefits: [
      'Switch between Client and Provider with 1 tap',
      'Manage all hirings and tasks in one dashboard',
      'Special loyalty commission discounts',
      'All-in-one verified safety profile',
    ],
  },
];

function RoleSelection({ currentUser, onUserUpdate }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(currentUser?.role || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // The Continue button + accents match whichever card is picked. "Both" uses
  // teal as its button colour (the blend gradient lives on the card border).
  const buttonColor = selected === 'PROVIDER' ? PURPLE : TEAL;

  // Save the chosen role, then move on to the profile setup step.
  const handleContinue = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateUser(currentUser.id, { role: selected });
      onUserUpdate(updated); // keep App + localStorage in sync
      navigate('/onboarding/profile');
    } catch (err) {
      console.error('Failed to save role:', err);
      setError('Could not save your choice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingChrome accent={TEAL} track="Get Started">
      {/* Role picking is step 1. The shortest (client) flow has 3 steps; the
          bar just fills further once a provider role is chosen later. */}
      <Stepper current={1} total={3} accent={TEAL} />

      <div className="onboarding-header">
        <h1 className="onboarding-title">How would you like to use SideHustle?</h1>
        <p className="onboarding-subtitle">
          Choose your path below. You can change this selection or activate both modes at any time
          within your profile dashboard.
        </p>
      </div>

      <div className="role-cards">
        {ROLE_OPTIONS.map((option) => {
          const isActive = selected === option.value;
          const { Icon } = option;
          return (
            <button
              type="button"
              key={option.value}
              className={`role-card role-card-${option.theme} ${isActive ? 'role-card-active' : ''}`}
              onClick={() => setSelected(option.value)}
            >
              <div className="role-card-head">
                <div className="role-card-badge-group">
                  <span className="role-icon">
                    <Icon size={24} />
                  </span>
                  <span className="role-badge">{option.badge}</span>
                </div>
                {/* Radio-style indicator showing the single current selection. */}
                <span className={`role-radio ${isActive ? 'role-radio-on' : ''}`} />
              </div>

              <div className="role-card-body">
                <h2 className="role-card-title">{option.title}</h2>
                <p className="role-card-desc">{option.description}</p>
              </div>

              <ul className="role-benefits">
                {option.benefits.map((benefit) => (
                  <li key={benefit}>
                    <Check size={16} className="role-check" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {error && <p className="onboarding-error">{error}</p>}

      <button
        type="button"
        className="onboarding-primary-btn"
        style={{ background: buttonColor, marginTop: '48px' }}
        onClick={handleContinue}
        disabled={!selected || saving}
      >
        {saving ? 'Saving…' : 'Continue to profile setup'}
      </button>

      <p className="onboarding-privacy">
        <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
        You are secure. SideHustle guarantees data protection.
      </p>
    </OnboardingChrome>
  );
}

export default RoleSelection;
