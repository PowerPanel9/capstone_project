// Parses a raw location string into city + state to avoid exposing full addresses in API responses.

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

function extractCityStateFromLocation(locationValue) {
    if (!locationValue || typeof locationValue !== "string") {
        return { city: "", state: "" };
    }

    const parts = locationValue.split(",").map((p) => p.trim()).filter(Boolean);

    const streetLike = /\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|way|court|ct|place|pl)\b/i;
    const nonCity = /\b(county|parish|region|district|state|country|usa|united states)\b/i;
    const parseStateCode = (value) => {
        const trimmed = value.trim();
        const m = trimmed.match(/\b([A-Z]{2})\b/);
        if (m) return m[1];
        return US_STATE_NAMES_TO_CODE[trimmed.toLowerCase()] || "";
    };

    for (let i = 0; i < parts.length; i += 1) {
        const state = parseStateCode(parts[i]);
        if (!state) continue;
        for (let j = i - 1; j >= 0; j -= 1) {
            const candidate = parts[j].replace(/\d+/g, "").trim();
            if (!candidate || streetLike.test(candidate) || nonCity.test(candidate)) continue;
            return { city: candidate, state };
        }
    }

    if (parts.length >= 2) {
        const m = parts[1].match(/^(.+?)\s+([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/);
        if (m) return { city: m[1].trim(), state: m[2].trim() };
    }

    return { city: "", state: "" };
}

module.exports = { extractCityStateFromLocation };
