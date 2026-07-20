import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

// Shows a row of 1-5 stars.
// - Display mode (default): fills stars up to `rating`.
// - Interactive mode: pass `interactive` + `onChange` to let the user pick a
//   rating; hovering previews the selection.
function StarRating({ rating, size = 13, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => {
        // In interactive mode the preview follows the hover; otherwise it's the rating.
        const filled = interactive ? (hovered || rating) >= n : rating >= n;
        return (
          <Star
            key={n}
            size={size}
            className={`star ${interactive ? "star-interactive" : ""}`}
            style={{
              color: filled ? "#FBBF24" : "#D8DCF5",
              fill: filled ? "#FBBF24" : "none",
            }}
            onMouseEnter={() => interactive && setHovered(n)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onChange?.(n)}
          />
        );
      })}
    </div>
  );
}

export default StarRating;
