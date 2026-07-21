// location.js
// Small helper for showing a location in the UI. Users can save a full mailing
// address (e.g. "123 Main Street, Austin TX 78701"), but on cards and detail
// pages we only want the city and state (e.g. "Austin, TX"). This function pulls
// that out of whatever address string it is given.

export function formatCityState(locationValue) {
  if (!locationValue || typeof locationValue !== "string") return "Location";

  const parts = locationValue
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const US_STATE_NAMES_TO_CODE = {
    alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
    colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
    hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
    kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
    massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
    montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
    ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
    "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
    vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
    wyoming: "WY",
  };

  const streetLikePattern =
    /\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|way|court|ct|place|pl)\b/i;
  const nonCityPattern =
    /\b(county|parish|region|district|state|country|usa|united states)\b/i;

  const parseStateCode = (value) => {
    const trimmed = value.trim();
    const abbrMatch = trimmed.match(/\b([A-Z]{2})\b/);
    if (abbrMatch) return abbrMatch[1];
    return US_STATE_NAMES_TO_CODE[trimmed.toLowerCase()] || "";
  };

  // Prefer a deterministic "city, state" extraction:
  // find state token and walk backward to the nearest valid city segment.
  for (let i = 0; i < parts.length; i += 1) {
    const state = parseStateCode(parts[i]);
    if (!state) continue;

    for (let j = i - 1; j >= 0; j -= 1) {
      const candidate = parts[j].replace(/\d+/g, "").trim();
      if (!candidate) continue;
      if (streetLikePattern.test(candidate)) continue;
      if (nonCityPattern.test(candidate)) continue;
      return `${candidate}, ${state}`;
    }
  }

  // Handle common format: "Street Address, City ST 12345"
  if (parts.length === 2) {
    const tail = parts[1];
    const cityStateZipMatch = tail.match(/^(.+?)\s+([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/);
    if (cityStateZipMatch) {
      const city = cityStateZipMatch[1].trim();
      const state = cityStateZipMatch[2].trim();
      if (city && state) return `${city}, ${state}`;
    }
  }

  if (parts.length >= 2) {
    // Fallback: avoid returning a street line when possible.
    if (/^\d+/.test(parts[0]) || streetLikePattern.test(parts[0])) {
      for (let i = 1; i < parts.length; i += 1) {
        if (!streetLikePattern.test(parts[i]) && !nonCityPattern.test(parts[i])) {
          return parts[i];
        }
      }
      return "Location";
    }

    // If second part has a "City ST [ZIP]" pattern, extract and return "City, ST".
    const secondPartCityState = parts[1].match(/^(.+?)\s+([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/);
    if (secondPartCityState) {
      return `${secondPartCityState[1].trim()}, ${secondPartCityState[2].trim()}`;
    }

    return `${parts[0]}, ${parts[1]}`;
  }

  return parts[0] || "Location";
}
