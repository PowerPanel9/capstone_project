import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './CategoryGrid.css';

// Custom category icons designed in Figma. Each category has two versions so
// the icon color matches the current theme: lavender for provider mode, teal
// for client mode.
import cleaningLav from '../../assets/categories/cleaning-lavender.svg';
import tutoringLav from '../../assets/categories/tutoring-lavender.png';
import plumbingLav from '../../assets/categories/plumbing-lavender.png';
import gardeningLav from '../../assets/categories/gardening-lavender.png';
import beautyLav from '../../assets/categories/beauty-lavender.png';
import babysittingLav from '../../assets/categories/babysitting-lavender.png';
import movingLav from '../../assets/categories/moving-lavender.png';
import handymanLav from '../../assets/categories/handyman-lavender.png';
import deliveryLav from '../../assets/categories/delivery-lavender.png';
import otherLav from '../../assets/categories/other-lavender.png';

import cleaningTeal from '../../assets/categories/cleaning-teal.svg';
import tutoringTeal from '../../assets/categories/tutoring-teal.png';
import plumbingTeal from '../../assets/categories/plumbing-teal.png';
import gardeningTeal from '../../assets/categories/gardening-teal.png';
import beautyTeal from '../../assets/categories/beauty-teal.png';
import babysittingTeal from '../../assets/categories/babysitting-teal.png';
import movingTeal from '../../assets/categories/moving-teal.png';
import handymanTeal from '../../assets/categories/handyman-teal.png';
import deliveryTeal from '../../assets/categories/delivery-teal.png';
import otherTeal from '../../assets/categories/other-teal.png';

// The categories match the ListingCategory enum in the backend (schema.prisma).
// `value` is sent to the API (?category=VALUE); `label` is what the user reads;
// `lav`/`teal` are the two themed icons.
const CATEGORIES = [
  { value: 'CLEANING', label: 'Cleaning', lav: cleaningLav, teal: cleaningTeal },
  { value: 'TUTORING', label: 'Tutoring', lav: tutoringLav, teal: tutoringTeal },
  { value: 'PLUMBING', label: 'Plumbing', lav: plumbingLav, teal: plumbingTeal },
  { value: 'GARDENING', label: 'Gardening', lav: gardeningLav, teal: gardeningTeal },
  { value: 'BEAUTY', label: 'Beauty', lav: beautyLav, teal: beautyTeal },
  { value: 'BABYSITTING', label: 'Babysitting', lav: babysittingLav, teal: babysittingTeal },
  { value: 'MOVING', label: 'Moving', lav: movingLav, teal: movingTeal },
  { value: 'HANDYMAN', label: 'Handyman', lav: handymanLav, teal: handymanTeal },
  { value: 'DELIVERY', label: 'Delivery', lav: deliveryLav, teal: deliveryTeal },
  { value: 'OTHER', label: 'Other', lav: otherLav, teal: otherTeal },
];

// CategoryGrid shows clickable tiles. Clicking one navigates to the home feed
// filtered by that category (e.g. /home?category=CLEANING). The "Other" tile
// works the same way — it lands on all listings whose category is OTHER.
function CategoryGrid({ userMode }) {
  const navigate = useNavigate();

  // Providers see the lavender icons; clients see the teal ones.
  const isClient = userMode === 'client';

  return (
    <div className="category-section">
      <h2 className="category-heading">Browse by category</h2>
      <div className="category-grid">
        {CATEGORIES.map(({ value, label, lav, teal }) => (
          <button
            key={value}
            className="category-tile"
            onClick={() => navigate(`/home?category=${value}`)}
          >
            <div className="category-tile-top">
              <span className="category-tile-label">{label}</span>
              <img
                className="category-tile-icon"
                src={isClient ? teal : lav}
                alt=""
              />
            </div>
            <span className="category-tile-more">
              SHOW MORE
              <ArrowUpRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryGrid;
