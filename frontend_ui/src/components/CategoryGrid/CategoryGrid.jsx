import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
// One tile's width (130px) plus the row gap (16px). We slide the track by this
// much for each "one category" step. Keep in sync with the CSS.
const TILE_STEP = 146;

function CategoryGrid({ userMode }) {
  const navigate = useNavigate();

  // Providers see the lavender icons; clients see the teal ones.
  const isClient = userMode === 'client';

  // `order` is the current left-to-right order of tiles. We rotate it as the
  // user pages through, which is what makes the carousel loop forever.
  const [order, setOrder] = useState(CATEGORIES);
  // `shift` is how many tiles the track is nudged sideways (0, or -1 mid-slide).
  const [shift, setShift] = useState(0);
  // Whether the slide should animate. We turn it off for the instant, invisible
  // "reset" step after a slide finishes.
  const [animate, setAnimate] = useState(true);
  // Whether to show the arrows. We hide them when every tile already fits in the
  // visible window (e.g. on a wide screen or when the chat panel is closed).
  const [showArrows, setShowArrows] = useState(true);

  // A ref to the window element so we can measure it.
  const rowRef = useRef(null);

  // Measure whether the tiles overflow the window. If the full track (all tiles)
  // is wider than the visible window, we need arrows; otherwise everything fits
  // and we hide them. A ResizeObserver re-runs this whenever the window's size
  // changes — including when the chat panel opens/closes and the feed re-widths.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const measure = () => {
      // scrollWidth = full content width; clientWidth = visible width.
      // +2 tolerance for sub-pixel rounding.
      setShowArrows(row.scrollWidth > row.clientWidth + 2);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  // Next: slide the whole track left by exactly one tile. When the slide ends
  // (handleSlideEnd), we move the tile that went off-screen to the end and
  // snap back to 0, ready to slide again.
  const next = () => {
    if (shift !== 0) return; // ignore extra clicks while a slide is running
    setAnimate(true);
    setShift(-1);
  };

  // Previous is the mirror image. First, with animation OFF, move the last tile
  // to the front and offset the track by one so nothing visibly moves yet. Then
  // on the next frame, animate the track back to 0 so it slides right by one.
  const prev = () => {
    if (shift !== 0) return;
    setAnimate(false);
    setOrder((o) => {
      const copy = [...o];
      copy.unshift(copy.pop()); // last tile becomes the new first
      return copy;
    });
    setShift(-1);
    // Two animation frames: the first lets React paint the un-animated offset,
    // the second turns animation on and slides back to 0.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimate(true);
        setShift(0);
      });
    });
  };

  // Runs when a slide animation finishes.
  const handleSlideEnd = () => {
    // Only the "next" slide ends at shift === -1. Move the first tile to the
    // end and reset the offset (without animating) so the row looks unchanged
    // but is lined up to slide again.
    if (shift === -1) {
      setAnimate(false);
      setOrder((o) => {
        const copy = [...o];
        copy.push(copy.shift()); // first tile moves to the end
        return copy;
      });
      setShift(0);
    }
  };

  return (
    <div className="category-section">
      <h2 className="category-heading">Browse by category</h2>

      {/* The carousel: a left arrow, the sliding row of tiles, a right arrow.
          When all tiles already fit (!showArrows) the arrows are made invisible
          but still take up their space, so the tiles don't shift sideways. */}
      <div className={`category-carousel ${showArrows ? '' : 'category-carousel-fill'}`}>
        <button
          className={`category-arrow category-arrow-left ${showArrows ? '' : 'category-arrow-hidden'}`}
          onClick={prev}
          aria-label="Previous categories"
        >
          <ChevronLeft size={20} />
        </button>

        {/* .category-row is the fixed "window"; .category-track is the wider
            strip inside it that we slide with transform. */}
        <div className="category-row" ref={rowRef}>
          <div
            className="category-track"
            style={{
              transform: `translateX(${shift * TILE_STEP}px)`,
              transition: animate ? 'transform 0.3s ease' : 'none',
            }}
            onTransitionEnd={handleSlideEnd}
          >
            {order.map(({ value, label, lav, teal }) => (
              <button
                key={value}
                className="category-tile"
                onClick={() => navigate(`/home?category=${value}`)}
              >
                <img
                  className="category-tile-icon"
                  src={isClient ? teal : lav}
                  alt=""
                />
                <span className="category-tile-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className={`category-arrow category-arrow-right ${showArrows ? '' : 'category-arrow-hidden'}`}
          onClick={next}
          aria-label="More categories"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default CategoryGrid;
