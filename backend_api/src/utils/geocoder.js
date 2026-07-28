const NodeGeocoder = require("node-geocoder");
const axios = require("axios");

const geocoder = NodeGeocoder({
  provider: "locationiq",
  apiKey: process.env.LOCATIONIQ_API_KEY,
  formatter: null,
});

// Ask LocationIQ for a short list of address suggestions that match what the
// user has typed so far. This powers the "dropdown of options" in the profile
// form. node-geocoder only does full geocoding, so we call the LocationIQ
// autocomplete endpoint directly with axios.
async function getAddressSuggestions(query) {
  if (!process.env.LOCATIONIQ_API_KEY) {
    throw new Error("LOCATIONIQ_API_KEY is not configured");
  }

  const response = await axios.get("https://api.locationiq.com/v1/autocomplete", {
    params: {
      key: process.env.LOCATIONIQ_API_KEY,
      q: query,
      limit: 5, // at most 5 options so the dropdown stays short
      dedupe: 1, // drop near-duplicate results
    },
  });

  const results = Array.isArray(response.data) ? response.data : [];

  // Return only the fields the frontend needs: a display label plus the
  // coordinates (kept in case we want them later).
  return results.map((place) => ({
    label: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
  }));
}

async function forwardGeocode(addressText) {
  if (!process.env.LOCATIONIQ_API_KEY) {
    throw new Error("LOCATIONIQ_API_KEY is not configured");
  }

  const results = await geocoder.geocode(addressText);
  if (!results || results.length === 0) {
    throw new Error("Address not found");
  }

  const first = results[0];
  console.log("node-geocoder results", results);

  return {
    latitude: first.latitude,
    longitude: first.longitude,
    locationText: first.formattedAddress || first.formatted || addressText,
    city: first.city || first.administrativeLevels?.level2long || "",
    state:
      first.stateCode ||
      first.administrativeLevels?.level1short ||
      first.state ||
      "",
  };
}

async function reverseGeocode(latitude, longitude) {
  if (!process.env.LOCATIONIQ_API_KEY) {
    throw new Error("LOCATIONIQ_API_KEY is not configured");
  }

  const results = await geocoder.reverse({ lat: latitude, lon: longitude });
  if (!results || results.length === 0) return null;
  return results[0].formattedAddress || results[0].formatted || null;
}

module.exports = { forwardGeocode, reverseGeocode, getAddressSuggestions };