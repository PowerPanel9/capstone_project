// ProviderServices: Step 3 of the provider/both flow.
// The user picks the services they provide from a grid of category pills. This
// is a MULTI-select, so we keep chosen values in an array and save it to the
// `categories` field using the enum casing (e.g. "CLEANING"). These categories
// are what clients filter by on the home page to find matching providers — they
// are separate from free-text `skills`, which the user adds on their profile.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import Stepper from './Stepper';
import OnboardingChrome from './OnboardingChrome';
import { updateUser } from '../../api/users';
import './Onboarding.css';
import './ProviderServices.css';

const PURPLE = '#7c83c9';

// These match the backend ListingCategory enum. `value` is what we save;
// `label` is the friendly text shown on the pill.
const CATEGORIES = [
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'TUTORING', label: 'Tutoring' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'GARDENING', label: 'Gardening' },
  { value: 'BEAUTY', label: 'Beauty' },
  { value: 'BABYSITTING', label: 'Babysitting' },
  { value: 'MOVING', label: 'Moving' },
  { value: 'HANDYMAN', label: 'Handyman' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'OTHER', label: 'Other' },
];

function ProviderServices({ currentUser, onUserUpdate }) {
  const navigate = useNavigate();
  // Keep onboarding selection in sync with the current saved profile.
  const [selected, setSelected] = useState(
    Array.isArray(currentUser?.categories) ? currentUser.categories : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Add the category if it isn't picked yet, otherwise remove it.
  const toggleCategory = (value) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Save selected categories to the user profile, then continue.
  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateUser(currentUser.id, { categories: selected });
      onUserUpdate?.(updated);
      navigate('/onboarding/build');
    } catch (err) {
      console.error('Failed to save provider categories:', err);
      setError('Could not save your categories. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingChrome accent={PURPLE} track="Service Provider Track">
      <Stepper current={3} total={5} accent={PURPLE} />

      <div className="onboarding-header">
        <h1 className="onboarding-title">Select services you provide</h1>
        <p className="onboarding-subtitle">
          Pick categories you excel at. We will send you opportunities matching these choices.
          Select all that apply.
        </p>
      </div>

      <div className="services-wrap">
        <div className="service-pills">
          {CATEGORIES.map((category) => {
            const isActive = selected.includes(category.value);
            return (
              <button
                type="button"
                key={category.value}
                className={`service-pill ${isActive ? 'service-pill-active' : ''}`}
                onClick={() => toggleCategory(category.value)}
              >
                {category.label}
                {isActive && <Check size={16} />}
              </button>
            );
          })}
        </div>

        <div className="onboarding-actions" style={{ marginTop: '24px' }}>
          <button
            type="button"
            className="onboarding-secondary-btn"
            onClick={() => navigate('/onboarding/profile')}
          >
            Back
          </button>
          <button
            type="button"
            className="onboarding-primary-btn"
            style={{ background: PURPLE, flex: 1 }}
            onClick={handleContinue}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </div>
        {error && <p className="onboarding-error">{error}</p>}
      </div>
    </OnboardingChrome>
  );
}

export default ProviderServices;
