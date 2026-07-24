// ProviderServices: Step 3 of the provider/both flow.
// The user picks the services they provide from a grid of category pills. This
// is a MULTI-select, so we keep chosen values in an array and save it as the
// `skills` field using the enum casing (e.g. "CLEANING").
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import Stepper from './Stepper';
import OnboardingChrome from './OnboardingChrome';
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

function ProviderServices() {
  const navigate = useNavigate();
  // We keep the selection only for the pill UI on this page. For now we do NOT
  // save it: these are service CATEGORIES (used later to filter the client home
  // page by category), not free-text skills, and there is no field for them yet.
  // A dedicated `services` field will be added later; until then we don't write
  // to `skills`, so the profile's Skills section stays clean.
  const [selected, setSelected] = useState([]);

  // Add the category if it isn't picked yet, otherwise remove it.
  const toggleCategory = (value) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Nothing is saved yet, so just move on to the next step.
  const handleContinue = () => navigate('/onboarding/build');

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
          >
            Continue
          </button>
        </div>
      </div>
    </OnboardingChrome>
  );
}

export default ProviderServices;
